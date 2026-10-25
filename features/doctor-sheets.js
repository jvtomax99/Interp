/* The doctor and provider sheets' places ("Where": the place picker,
   adding a place) and the doctor directory's add and edit sheet (open,
   photo, save, delete): moved verbatim out of index.html on 2026-10-25
   (docs/split-index.md, phase 3; docs/features/places.md). Loaded by a
   plain <script src> just before index.html's own script. Nothing here
   runs as the page loads (only declarations); the names it uses from
   index.html (PLACES, savePlace, groupIconHtml, showToast...) are read
   when a function runs. Keep it that way: a top-level line here that
   calls into index.html would run before index.html has. */

/* ---------- Doctor and provider sheets: places ---------- */
let editingDoctorDirId = null;

/* The doctor sheet's "Where" (2026-10-14). One button opens a sheet of
   places: search, your region first, then the other, then places with no
   region; tap one and it's set. "Add a place" makes a new one for the whole
   team (savePlace). Replaces the old group dropdown, "Other", "location as
   written" and Region fields. ddPlace: a place name, HMH_NETWORK_LABEL for
   "no specific site", or '' for not set. */
let ddPlace = '';
let placeAdding = null;          // { name, region } while the add form is open

// The picker serves two sheets (R5, 2026-10-20): the doctor's (ddPlace,
// fDDPlace) and the provider's (ppPlace, fPPlace). placePickFor says which.
let ppPlace = '', placePickFor = 'dd';
function placePicked(){ return placePickFor === 'pp' ? ppPlace : ddPlace; }
function renderPPPlaceField(){ renderPlaceField('fPPlace', ppPlace); }
function renderDDPlaceField(){ renderPlaceField('fDDPlace', ddPlace); }
function renderPlaceField(id, ddPlace){
  const btn = document.getElementById(id);
  if(!btn) return;
  if(!ddPlace){
    btn.innerHTML = `<span class="place-field-icon is-empty">${groupIconHtml('medifind')}</span><span class="place-field-text"><b>Choose a place</b><small>Hospital, center or office</small></span><span class="place-field-chev" aria-hidden="true">›</span>`;
    return;
  }
  const r = regionOfGroup(ddPlace);
  btn.innerHTML = `<span class="place-field-icon">${groupIconHtml(groupIconKeyFor(ddPlace))}</span><span class="place-field-text"><b>${escapeHtml(ddPlace === HMH_NETWORK_LABEL ? 'Hackensack Meridian Health' : ddPlace)}</b><small>${ddPlace === HMH_NETWORK_LABEL ? 'No specific site' : r ? escapeHtml(regionName(r)) + ' region' : 'No region'}</small></span><span class="place-field-chev" aria-hidden="true">›</span>`;
}

function openPlacePicker(target){
  placePickFor = target === 'pp' ? 'pp' : 'dd';
  placeAdding = null;
  const q = document.getElementById('placeSearch');
  if(q) q.value = '';
  renderPlaceList();
  document.getElementById('placeOverlay').classList.add('show');
  if(q && prefersAutoFocus()) q.focus();
}
function closePlacePicker(){
  document.getElementById('placeOverlay').classList.remove('show');
  placeAdding = null;
}
function pickPlace(encodedName){
  const name = decodeURIComponent(encodedName);
  if(placePickFor === 'pp'){ ppPlace = name; closePlacePicker(); renderPPPlaceField(); return; }
  ddPlace = name;
  closePlacePicker();
  renderDDPlaceField();
}

