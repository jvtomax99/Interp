(() => {
  'use strict';

  const CELL = 14.2857142857;
  const pin = (x, y, extra = '') => `<span class="pin-sprite${extra ? ' ' + extra : ''}" style="--pin-x:${x};--pin-y:${y}" aria-hidden="true"></span>`;

  const css = `
/* Exact enamel-pin artwork supplied for Interpreter Hub. Artwork only: no badge/bubble behind it. */
.pin-sprite{
  display:inline-block;
  width:32px;
  height:32px;
  flex:0 0 auto;
  background-image:url('./pin-icons-source-hd-upload.png?v=src2');
  background-repeat:no-repeat;
  image-rendering:auto;
  background-size:800% 800%;
  background-position:calc(var(--pin-x) * ${CELL}%) calc(var(--pin-y) * ${CELL}%);
  vertical-align:middle;
  filter:drop-shadow(0 1.2px 1.2px rgba(70,45,25,.14));
}
.home-tile-icon,.qa-icon,.qa-tile-icon{
  background:transparent !important;
  border:0 !important;
  box-shadow:none !important;
  border-radius:0 !important;
  overflow:visible !important;
}
.home-tile-icon .pin-sprite{width:34px;height:34px;}
.qa-icon .pin-sprite,.qa-tile-icon .pin-sprite{width:32px;height:32px;}
.side-row-icon .pin-sprite{width:24px;height:24px;}
.tabbar-icon .pin-sprite{width:23px;height:23px;}
.home-wave-icon .pin-sprite{width:1em;height:1em;}
.icon-pick .pin-sprite{width:28px;height:28px;}
.group-mark-logo{object-fit:contain;}
`;

  const style = document.createElement('style');
  style.id = 'exact-pin-icon-style';
  style.textContent = css;
  document.head.appendChild(style);

  if (typeof DOMAIN_ICONS !== 'undefined') {
    Object.assign(DOMAIN_ICONS, {
      bag:          pin(7,0), // All Tools
      clipboard:    pin(0,7), // Checklists
      nurse:        pin(2,0), // Doctor
      doctor:       pin(2,0), // Doctor
      ambulance:    pin(2,2), // Emergency
      stethoscope:  pin(2,0), // Doctor
      pulse:        pin(0,4), // Procedures
      helicopter:   pin(2,2), // Emergency
      flask:        pin(6,3), // Lab Results
      pill:         pin(2,4), // Medications
      iv:           pin(3,3), // Infusion
      monitor:      pin(0,4), // Procedures
      shield:       pin(6,4), // Infection Control
      phone:        pin(3,7), // Contacts
      chat:         pin(4,5), // Phrases
      apple:        pin(4,7), // Self Care
      ribbon:       pin(7,1), // Oncology
      heart:        pin(0,1), // Cardiology
      brain:        pin(2,1), // Neurology
      dna:          pin(5,4), // Genetics
      lungs:        pin(1,1), // Pulmonology
      bone:         pin(6,1), // Orthopedics
      ear:          pin(5,2), // ENT
      book:         pin(3,5), // Education
      search:       pin(5,0), // Search
      calendar:     pin(5,6), // Calendar
      grid:         pin(7,0), // All Tools
      link:         pin(2,6), // References
      bell:         pin(0,6), // Tips
      layers:       pin(2,7), // Templates
      sparkle:      pin(4,0), // Favorites
      globe:        pin(6,5), // Interpreter Resources
      compass:      pin(4,6), // Locations
      exam:         pin(1,4), // Clinical Notes
      person:       pin(2,0), // Doctor
      review:       pin(2,5)  // Spanish ↔ English
    });
  }

  const chromePins = {
    Home: [1,0],
    Search: [5,0],
    Chat: [4,5],
    More: [6,7]
  };

  const quickPins = {
    'Doctor Prep': [2,0],
    'Doctor Directory': [7,0],
    'Provider Pictures': [2,0],
    'Find a Doctor': [5,0],
    'MediFind': [5,0]
  };

  function setPin(el, coords){
    if(!el || !coords || el.querySelector('.medical-pin')) return;
    const wanted = `${coords[0]},${coords[1]}`;
    if(el.dataset.exactPin === wanted && el.querySelector('.pin-sprite')) return;
    el.innerHTML = pin(coords[0], coords[1]);
    el.dataset.exactPin = wanted;
  }

  function applyExactPins(){
    document.querySelectorAll('.home-wave-icon').forEach(el => setPin(el, [0,0]));

    document.querySelectorAll('.tabbar-btn').forEach(btn => {
      const label = (btn.querySelector('span:last-of-type')?.textContent || btn.textContent || '').trim();
      const coords = chromePins[label];
      if(coords) setPin(btn.querySelector('.tabbar-icon'), coords);
    });

    document.querySelectorAll('.side-row').forEach(btn => {
      const label = (btn.querySelector('.side-row-name')?.textContent || '').trim();
      const coords = chromePins[label];
      if(coords) setPin(btn.querySelector('.side-row-icon'), coords);
    });

    document.querySelectorAll('.qa-card').forEach(card => {
      const title = (card.querySelector('.qa-title')?.textContent || '').trim();
      const coords = quickPins[title];
      if(coords) setPin(card.querySelector('.qa-icon'), coords);
    });
    applyMedicalPins();
  }


  // The approved 6 x 6 sheet has labels below the artwork. Coordinates are
  // normalized to its 1254px reference width; uploaded Retina copies work too.
  const medicalSource = './medical-pins.png.PNG';
  const medicalNames = [
    'genetics','oncology','hematology','leukemia','cardiology','heart-failure',
    'pediatrics','ent','urology','endocrinology','nephrology','neurology',
    'developmental','pulmonology','orthopedics','infusion','laboratory','pharmacy',
    'medical-terminology','resources','doctor-prep','doctor-directory','providers','find-doctor',
    'medifind','translate','chat','directory','userguide','updates',
    'practice','review','ethics','events','emergency','wave'
  ];
  const medicalArtwork = Object.create(null);
  const medicalLabels = {
    'medical terminology':'medical-terminology', 'professional resources':'resources',
    'doctor prep':'doctor-prep', 'doctor directory':'doctor-directory',
    'provider pictures':'providers', 'pictures of healthcare providers':'providers',
    'find a doctor':'find-doctor', 'medifind':'medifind', 'translate':'translate',
    'team chat':'chat', 'chat':'chat', 'link directory':'directory',
    'user guide':'userguide', 'recent updates':'updates', 'corechi practice':'practice',
    'term review':'review', 'code of ethics':'ethics', 'training & events':'events',
    'oncology, hematology & leukemia':'oncology', 'heart failure & cardiac':'heart-failure',
    'peds ent, urology, endocrinology & nephrology':'ent',
    'developmental & neurology':'neurology'
  };
  const medicalRules = [
    [/\bgenetic(?:s)?\b|\bgenomic(?:s)?\b/, 'genetics'],
    [/\bleukemia\b/, 'leukemia'], [/\bhematology\b|\bblood bank\b/, 'hematology'],
    [/\boncology\b|\bcancer\b/, 'oncology'],
    [/\bheart failure\b/, 'heart-failure'],
    [/\bcardiac\b|\bcardiology\b|\bcardiovascular\b/, 'cardiology'],
    [/\bnephrology\b|\brenal\b|\bkidney\b/, 'nephrology'],
    [/\burology\b|\bbladder\b/, 'urology'],
    [/\bendocrinology\b|\bendocrine\b|\bthyroid\b/, 'endocrinology'],
    [/\bent\b|\botolaryngology\b/, 'ent'],
    [/\bdevelopmental\b/, 'developmental'],
    [/\bneurology\b|\bneurologic(?:al)?\b/, 'neurology'],
    [/\bpulmonology\b|\brespiratory\b|\bpulmonary\b/, 'pulmonology'],
    [/\borthop(?:a)?edics\b|\bmusculoskeletal\b/, 'orthopedics'],
    [/\binfusion\b/, 'infusion'], [/\blaboratory\b|\blab results\b/, 'laboratory'],
    [/\bpharmacy\b|\bmedications\b/, 'pharmacy'],
    [/\bemergency\b/, 'emergency'], [/\bpediatric(?:s)?\b|\bpeds\b/, 'pediatrics']
  ];
  function medicalKey(name){
    const normalized = String(name || '').toLowerCase().replace(/\s+/g, ' ').trim();
    return medicalLabels[normalized] || (medicalRules.find(([pattern]) => pattern.test(normalized)) || [])[1];
  }
  function medicalHTML(key){
    const src = medicalArtwork[key];
    return src ? '<img class="medical-pin" src="' + src + '" alt="" aria-hidden="true" draggable="false">' : '';
  }
  function applyMedicalPins(){
    if(!medicalArtwork.wave) return;
    document.querySelectorAll('.home-wave-icon').forEach(el => placeMedicalPin(el, 'wave'));
    [
      ['.qa-card', '.qa-title', '.qa-icon'],
      ['.qa-tile', '.qa-tile-label', '.qa-tile-icon'],
      ['.side-row', '.side-row-name', '.side-row-icon'],
      ['.domain-chip', '.domain-chip-name', '.domain-chip-icon'],
      ['.home-tile, .domain-family', '.home-tile-name', '.home-tile-icon']
    ].forEach(([selector, labelSelector, iconSelector]) => {
      document.querySelectorAll(selector).forEach(card => {
        const label = card.querySelector(labelSelector);
        if(label) placeMedicalPin(card.querySelector(iconSelector), medicalKey(label.textContent));
      });
    });
    document.querySelectorAll('.tabbar-btn').forEach(btn => {
      const label = btn.querySelector('span:last-of-type');
      if(label) placeMedicalPin(btn.querySelector('.tabbar-icon'), medicalKey(label.textContent));
    });
  }
  function placeMedicalPin(el, key){
    if(!el || !medicalArtwork[key]) return;
    const current = el.querySelector('.medical-pin');
    if(current && current.getAttribute('src') === medicalArtwork[key]) return;
    el.innerHTML = medicalHTML(key);
  }
  const medicalStyle = document.createElement('style');
  medicalStyle.textContent = `
    .medical-pin{display:inline-block;width:32px;height:32px;object-fit:contain;flex-shrink:0;vertical-align:middle;pointer-events:none}
    .home-tile-icon .medical-pin{width:34px;height:34px}
    .side-row-icon .medical-pin{width:24px;height:24px}
    .side-row.is-nested .medical-pin{width:16px;height:16px}
    .tabbar-icon .medical-pin{width:23px;height:23px}
    .domain-chip-icon .medical-pin{width:19px;height:19px}
    .home-wave-icon .medical-pin{width:1em;height:1em}
    .icon-pick .medical-pin{width:28px;height:28px}
    #domainFolderIcon .medical-pin{width:100%;height:100%}
  `;
  document.head.appendChild(medicalStyle);

  // Remove only edge-connected pale background pixels. Enclosed white coats,
  // books, bones and other white enamel details remain opaque.
  function clearSheetBackground(ctx, width, height){
    const pixels = ctx.getImageData(0, 0, width, height);
    const data = pixels.data;
    const seen = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0, tail = 0;
    function visit(p){
      if(seen[p]) return;
      seen[p] = 1;
      const i = p * 4, lo = Math.min(data[i], data[i+1], data[i+2]);
      const hi = Math.max(data[i], data[i+1], data[i+2]);
      if(data[i+3] === 0 || (lo > 225 && hi - lo < 25)) queue[tail++] = p;
    }
    for(let x=0;x<width;x++){ visit(x); visit((height-1)*width+x); }
    for(let y=0;y<height;y++){ visit(y*width); visit(y*width+width-1); }
    while(head < tail){
      const p = queue[head++], x = p % width, y = Math.floor(p / width);
      data[p*4+3] = 0;
      if(x) visit(p-1); if(x+1<width) visit(p+1);
      if(y) visit(p-width); if(y+1<height) visit(p+width);
    }
    ctx.putImageData(pixels, 0, 0);
  }

  // Label fragments are separate from the enamel artwork. Remove only short
  // components wholly below the largest pin component, preserving lettering
  // inside the pin (EN/ES) and detached accents alongside it.
  function clearCaptionFragments(ctx, width, height){
    const pixels = ctx.getImageData(0, 0, width, height);
    const data = pixels.data, size = width * height;
    const seen = new Uint8Array(size), queue = new Int32Array(size);
    const components = [];
    for(let start=0;start<size;start++){
      if(seen[start] || data[start*4+3] === 0) continue;
      let head=0, tail=1, minY=height, maxY=0;
      queue[0]=start; seen[start]=1;
      while(head<tail){
        const p=queue[head++], x=p%width, y=Math.floor(p/width);
        minY=Math.min(minY,y); maxY=Math.max(maxY,y);
        for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
          const nx=x+dx, ny=y+dy;
          if(nx<0 || nx>=width || ny<0 || ny>=height) continue;
          const n=ny*width+nx;
          if(!seen[n] && data[n*4+3] !== 0){seen[n]=1;queue[tail++]=n;}
        }
      }
      components.push({points:queue.slice(0,tail),minY,maxY});
    }
    const main=components.reduce((a,b)=>!a || b.points.length>a.points.length?b:a,null);
    if(!main) return;
    for(const part of components){
      if(part!==main && part.minY>main.maxY+1 &&
          part.minY>height*0.65 && part.maxY-part.minY+1<height*0.15){
        for(const p of part.points) data[p*4+3]=0;
      }
    }
    ctx.putImageData(pixels,0,0);
  }

  const medicalImage = new Image();
  medicalImage.onload = () => {
    try{
      // A different sheet must not silently replace the existing working pins.
      const ratio = medicalImage.naturalWidth / medicalImage.naturalHeight;
      if(ratio < 0.98 || ratio > 1.02) throw new Error('Expected the square 36-pin sheet.');
      const scale = medicalImage.naturalWidth / 1254;
      const rowY = [0, 212, 410, 617, 820, 1022];
      const rowH = [184, 167, 176, 172, 169, 163];
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d', {willReadFrequently:true});
      if(!ctx) return;
      const prepared = Object.create(null);
      medicalNames.forEach((key, i) => {
        const row = Math.floor(i / 6), col = i % 6;
        const h = rowH[row] / 209 * 256;
        // Team Chat's caption touches its shadow, so connected-component
        // cleanup cannot separate it. Exclude the bottom 10 source pixels
        // while keeping the artwork's scale and position unchanged.
        const cropHeight = key === 'chat' ? rowH[row] - 10 : rowH[row];
        const drawHeight = cropHeight / 209 * 256;
        ctx.clearRect(0, 0, 256, 256);
        ctx.drawImage(medicalImage, col * 209 * scale, rowY[row] * scale,
          209 * scale, cropHeight * scale, 0, (256-h)/2, 256, drawHeight);
        clearSheetBackground(ctx, 256, 256);
        clearCaptionFragments(ctx, 256, 256);
        prepared[key] = canvas.toDataURL('image/png');
      });
      Object.assign(medicalArtwork, prepared);
      if(typeof DOMAIN_ICONS !== 'undefined'){
        const iconKeys = {dna:'genetics',ribbon:'oncology',heart:'cardiology',brain:'neurology',
          lungs:'pulmonology',bone:'orthopedics',ear:'ent',iv:'infusion',flask:'laboratory',
          pill:'pharmacy',doctor:'doctor-prep',person:'providers',chat:'chat',calendar:'events',
          link:'directory',bell:'updates',exam:'practice',review:'review'};
        Object.entries(iconKeys).forEach(([key, artwork]) => { DOMAIN_ICONS[key] = medicalHTML(artwork); });
        medicalNames.forEach(key => { DOMAIN_ICONS[key] = medicalHTML(key); });
      }
      // Decorate returned display tiles only; never change saved category data.
      const decorate = tiles => tiles.map(tile => {
        const artwork = medicalHTML(medicalKey(tile.name));
        return artwork ? {...tile, icon:artwork} : tile;
      });
      if(typeof getDomainTiles === 'function'){
        const original = getDomainTiles;
        getDomainTiles = function(){ return decorate(original.apply(this, arguments)); };
      }
      if(typeof getToolTiles === 'function'){
        const original = getToolTiles;
        getToolTiles = function(){ return decorate(original.apply(this, arguments)); };
      }
      if(typeof render === 'function') render();
      applyExactPins();
    }catch(error){
      console.warn('New medical pin sheet could not be prepared; keeping existing icons.', error);
    }
  };
  medicalImage.onerror = () => console.warn('Medical pin sheet unavailable; keeping existing icons.');
  medicalImage.src = medicalSource;

  // Re-render once so every domain/card immediately picks up the exact artwork.
  if(typeof render === 'function') render();
  applyExactPins();

  // The app re-renders sections in place. Re-apply only the small pieces whose
  // markup is recreated from legacy navigation constants (wave/tab/sidebar).
  let queued = false;
  const observer = new MutationObserver(() => {
    if(queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      applyExactPins();
    });
  });
  observer.observe(document.body, {childList:true, subtree:true});
})();
