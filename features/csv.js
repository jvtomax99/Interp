/* CSV export / import (exportTermsCsv, parseCsv, the staged import:
   handleCsvImportSelected, showImportPreview, confirmCsvImport): moved
   verbatim out of index.html on 2026-10-25 (docs/split-index.md, phase
   3). Loaded by a plain <script src> just before index.html's own
   script. Nothing here runs as the page loads (only declarations); the
   names it uses from index.html (DATA, db, showToast...) are read when a
   function runs. Keep it that way: a top-level line here that calls into
   index.html would run before index.html has. */

/* ============ CSV export / import ============
   Export is always safe — it just reads. Import is staged: parse, show a
   preview of exactly what will be added/updated/skipped, and only write
   to Firestore after an explicit confirm. Nothing lands in the live
   glossary from a bad file without a human looking at the plan first. */

function csvEscape(val){
  const s = String(val==null ? '' : val);
  if(/[",\r\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
  return s;
}

function downloadTextFile(content, filename, mime){
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
}

function exportTermsCsv(){
  const scoped = activeCategory==='all' ? allTermsFlat() : allTermsFlat().filter(t=>t.categoryId===activeCategory);
  const rows = [['id','domain','english','spanish','definition','notes','source','source_url']];
  scoped.forEach(t=> rows.push([t.id, t.categoryName, t.en||'', t.es||'', t.def||'', t.notes||'', t.source||'', t.url||'']));
  const csv = rows.map(r=> r.map(csvEscape).join(',')).join('\r\n');
  downloadTextFile(csv, 'interpreter-hub-glossary.csv', 'text/csv;charset=utf-8');
  showToast(`Exported ${scoped.length} term${scoped.length===1?'':'s'}.`);
}

// Minimal RFC4180-style parser — handles quoted fields containing commas,
// quotes, or newlines, which a plain split(',') would break on (a
// definition is exactly the kind of field likely to contain a comma).
function parseCsv(text){
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for(let i=0; i<text.length; i++){
    const c = text[i];
    if(inQuotes){
      if(c === '"'){
        if(text[i+1] === '"'){ field += '"'; i++; } else { inQuotes = false; }
      } else field += c;
    } else {
      if(c === '"') inQuotes = true;
      else if(c === ','){ row.push(field); field = ''; }
      else if(c === '\r'){ /* skip, \n handles the line break */ }
      else if(c === '\n'){ row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if(field.length || row.length){ row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || r[0] !== '');
}

function triggerCsvImport(){
  requireName(()=> document.getElementById('csvImportInput').click());
}

async function handleCsvImportSelected(event){
  const file = event.target.files[0];
  event.target.value = '';
  if(!file) return;
  const text = await file.text();
  const rows = parseCsv(text);
  if(rows.length < 2){ showToast('That file doesn\u2019t look like a valid CSV.'); return; }

  const header = rows[0].map(h=>h.trim().toLowerCase());
  const idx = {
    id: header.indexOf('id'), domain: header.indexOf('domain'), en: header.indexOf('english'),
    es: header.indexOf('spanish'), def: header.indexOf('definition'),
    notes: header.indexOf('notes'),
    source: header.indexOf('source'), url: header.indexOf('source_url')
  };
  if(idx.domain===-1 || idx.en===-1){
    showToast('The CSV needs at least "domain" and "english" columns.');
    return;
  }

  const plan = { toAdd: [], toUpdate: [], errors: [] };
  const existingIds = new Set(allTermsFlat().map(t=>t.id));
  const editor = whoAmI();

  rows.slice(1).forEach((r, i)=>{
    const rowNum = i + 2; // +1 for header, +1 for 1-indexing
    const domainName = (r[idx.domain]||'').trim();
    const en = (r[idx.en]||'').trim();
    if(!domainName || !en){ plan.errors.push(`Row ${rowNum}: missing domain or English term.`); return; }
    const cat = DATA.categories.find(c=>c.name.toLowerCase()===domainName.toLowerCase());
    if(!cat){ plan.errors.push(`Row ${rowNum}: no domain named "${domainName}".`); return; }

    const existingId = idx.id>-1 ? (r[idx.id]||'').trim() : '';
    const isUpdate = existingId && existingIds.has(existingId);
    const record = {
      id: isUpdate ? existingId : genId(),
      categoryId: cat.id, en,
      es: idx.es>-1 ? (r[idx.es]||'').trim() : '',
      def: idx.def>-1 ? (r[idx.def]||'').trim() : '',
      notes: (idx.notes>-1 ? (r[idx.notes]||'').trim() : '') || undefined,
      source: idx.source>-1 ? (r[idx.source]||'').trim() : '',
      url: (idx.url>-1 ? (r[idx.url]||'').trim() : '') || undefined,
      editedBy: editor || undefined, editedOn: editor ? timeAgoLabel() : undefined
    };
    if(isUpdate) plan.toUpdate.push(record); else plan.toAdd.push(record);
  });

  pendingImportPlan = plan;
  showImportPreview(plan);
}

function showImportPreview(plan){
  const body = document.getElementById('importPreviewBody');
  body.innerHTML = `
    <p><b>${plan.toAdd.length}</b> new term${plan.toAdd.length===1?'':'s'} will be added.</p>
    <p><b>${plan.toUpdate.length}</b> existing term${plan.toUpdate.length===1?'':'s'} will be updated.</p>
    ${plan.errors.length ? `
      <p style="color:var(--danger); margin-top:12px;"><b>${plan.errors.length}</b> row${plan.errors.length===1?'':'s'} will be skipped:</p>
      <ul style="margin:6px 0 0 0; padding-left:18px; font-size:12px; color:var(--ink-soft); max-height:140px; overflow:auto;">
        ${plan.errors.slice(0,20).map(e=>`<li>${escapeHtml(e)}</li>`).join('')}
      </ul>
    ` : ''}
  `;
  const confirmBtn = document.getElementById('importConfirmBtn');
  confirmBtn.disabled = (plan.toAdd.length + plan.toUpdate.length) === 0;
  document.getElementById('importOverlay').classList.add('show');
}

function closeImportModal(){
  document.getElementById('importOverlay').classList.remove('show');
  pendingImportPlan = null;
}

async function confirmCsvImport(){
  if(!pendingImportPlan || !db) return;
  const all = [...pendingImportPlan.toAdd, ...pendingImportPlan.toUpdate];
  if(!all.length){ showToast('Nothing to import.'); closeImportModal(); return; }
  const confirmBtn = document.getElementById('importConfirmBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Importing\u2026';
  try{
    const batchSize = 400;
    for(let i=0; i<all.length; i+=batchSize){
      const batch = db.batch();
      all.slice(i, i+batchSize).forEach(r=> batch.set(db.collection('terms').doc(r.id), stripUndefined(r)));
      await batch.commit();
    }
    logActivity(`imported ${all.length} term${all.length===1?'':'s'} from a CSV file`);
    showToast('Import complete.');
    closeImportModal();
    await loadAllTerms();
    render();
  }catch(err){
    showToast('Import failed partway through \u2014 check your connection and try again.');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Import';
  }
}