function placeCount(name){
  const d = DOCTOR_DIRECTORY.filter(d => locationGroupName(d, d.hospitalLocation) === name).length;
  const v = (PROVIDERS || []).filter(p => locationGroupName(p, p.facility) === name).length;
  return [d ? `${d} doctor${d === 1 ? '' : 's'}` : '', v ? `${v} provider${v === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ');
}
function placeRowHtml(p){
  const on = p.name === placePicked();
  const sub = p.sub || placeCount(p.name);
  return `<button type="button" class="place-row${on ? ' is-on' : ''}" aria-pressed="${on}" onclick="pickPlace('${encGroup(p.name)}')">
      <span class="place-row-icon">${groupIconHtml(groupIconKeyFor(p.name))}</span>
      <span class="place-row-text"><b>${escapeHtml(p.label || p.name)}</b>${sub ? `<small>${escapeHtml(sub)}</small>` : ''}</span>
      ${on ? `<span class="place-row-tick" aria-hidden="true">${ICON_CHECK}</span>` : ''}
    </button>`;
}

function renderPlaceList(){
  const box = document.getElementById('placeList');
  if(!box) return;
  if(placeAdding){ box.innerHTML = placeAddHtml(); return; }
  const q = foldText((document.getElementById('placeSearch') || {}).value || '').trim();
  const all = placeList().filter(p => !q || foldText(p.name).includes(q));
  const mine = myRegion();
  const order = mine ? [mine, ...REGIONS.map(r => r.id).filter(r => r !== mine)] : REGIONS.map(r => r.id);
  let html = '';
  if(!q) html += `<div class="place-sec">${placeRowHtml({ name: HMH_NETWORK_LABEL, label: 'No specific site', sub: 'Hackensack Meridian Health, site not known' })}</div>`;
  [...order, ''].forEach(r => {
    const list = all.filter(p => (p.region || '') === r).sort((a, b) => a.name.localeCompare(b.name));
    if(!list.length) return;
    const head = r ? `${regionName(r)}${r === mine ? ' · your region' : ''}` : 'Other places';
    html += `<div class="place-sec"><h4 class="place-sec-head">${escapeHtml(head)}</h4>${list.map(placeRowHtml).join('')}</div>`;
  });
  if(q && !all.length) html += `<p class="place-none">No place called “${escapeHtml((document.getElementById('placeSearch') || {}).value.trim())}” yet.</p>`;
  const typed = ((document.getElementById('placeSearch') || {}).value || '').trim();
  html += `<button type="button" class="place-add" onclick="startAddPlace()"><span aria-hidden="true">+</span>${typed && !all.some(p => foldText(p.name) === q) ? `Add “${escapeHtml(typed)}” as a place` : 'Add a place'}</button>`;
  box.innerHTML = html;
}

function startAddPlace(){
  const typed = ((document.getElementById('placeSearch') || {}).value || '').trim();
  placeAdding = { name: typed, region: myRegion() || '' };
  renderPlaceList();
  const inp = document.getElementById('placeAddName');
  if(inp) inp.focus();
}
function placeAddHtml(){
  const a = placeAdding;
  return `<div class="place-addform">
      <label for="placeAddName">Name</label>
      <input id="placeAddName" type="text" value="${escapeAttr(a.name)}" placeholder="e.g. Bergen Eye Associates" oninput="placeAdding.name=this.value">
      <span class="place-addlab" id="placeAddRegLab">Region</span>
      <div class="ds-mode-seg" role="radiogroup" aria-labelledby="placeAddRegLab">${REGIONS.map(r => `<button type="button" role="radio" aria-checked="${a.region === r.id}" onclick="placeAdding.region='${r.id}'; renderPlaceList()">${escapeHtml(r.name)}</button>`).join('')}</div>
      <p class="field-hint">Everyone on the team will see it. Pick its icon from the group heading afterwards.</p>
      <div class="place-addbtns">
        <button type="button" class="btn btn-ghost" onclick="placeAdding=null; renderPlaceList()">Back</button>
        <button type="button" class="btn btn-primary" onclick="addPlace()">Add place</button>
      </div>
    </div>`;
}
async function addPlace(){
  const name = normLoc(placeAdding && placeAdding.name);
  if(!name){ showToast('Type the place’s name.'); return; }
  if(!isRegion(placeAdding.region)){ showToast('Pick North or South.'); return; }
  const existing = placeList().find(p => p.name.toLowerCase() === name.toLowerCase());
  if(existing){ pickPlace(encGroup(existing.name)); return; }
  const region = placeAdding.region;
  const saving = savePlace(name, { custom: true, region });   // known locally at once
  pickPlace(encGroup(name));
  if(await saving) logActivity(`added the place ${name} (${regionName(region)})`);
}

/* ---------- Doctor directory: the add and edit sheet ---------- */
function openAddDoctorDirModal(){
  requireName(()=>_openAddDoctorDirModal());
}
function _openAddDoctorDirModal(){
  editingDoctorDirId = null;
  pendingDDPhotoDataUrl = null;
  pendingDDPhotoPath = null;
  document.getElementById('doctorDirModalTitle').textContent = 'Add doctor';
  document.getElementById('fDDDelete').hidden = true;
  document.getElementById('fDDName').value = '';
  document.getElementById('fDDSpecialty').value = '';
  document.getElementById('fDDLocationDetails').value = '';
  document.getElementById('fDDPhoto').value = '';
  ddPlace = '';
  renderDDPlaceField();
  renderDDPhotoPreview();
  document.getElementById('doctorDirOverlay').classList.add('show');
  document.getElementById('fDDName').focus();
}

function openEditDoctorDirModal(id){
  requireName(()=>_openEditDoctorDirModal(id));
}
function _openEditDoctorDirModal(id, focusId){
  const d = DOCTOR_DIRECTORY.find(x=>x.id===id);
  if(!d) return;
  editingDoctorDirId = id;
  pendingDDPhotoDataUrl = d.photo || null;
  pendingDDPhotoPath = d.photoPath || null;
  document.getElementById('doctorDirModalTitle').textContent = 'Edit doctor';
  document.getElementById('fDDDelete').hidden = false;
  document.getElementById('fDDName').value = d.name || '';
  document.getElementById('fDDSpecialty').value = d.specialty || '';
  document.getElementById('fDDLocationDetails').value = d.locationDetails || '';
  document.getElementById('fDDPhoto').value = '';
  const g = locationGroupName(d, d.hospitalLocation);
  ddPlace = g === NO_LOCATION_LABEL ? '' : g;
  renderDDPlaceField();
  renderDDPhotoPreview();
  document.getElementById('doctorDirOverlay').classList.add('show');
  const f = document.getElementById(focusId || 'fDDName');
  f.focus();
  if(focusId) f.scrollIntoView({ block: 'center' });
}

function closeDoctorDirModal(){
  document.getElementById('doctorDirOverlay').classList.remove('show');
  editingDoctorDirId = null;
  pendingDDPhotoDataUrl = null;
  pendingDDPhotoPath = null;
  // Opened from a doctor's page: back to that page, saved or not.
  const back = doctorPageReturnTo;
  doctorPageReturnTo = null;
  if(back) openDoctorDirDetail(back);
}

function renderDDPhotoPreview(){
  const wrap = document.getElementById('ddPhotoPreviewWrap');
  if(!wrap) return;
  if(pendingDDPhotoDataUrl){
    wrap.innerHTML = `<img class="photo-preview" src="${pendingDDPhotoDataUrl}" alt="Preview">`;
  } else {
    wrap.innerHTML = `<div class="photo-placeholder">${ICON_PERSON}</div>`;
  }
}

function removeDDPendingPhoto(){
  pendingDDPhotoDataUrl = null;
  pendingDDPhotoPath = null;
  document.getElementById('fDDPhoto').value = '';
  renderDDPhotoPreview();
}

// Reuses the same upload pipeline as chat attachments and provider photos —
// resized and pushed to Cloud Storage, with only a URL kept in Firestore.
async function handleDDPhotoSelect(event){
  const file = event.target.files && event.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ showToast('Please choose an image file.'); return; }

  const label = document.querySelector('label[for="fDDPhoto"]');
  const originalLabel = label ? label.textContent : '';
  if(label) label.textContent = 'Uploading…';

  try{
    const att = await readFileAsAttachment(file);
    pendingDDPhotoDataUrl = att.dataUrl;
    pendingDDPhotoPath = att.storagePath || null;
    renderDDPhotoPreview();
  }catch(err){
    showToast(err.message || 'Could not process that image.');
  }finally{
    if(label) label.textContent = originalLabel || 'Choose photo';
    event.target.value = '';
  }
}

async function saveDoctorDirEntry(){
  const name = document.getElementById('fDDName').value.trim();
  if(!name){ showToast('Doctor\u2019s name is required.'); return; }
  const specialty = document.getElementById('fDDSpecialty').value.trim();
  const locationDetails = document.getElementById('fDDLocationDetails').value.trim();
  const editor = whoAmI();

  // Editing keeps the existing doc ID (so it stays the same physical
  // record even if the display name is tweaked); adding fresh derives a
  // new ID from the name so a later Doctor Prep search on the same person
  // lands on — and merges into — this same entry rather than duplicating it.
  const siteRegion = regionOfGroup(ddPlace);
  // The place decides the region. Only a doctor with no specific site keeps
  // one of their own: what they had, or for a new one the adder's.
  const keep = editingDoctorDirId ? (DOCTOR_DIRECTORY.find(d => d.id === editingDoctorDirId) || {}).region : myRegion();
  const regionField = siteRegion ? null : (isRegion(keep) ? keep : null);
  const placed = siteRegion || regionField || '';
  const id = editingDoctorDirId || doctorDirIdFor(name, placed);
  if(!id){ showToast('Could not generate an entry for that name.'); return; }
  const existing = editingDoctorDirId ? DOCTOR_DIRECTORY.find(d=>d.id===editingDoctorDirId) : DOCTOR_DIRECTORY.find(d=>d.id===id);

  const record = {
    ...(existing || {}),
    name, specialty, locationDetails,
    // The wording Doctor Prep found stays on file while the place is unchanged;
    // a moved or new doctor's wording is the place itself, so the card never
    // shows the old building under the new heading.
    hospitalLocation: (existing && ddPlace === locationGroupName(existing, existing.hospitalLocation))
      ? (existing.hospitalLocation || '') : (ddPlace !== HMH_NETWORK_LABEL ? ddPlace : ''),
    locationGroup: ddPlace,
    region: regionField,
    photo: pendingDDPhotoDataUrl || null,
    photoPath: pendingDDPhotoPath || null,
    source: (existing && existing.source) || 'manual',
    updatedBy: editor || (existing && existing.updatedBy) || '',
    updatedAt: Date.now(),
  };

  try{
    await persistDoctorDirectoryEntry(id, record);
    // If the photo was swapped out, remove the old file so Storage doesn't
    // accumulate images nothing points at anymore.
    if(existing && existing.photoPath && existing.photoPath !== pendingDDPhotoPath && storage){
      storage.ref().child(existing.photoPath).delete().catch(()=>{});
    }
    const idx = DOCTOR_DIRECTORY.findIndex(d=>d.id===id);
    if(idx>-1) DOCTOR_DIRECTORY[idx] = { id, ...record };
    else DOCTOR_DIRECTORY.push({ id, ...record });
    const photoChanged = pendingDDPhotoDataUrl && pendingDDPhotoDataUrl !== (existing && existing.photo);
    logActivity(editingDoctorDirId
      ? (photoChanged ? `added a photo for ${name} in the doctor directory` : `updated the doctor directory entry for ${name}`)
      : `added ${name} to the doctor directory`);
    closeDoctorDirModal();
    successBurst();
    showToast('Doctor saved.');
    render();
  }catch(err){
    showToast(saveErrorMessage(err, 'doctor-directory'));
  }
}

// Delete lives in the doctor's sheet now (the list cards have no buttons).
// Deleted, there is no page to go back to.
async function deleteDoctorFromSheet(){
  const id = editingDoctorDirId;
  if(!id) return;
  if(!await deleteDoctorDirEntry(id)) return;
  doctorPageReturnTo = null;
  closeDoctorDirModal();
}
async function deleteDoctorDirEntry(id){
  const d = DOCTOR_DIRECTORY.find(x=>x.id===id);
  if(!d) return;
  if(!confirm(`Delete "${d.name}"?`)) return;
  try{
    const trashId = await trashItem('doctor', d.name, d);
    await deleteDoctorDirectoryEntryRemote(id);
    if(storage && d.photoPath){
      storage.ref().child(d.photoPath).delete().catch(()=>{});
    }
    DOCTOR_DIRECTORY = DOCTOR_DIRECTORY.filter(x=>x.id!==id);
    logActivity(`removed ${d.name} from the doctor directory`);
    showUndoToast('Doctor deleted.', trashId);
    render();
    return true;
  }catch(err){
    showToast('Could not delete — check your connection.');
  }
}
