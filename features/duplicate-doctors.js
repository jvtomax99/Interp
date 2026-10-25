/* Duplicate doctors (duplicateDoctorGroups, the merge:
   mergeDoctorRecords, mergeDuplicateDoctors, and the banner on the doctor
   list, duplicateBannerHtml): moved verbatim out of index.html on
   2026-10-25 (docs/split-index.md, phase 3). Loaded by a plain
   <script src> just before index.html's own script. Nothing here runs as
   the page loads (only declarations); the names it uses from index.html
   (DOCTOR_DIRECTORY, db, showToast...) are read when a function runs.
   Keep it that way: a top-level line here that calls into index.html
   would run before index.html has. */

/* ---------- Duplicate doctors ----------
   Entries key off the normalized full name, so "Barry Love" and "Barry A.
   Love" become two separate doctors with two separate term lists and nothing
   connects them. This finds the likely pairs and merges them into one.

   The rule is deliberately narrow: same last name, and first names that are
   equal or one is an initial of the other. That catches middle initials and
   "Dr." prefixes without ever suggesting that two different Dr. Garcías are
   the same person. */
function nameParts(name){
  const clean = (name || '')
    .replace(/^\s*(dr\.?|doctor|prof\.?)\s+/i, '')
    .replace(/,.*$/, '')
    .replace(/\b(m\.?d\.?|d\.?o\.?|ph\.?d\.?)\b/gi, '')
    .trim();
  const words = normLoc(clean).toLowerCase().replace(/[^a-z\s'-]/g, '').split(/\s+/).filter(Boolean);
  if(!words.length) return null;
  return { first: words[0], last: words[words.length - 1], all: words };
}

function looksLikeSamePerson(a, b){
  const pa = nameParts(a), pb = nameParts(b);
  if(!pa || !pb) return false;
  if(pa.last !== pb.last) return false;
  if(pa.first === pb.first) return true;
  // One side abbreviated to an initial: "B. Love" vs "Barry Love".
  const initialMatch = (x, y) => x.length === 1 && y.startsWith(x);
  return initialMatch(pa.first, pb.first) || initialMatch(pb.first, pa.first);
}

// Two regions' namesakes are two people (see doctorDirIdFor).
function sameRegionOrUnknown(a, b){
  const ra = doctorRegion(a), rb = doctorRegion(b);
  return !ra || !rb || ra === rb;
}

function duplicateDoctorGroups(){
  const groups = [];
  const used = new Set();
  DOCTOR_DIRECTORY.forEach((d, i) => {
    if(used.has(d.id)) return;
    const matches = DOCTOR_DIRECTORY.filter((other, j) =>
      j > i && !used.has(other.id) && looksLikeSamePerson(d.name, other.name) && sameRegionOrUnknown(d, other));
    if(matches.length){
      [d, ...matches].forEach(x => used.add(x.id));
      groups.push([d, ...matches]);
    }
  });
  return groups;
}

// The record you chose wins on name and on any field where it has a value;
// every other field falls through to the first non-empty value in the rest,
// so nothing a teammate typed is lost to whichever entry happened to be kept.
// Asking which name to keep and then overriding it with a heuristic would
// make the choice a lie.
function mergeDoctorRecords(records, preferredId){
  const sorted = [...records].sort((a, b) => {
    if(a.id === preferredId) return -1;
    if(b.id === preferredId) return 1;
    return (b.name || '').length - (a.name || '').length;
  });
  const keep = { ...sorted[0] };
  const firstNonEmpty = (field) => {
    for(const r of sorted){
      const v = r[field];
      if(v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
    return undefined;
  };
  ['specialty','hospitalLocation','locationDetails','locationGroup','photo','photoPath','source','lastResearchedBy']
    .forEach(f => { const v = firstNonEmpty(f); if(v !== undefined) keep[f] = v; });

  // Keep whichever research is richest, not whichever is newest.
  let bestResearch = null, bestCount = -1;
  records.forEach(r => {
    const n = researchTermCount(r.researchResult);
    if(r.researchResult && n > bestCount){ bestCount = n; bestResearch = r.researchResult; }
  });
  if(bestResearch) keep.researchResult = bestResearch;

  keep.lastResearchedAt = Math.max(...records.map(r => r.lastResearchedAt || 0)) || undefined;

  // Team terms are hand-written by interpreters, so they all survive —
  // de-duplicated on the English side.
  const seen = new Set();
  const terms = [];
  records.forEach(r => (Array.isArray(r.terms) ? r.terms : []).forEach(t => {
    const k = (t.en || '').trim().toLowerCase();
    if(!k || seen.has(k)) return;
    seen.add(k); terms.push(t);
  }));
  if(terms.length) keep.terms = terms;

  return keep;
}

async function mergeDuplicateDoctors(keepId){
  if(!whoAmI()){ requireName(() => mergeDuplicateDoctors(keepId)); return; }
  const group = duplicateDoctorGroups().find(g => g.some(d => d.id === keepId));
  if(!group){ showToast('Nothing left to merge.'); return; }

  const target = group.find(d => d.id === keepId) || group[0];
  const merged = mergeDoctorRecords(group, target.id);
  merged.id = target.id;
  merged.name = target.name;

  try{
    await persistDoctorDirectoryEntry(merged.id, merged);
    // Every tip moves to the doctor kept, the others' old notes as real tips.
    const moved = group.filter(o => o.id !== merged.id).flatMap(o => doctorTips(o).map(t =>
      t.legacy ? { id: genId(), text: t.text, by: t.by || 'Someone', at: t.at || Date.now() } : t));
    if(moved.length){
      await trackWrite(db.collection('doctor-directory').doc(merged.id).update({ tips: firebase.firestore.FieldValue.arrayUnion(...moved) }));
      merged.tips = [...(Array.isArray(merged.tips) ? merged.tips : []), ...moved];
    }
    for(const other of group){
      if(other.id === merged.id) continue;
      // Trashed rather than dropped — a bad merge is recoverable.
      await trashItem('doctor', `${other.name} (merged)`, other);
      await deleteDoctorDirectoryEntryRemote(other.id);
      DOCTOR_DIRECTORY = DOCTOR_DIRECTORY.filter(x => x.id !== other.id);
    }
    const idx = DOCTOR_DIRECTORY.findIndex(d => d.id === merged.id);
    if(idx > -1) DOCTOR_DIRECTORY[idx] = merged; else DOCTOR_DIRECTORY.push(merged);
    logActivity(`merged ${group.length} duplicate entries into ${merged.name}`);
    showToast(`Merged into ${merged.name}.`);
    render();
  }catch(err){
    console.error('merge failed:', err);
    showToast('Could not merge \u2014 check your connection.');
  }
}

function duplicateBannerHtml(){
  const groups = duplicateDoctorGroups();
  if(!groups.length) return '';
  return groups.map(group => {
    const names = group.map(d => escapeHtml(d.name)).join(' \u00b7 ');
    const options = group.map(d =>
      `<button class="backfill-banner-btn" onclick="mergeDuplicateDoctors('${d.id}')">Keep \u201c${escapeHtml(d.name)}\u201d</button>`
    ).join('');
    return `<div class="dupe-banner">
      <div class="backfill-banner-text">
        <b>Possible duplicate</b>
        <span>${names} look like the same person. Merging keeps every tip, photo and term from both.</span>
      </div>
      <div class="dupe-banner-actions">${options}</div>
    </div>`;
  }).join('');
}
