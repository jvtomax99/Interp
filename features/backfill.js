/* The terminology backfill (tierBackfill, doctorsNeedingTiers,
   runTierBackfill, cancelTierBackfill, and its card in the doctor list's
   tidy sheet, backfillBannerHtml): moved verbatim out of index.html on
   2026-10-25 (docs/split-index.md, phase 3). Loaded by a plain
   <script src> just before index.html's own script. Nothing here runs as
   the page loads (only declarations; tierBackfill starts as a plain
   object); the names it uses from index.html (db, DOCTOR_DIRECTORY,
   showToast...) are read when a function runs. Keep it that way: a
   top-level line here that calls into index.html would run before
   index.html has. */

/* ---------- Terminology backfill ----------
   Doctor Prep now returns tiered terminology, but every entry researched
   before that still holds a flat list, and nothing re-runs on its own. This
   walks the directory one doctor at a time and re-researches the stale ones.

   One at a time on purpose: each miss on the JTCC directory costs a web
   search and 20-40 seconds, so firing eleven at once would hit the API hard
   and time out half of them. Sequential is slower to finish and far more
   likely to finish. */
let tierBackfill = { running:false, done:0, total:0, failed:0, cancel:false, current:'' };

// `db` is scoped to the Firebase init block, so this thin wrapper is the one
// place the backfill checks it — and the one seam a test can stand in for.
function hasDbConnection(){ return !!db; }

function doctorsNeedingTiers(){
  return DOCTOR_DIRECTORY.filter(d =>
    d.researchResult &&
    !(Array.isArray(d.researchResult.tiers) && d.researchResult.tiers.length)
  );
}

function updateBackfillProgress(){
  const el = document.getElementById('backfillProgress');
  if(!el) return;
  el.textContent = tierBackfill.current
    ? `${tierBackfill.done} of ${tierBackfill.total} \u2014 ${tierBackfill.current}`
    : `${tierBackfill.done} of ${tierBackfill.total}`;
}

function cancelTierBackfill(){
  tierBackfill.cancel = true;
  showToast('Finishing the current doctor, then stopping.');
}

async function runTierBackfill(){
  if(tierBackfill.running) return;
  if(!whoAmI()){ requireName(() => runTierBackfill()); return; }
  const targets = doctorsNeedingTiers();
  if(!targets.length){ showToast('Everything is already up to date.'); return; }
  // Without a database connection the write is a silent no-op — the results
  // would look updated until the next reload. Better to not start.
  if(!hasDbConnection()){ showToast('Not connected \u2014 updates could not be saved. Check your connection.'); return; }

  tierBackfill = { running:true, done:0, total:targets.length, failed:0, cancel:false, current:'' };
  renderContent();

  for(const doctor of targets){
    if(tierBackfill.cancel) break;
    tierBackfill.current = doctor.name;
    updateBackfillProgress();

    try{
      // 60s rather than the 45s a manual search uses: nobody is watching a
      // single result here, and a timeout means paying for the search twice.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort('timeout'), 60000);
      const res = await fetch('/api/doctor-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await hubAuthHeaders()) },
        body: JSON.stringify({
          doctorName: doctor.name,
          specialty: doctor.specialty || '',
          location: doctor.hospitalLocation || '',
        }),
      });
      clearTimeout(timer);
      const data = await res.json();

      if(res.ok && Array.isArray(data.tiers) && data.tiers.length){
        // Overwrite the cached copy too, or the next manual search for this
        // doctor would serve the old flat result straight back.
        const key = doctorCacheKey(doctor.name, doctor.specialty || '', doctor.hospitalLocation || '');
        if(key){
          await saveCachedDoctorResearch(key, {
            doctorName: doctor.name,
            specialty: doctor.specialty || '',
            location: doctor.hospitalLocation || '',
            result: data,
          });
        }
        // upsert spreads the existing record first, so floor/suite, notes,
        // photo and any hand-picked location group all survive this.
        await upsertDoctorDirectoryFromResearch(
          doctor.name,
          data.specialty || doctor.specialty || '',
          doctor.hospitalLocation || '',
          data
        );
        // upsert swallows its own write errors by design, so confirm the
        // record actually changed rather than trusting that it did. A doctor
        // counted as updated but still on the old shape is worse than one
        // reported as failed.
        const saved = DOCTOR_DIRECTORY.find(d => d.id === doctor.id);
        if(!(saved && saved.researchResult && Array.isArray(saved.researchResult.tiers) && saved.researchResult.tiers.length)){
          tierBackfill.failed++;
          console.error('Backfill did not persist for', doctor.name);
        }
      } else {
        tierBackfill.failed++;
        console.error('Backfill failed for', doctor.name, data && data.error);
      }
    }catch(err){
      tierBackfill.failed++;
      console.error('Backfill threw for', doctor.name, err);
    }

    tierBackfill.done++;
    updateBackfillProgress();
  }

  const { done, failed, cancel } = tierBackfill;
  const updated = done - failed;
  tierBackfill = { running:false, done:0, total:0, failed:0, cancel:false, current:'' };
  renderContent();

  if(cancel) showToast(`Stopped. ${updated} updated, ${doctorsNeedingTiers().length} still to go.`);
  else if(failed) showToast(`${updated} updated, ${failed} could not be reached. Run it again to retry those.`);
  else showToast(`${updated} doctor${updated === 1 ? '' : 's'} updated.`);
  if(updated > 0) logActivity(`refreshed terminology for ${updated} doctor${updated === 1 ? '' : 's'}`);
}

function backfillBannerHtml(){
  if(tierBackfill.running){
    return `<div class="backfill-banner is-running">
      <span class="tr-spinner"></span>
      <div class="backfill-banner-text">
        <b>Updating terminology\u2026</b>
        <span id="backfillProgress">${tierBackfill.done} of ${tierBackfill.total}</span>
      </div>
      <button class="backfill-banner-btn" onclick="cancelTierBackfill()">Stop</button>
    </div>`;
  }
  const n = doctorsNeedingTiers().length;
  if(!n) return '';
  return `<div class="backfill-banner">
    <div class="backfill-banner-text">
      <b>${n} doctor${n === 1 ? '' : 's'} on the old terminology</b>
      <span>Re-research ${n === 1 ? 'this one' : 'them'} to get drugs, procedures and false friends grouped separately. Takes about half a minute each; tips and photos are kept.</span>
    </div>
    <button class="backfill-banner-btn is-primary" onclick="runTierBackfill()">Update ${n === 1 ? '' : 'all'}</button>
  </div>`;
}
