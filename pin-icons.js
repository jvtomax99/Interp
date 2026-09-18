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
    [/\binfectious\b|\binfection(?:s)?\b/, 'infectious-disease'],
    [/\bdermatology\b|\bdermatologic(?:al)?\b/, 'dermatology'],
    [/\bophthalmology\b|\bophthalmic\b/, 'ophthalmology'],
    [/\bsurgery\b|\bsurgical\b|\ban(?:a)?esthesia\b/, 'surgery-anesthesia'],
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
    if(!Object.keys(medicalArtwork).length) return;
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
    el.dataset.pin = key;          // what the tap animation keys off
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

  /* ---- Each pin moves like the thing it depicts, when you tap its card ----
     The artwork is a flat image, so nothing can move independently inside the
     frame. Two things carry the weight instead:

     1. ANTICIPATION. Every motion pulls back before it goes -- a heart draws
        in before it thumps, a bone winds up before it knocks. The first pass
        went straight to the peak, which is what made them read as a twitch
        rather than a performance.
     2. A BURST around the pin. The container's ::after is a second layer the
        flat artwork cannot provide: a ring leaving a heartbeat, a halo off a
        breath, sparks off the helix, a flash off the siren.

     Both are keyed off data-pin, which placeMedicalPin() writes. */

  .medical-pin, .pin-sprite{
    transform-origin:50% 60%;
    will-change:transform;
  }
  /* The burst needs somewhere to sit and room to overflow into. */
  [data-pin]{ position:relative; }
  [data-pin]::after,[data-pin]::before{
    content:''; position:absolute; left:50%; top:50%; border-radius:50%;
    pointer-events:none; opacity:0; z-index:0;
    --burst:var(--tile-color, var(--accent));
  }
  /* so the pin sits above its own burst */
  [data-pin] .medical-pin, [data-pin] .pin-sprite{ position:relative; z-index:1; }
  .medical-pin.is-tapped, .pin-sprite.is-tapped{
    animation-duration:.62s;
    animation-timing-function:cubic-bezier(.34,1.56,.64,1);   /* overshoot */
    animation-fill-mode:none;
    animation-name:pinPop;
  }

  @keyframes pinPop{
    0%{transform:none} 18%{transform:scale(.92)}
    46%{transform:scale(1.22)} 100%{transform:none}
  }

  /* ---- the motions ---- */

  @keyframes pinHeartbeat{          /* draw in, thump, thump, settle */
    0%{transform:none} 10%{transform:scale(.90)}
    24%{transform:scale(1.30)} 38%{transform:scale(1.00)}
    52%{transform:scale(1.20)} 72%{transform:scale(.97)} 100%{transform:none}
  }
  @keyframes pinBreathe{            /* empty first, then fill */
    0%{transform:none} 14%{transform:scaleY(.92) scaleX(1.03)}
    52%{transform:scaleY(1.22) scaleX(1.08)}
    80%{transform:scaleY(.97) scaleX(1.01)} 100%{transform:none}
  }
  @keyframes pinHelix{              /* wind back, then a full turn */
    0%{transform:perspective(200px) rotateY(0) scale(1)}
    14%{transform:perspective(200px) rotateY(-28deg) scale(.94)}
    100%{transform:perspective(200px) rotateY(360deg) scale(1)}
  }
  @keyframes pinThink{
    0%{transform:none;filter:none} 16%{transform:scale(.93) translateY(2px)}
    46%{transform:scale(1.2) translateY(-5px);filter:brightness(1.22)}
    74%{transform:scale(1.02) translateY(0);filter:brightness(1.05)}
    100%{transform:none;filter:none}
  }
  @keyframes pinSiren{              /* a real dash, not a jiggle */
    0%{transform:none;filter:none}
    10%{transform:translateX(5px) rotate(5deg) scale(.95)}
    26%{transform:translateX(-8px) rotate(-8deg) scale(1.1);filter:brightness(1.35)}
    44%{transform:translateX(6px) rotate(6deg)}
    60%{transform:translateX(-4px) rotate(-4deg);filter:brightness(1.2)}
    78%{transform:translateX(2px) rotate(2deg)} 100%{transform:none;filter:none}
  }
  @keyframes pinKnock{              /* wind up, strike, ring out */
    0%{transform:none} 14%{transform:rotate(9deg) scale(.96)}
    34%{transform:rotate(-16deg)} 54%{transform:rotate(11deg)}
    72%{transform:rotate(-6deg)} 88%{transform:rotate(2deg)} 100%{transform:none}
  }
  @keyframes pinListen{             /* turn away, then lean in */
    0%{transform:none} 16%{transform:rotate(7deg) scale(.96)}
    50%{transform:rotate(-20deg) scale(1.14)}
    76%{transform:rotate(6deg) scale(1.02)} 100%{transform:none}
  }
  @keyframes pinBlink{              /* widen, snap shut, open */
    0%{transform:none} 14%{transform:scaleY(1.12)}
    34%{transform:scaleY(.06) scaleX(1.08)}
    56%{transform:scaleY(1.14) scaleX(.98)}
    78%{transform:scaleY(.96)} 100%{transform:none}
  }
  /* The four airborne pins carry a shadow that softens and spreads as they
     rise and snaps tight as they land -- the thing that makes a jump read as
     weight rather than as a sprite sliding up the screen. None of these four
     animate a filter for anything else, so there is nothing to collide with. */
  @keyframes pinHop{                /* crouch, launch, land, bounce */
    0%{transform:none;filter:drop-shadow(0 2px 1px rgba(40,30,20,.28))}
    12%{transform:translateY(3px) scaleY(.86) scaleX(1.12);filter:drop-shadow(0 1px 1px rgba(40,30,20,.34))}
    34%{transform:translateY(-16px) scaleY(1.12) scaleX(.92);filter:drop-shadow(0 13px 7px rgba(40,30,20,.16))}
    52%{transform:translateY(0) scaleY(.9) scaleX(1.1);filter:drop-shadow(0 1px 1px rgba(40,30,20,.36))}
    70%{transform:translateY(-7px) scaleY(1.05) scaleX(.97);filter:drop-shadow(0 7px 4px rgba(40,30,20,.2))}
    88%{transform:translateY(0) scaleY(.96) scaleX(1.04);filter:drop-shadow(0 1px 1px rgba(40,30,20,.32))}
    100%{transform:none;filter:drop-shadow(0 2px 1px rgba(40,30,20,.28))}
  }
  @keyframes pinDrip{               /* gather, fall, splash, recover */
    0%{transform:none;filter:drop-shadow(0 2px 1px rgba(40,30,20,.28))}
    18%{transform:translateY(-7px) scaleY(1.16) scaleX(.9);filter:drop-shadow(0 8px 5px rgba(40,30,20,.18))}
    46%{transform:translateY(8px) scaleY(.82) scaleX(1.16);filter:drop-shadow(0 0 1px rgba(40,30,20,.4))}
    68%{transform:translateY(-3px) scaleY(1.08) scaleX(.96);filter:drop-shadow(0 5px 3px rgba(40,30,20,.22))}
    86%{transform:translateY(1px) scaleY(.98);filter:drop-shadow(0 2px 1px rgba(40,30,20,.3))}
    100%{transform:none;filter:drop-shadow(0 2px 1px rgba(40,30,20,.28))}
  }
  @keyframes pinRattle{
    0%{transform:none} 10%{transform:translateX(-4px) rotate(-9deg)}
    26%{transform:translateX(4px) rotate(9deg)}
    42%{transform:translateX(-3.5px) rotate(-7deg)}
    58%{transform:translateX(3px) rotate(5deg)}
    74%{transform:translateX(-2px) rotate(-3deg)}
    88%{transform:translateX(1px) rotate(1deg)} 100%{transform:none}
  }
  @keyframes pinSwirl{              /* a full stir, not a wiggle */
    0%{transform:none}
    20%{transform:rotate(-16deg) translate(-4px,2px) scale(.97)}
    45%{transform:rotate(0) translate(0,-6px) scale(1.12)}
    70%{transform:rotate(15deg) translate(4px,2px)}
    88%{transform:rotate(-4deg)} 100%{transform:none}
  }
  @keyframes pinLift{               /* dip, rise, float down */
    0%{transform:none;filter:drop-shadow(0 2px 1px rgba(40,30,20,.28))}
    14%{transform:translateY(3px) scale(.95);filter:drop-shadow(0 1px 1px rgba(40,30,20,.34))}
    46%{transform:translateY(-14px) scale(1.16);filter:drop-shadow(0 12px 7px rgba(40,30,20,.15))}
    74%{transform:translateY(-3px) scale(1.03);filter:drop-shadow(0 4px 3px rgba(40,30,20,.24))}
    100%{transform:none;filter:drop-shadow(0 2px 1px rgba(40,30,20,.28))}
  }
  @keyframes pinFlow{
    0%{transform:none;filter:none} 16%{transform:scale(.94)}
    46%{transform:scale(1.18);filter:brightness(1.16) saturate(1.3)}
    72%{transform:scale(1.03);filter:brightness(1.05) saturate(1.1)}
    100%{transform:none;filter:none}
  }
  @keyframes pinWobble{
    0%{transform:none} 14%{transform:skewX(6deg) scale(.97)}
    36%{transform:skewX(-14deg) scale(1.1)}
    58%{transform:skewX(10deg) scale(1.03)}
    78%{transform:skewX(-4deg)} 100%{transform:none}
  }
  @keyframes pinGlow{
    0%{transform:none;filter:none} 18%{transform:scale(.95)}
    52%{transform:scale(1.16);filter:brightness(1.4) saturate(1.35)}
    100%{transform:none;filter:none}
  }
  @keyframes pinShimmer{
    0%{filter:none;transform:none} 16%{transform:scale(.96)}
    42%{filter:brightness(1.45) contrast(1.08);transform:scale(1.11)}
    70%{filter:brightness(1.12);transform:scale(1.01)}
    100%{filter:none;transform:none}
  }
  @keyframes pinPrecise{            /* one deliberate, controlled arc */
    0%{transform:none;filter:drop-shadow(0 2px 1px rgba(40,30,20,.28))}
    20%{transform:translateY(2px) scale(.95);filter:drop-shadow(0 1px 1px rgba(40,30,20,.34))}
    56%{transform:translateY(-9px) rotate(-6deg) scale(1.12);filter:drop-shadow(0 9px 5px rgba(40,30,20,.17))}
    100%{transform:none;filter:drop-shadow(0 2px 1px rgba(40,30,20,.28))}
  }
  @keyframes pinGuard{              /* brace, then plant */
    0%{transform:none} 16%{transform:scale(.92) rotate(4deg)}
    42%{transform:scale(1.26) rotate(-5deg)}
    62%{transform:scale(1.04) rotate(3deg)}
    82%{transform:scale(1.12) rotate(-1deg)} 100%{transform:none}
  }
  @keyframes pinTurn{               /* a page actually turning over */
    0%{transform:perspective(200px) rotateY(0)}
    16%{transform:perspective(200px) rotateY(14deg) scale(.97)}
    58%{transform:perspective(200px) rotateY(-58deg) scale(1.08)}
    100%{transform:perspective(200px) rotateY(0)}
  }
  @keyframes pinSwap{               /* wind back, flip right over */
    0%{transform:perspective(220px) rotateY(0) scale(1)}
    14%{transform:perspective(220px) rotateY(-26deg) scale(.95)}
    100%{transform:perspective(220px) rotateY(360deg) scale(1)}
  }
  @keyframes pinBubble{
    0%{transform:none} 12%{transform:scale(.86)}
    38%{transform:scale(1.34) translateY(-5px)}
    60%{transform:scale(.94) translateY(2px)}
    80%{transform:scale(1.08)} 100%{transform:none}
  }
  @keyframes pinRing{               /* a bell that actually swings out */
    0%{transform:none} 12%{transform:rotate(10deg)}
    28%{transform:rotate(-24deg)} 44%{transform:rotate(19deg)}
    60%{transform:rotate(-13deg)} 74%{transform:rotate(8deg)}
    88%{transform:rotate(-3deg)} 100%{transform:none}
  }
  @keyframes pinFlip{
    0%{transform:perspective(200px) rotateX(0)}
    16%{transform:perspective(200px) rotateX(12deg) scale(.97)}
    58%{transform:perspective(200px) rotateX(-68deg) translateY(-4px)}
    100%{transform:perspective(200px) rotateX(0)}
  }
  @keyframes pinStamp{              /* lift, strike down, rebound */
    0%{transform:none} 22%{transform:scale(1.2) translateY(-6px) rotate(-7deg)}
    44%{transform:scale(.88) translateY(3px) rotate(3deg)}
    66%{transform:scale(1.1) translateY(-2px)} 100%{transform:none}
  }
  @keyframes pinScan{               /* sweep across, then lock on */
    0%{transform:none} 18%{transform:translateX(-7px) rotate(-9deg) scale(.97)}
    46%{transform:translateX(7px) rotate(9deg)}
    70%{transform:translateX(0) rotate(0) scale(1.2)}
    86%{transform:scale(.98)} 100%{transform:none}
  }

  /* ---- the burst layer: what the flat artwork cannot do ---- */

  /* a ring leaving the pin */
  @keyframes burstRing{
    0%{width:8px;height:8px;margin:-4px;opacity:.85;
       box-shadow:0 0 0 2px color-mix(in srgb,var(--burst) 70%,transparent)}
    100%{width:76px;height:76px;margin:-38px;opacity:0;
       box-shadow:0 0 0 1px color-mix(in srgb,var(--burst) 0%,transparent)}
  }
  /* a soft halo swelling and fading */
  @keyframes burstHalo{
    0%{width:10px;height:10px;margin:-5px;opacity:0;
       background:radial-gradient(circle,color-mix(in srgb,var(--burst) 60%,transparent),transparent 70%)}
    40%{opacity:.7}
    100%{width:84px;height:84px;margin:-42px;opacity:0;
       background:radial-gradient(circle,color-mix(in srgb,var(--burst) 60%,transparent),transparent 70%)}
  }
  /* a fast bright flash */
  @keyframes burstFlash{
    0%{width:14px;height:14px;margin:-7px;opacity:.95;
       background:radial-gradient(circle,#fff,color-mix(in srgb,var(--burst) 80%,transparent) 55%,transparent 72%)}
    100%{width:64px;height:64px;margin:-32px;opacity:0;
       background:radial-gradient(circle,#fff,color-mix(in srgb,var(--burst) 80%,transparent) 55%,transparent 72%)}
  }
  /* particles thrown outward */
  @keyframes burstSparks{
    0%{width:5px;height:5px;margin:-2.5px;opacity:1;border-radius:50%;
       box-shadow:0 0 0 0 var(--burst),0 0 0 0 var(--burst),0 0 0 0 var(--burst),
                  0 0 0 0 var(--burst),0 0 0 0 var(--burst),0 0 0 0 var(--burst)}
    100%{width:3px;height:3px;margin:-1.5px;opacity:0;border-radius:50%;
       box-shadow:0 -30px 0 0 var(--burst),26px -15px 0 0 var(--burst),26px 15px 0 0 var(--burst),
                  0 30px 0 0 var(--burst),-26px 15px 0 0 var(--burst),-26px -15px 0 0 var(--burst)}
  }
  /* an arc sweeping round, for anything that turns or searches */
  @keyframes burstArc{
    0%{width:26px;height:26px;margin:-13px;opacity:0;border-radius:50%;
       background:conic-gradient(from 0deg,color-mix(in srgb,var(--burst) 75%,transparent) 0 42deg,transparent 42deg);
       transform:rotate(0)}
    30%{opacity:.75}
    100%{width:72px;height:72px;margin:-36px;opacity:0;border-radius:50%;
       background:conic-gradient(from 0deg,color-mix(in srgb,var(--burst) 75%,transparent) 0 42deg,transparent 42deg);
       transform:rotate(300deg)}
  }

  /* ---- the second wave ----
     One shape leaving the pin reads as a single event. A second, delayed and
     turned against the first, reads as an effect: a double ripple off a
     heartbeat, six more sparks between the first six, a ring chasing the
     flash out. Same flavour families, offset in time and geometry. */
  @keyframes burstRing2{
    0%{width:6px;height:6px;margin:-3px;opacity:.6;
       box-shadow:0 0 0 1.5px color-mix(in srgb,var(--burst) 55%,transparent)}
    100%{width:54px;height:54px;margin:-27px;opacity:0;
       box-shadow:0 0 0 1px color-mix(in srgb,var(--burst) 0%,transparent)}
  }
  @keyframes burstHalo2{
    0%{width:8px;height:8px;margin:-4px;opacity:0;
       box-shadow:0 0 0 1.5px color-mix(in srgb,var(--burst) 45%,transparent)}
    45%{opacity:.5}
    100%{width:62px;height:62px;margin:-31px;opacity:0;
       box-shadow:0 0 0 1px color-mix(in srgb,var(--burst) 0%,transparent)}
  }
  @keyframes burstFlash2{
    0%{width:10px;height:10px;margin:-5px;opacity:0;
       box-shadow:0 0 0 2px color-mix(in srgb,#fff 70%,transparent)}
    30%{opacity:.8}
    100%{width:70px;height:70px;margin:-35px;opacity:0;
       box-shadow:0 0 0 1px color-mix(in srgb,var(--burst) 0%,transparent)}
  }
  /* six more particles, dropped between the first six and thrown less far */
  @keyframes burstSparks2{
    0%{width:4px;height:4px;margin:-2px;opacity:.9;
       box-shadow:0 0 0 0 var(--burst),0 0 0 0 var(--burst),0 0 0 0 var(--burst),
                  0 0 0 0 var(--burst),0 0 0 0 var(--burst),0 0 0 0 var(--burst)}
    100%{width:2px;height:2px;margin:-1px;opacity:0;
       box-shadow:15px -20px 0 0 var(--burst),24px 4px 0 0 var(--burst),9px 22px 0 0 var(--burst),
                  -15px 20px 0 0 var(--burst),-24px -4px 0 0 var(--burst),-9px -22px 0 0 var(--burst)}
  }
  /* turning the other way, so the two arcs cross */
  @keyframes burstArc2{
    0%{width:20px;height:20px;margin:-10px;opacity:0;
       background:conic-gradient(from 180deg,color-mix(in srgb,var(--burst) 55%,transparent) 0 30deg,transparent 30deg);
       transform:rotate(0)}
    35%{opacity:.6}
    100%{width:58px;height:58px;margin:-29px;opacity:0;
       background:conic-gradient(from 180deg,color-mix(in srgb,var(--burst) 55%,transparent) 0 30deg,transparent 30deg);
       transform:rotate(-260deg)}
  }

  [data-pin].is-tapped::after{ animation-duration:.72s; animation-timing-function:cubic-bezier(.16,.84,.34,1); }
  [data-pin].is-tapped::before{ animation-duration:.8s; animation-delay:.08s; animation-timing-function:cubic-bezier(.16,.84,.34,1); }

  [data-pin="cardiology"].is-tapped::after,[data-pin="heart-failure"].is-tapped::after,
  [data-pin="chat"].is-tapped::after,[data-pin="practice"].is-tapped::after,
  [data-pin="ethics"].is-tapped::after,[data-pin="pediatrics"].is-tapped::after{ animation-name:burstRing; }
  [data-pin="cardiology"].is-tapped::before,[data-pin="heart-failure"].is-tapped::before,
  [data-pin="chat"].is-tapped::before,[data-pin="practice"].is-tapped::before,
  [data-pin="ethics"].is-tapped::before,[data-pin="pediatrics"].is-tapped::before{ animation-name:burstRing2; }

  [data-pin="pulmonology"].is-tapped::after,[data-pin="neurology"].is-tapped::after,
  [data-pin="developmental"].is-tapped::after,[data-pin="endocrinology"].is-tapped::after,
  [data-pin="hematology"].is-tapped::after,[data-pin="leukemia"].is-tapped::after,
  [data-pin="nephrology"].is-tapped::after,[data-pin="urology"].is-tapped::after{ animation-name:burstHalo; }
  [data-pin="pulmonology"].is-tapped::before,[data-pin="neurology"].is-tapped::before,
  [data-pin="developmental"].is-tapped::before,[data-pin="endocrinology"].is-tapped::before,
  [data-pin="hematology"].is-tapped::before,[data-pin="leukemia"].is-tapped::before,
  [data-pin="nephrology"].is-tapped::before,[data-pin="urology"].is-tapped::before{ animation-name:burstHalo2; }

  [data-pin="emergency"].is-tapped::after,[data-pin="dermatology"].is-tapped::after,
  [data-pin="infectious-disease"].is-tapped::after,[data-pin="surgery-anesthesia"].is-tapped::after,
  [data-pin="orthopedics"].is-tapped::after{ animation-name:burstFlash; }
  [data-pin="emergency"].is-tapped::before,[data-pin="dermatology"].is-tapped::before,
  [data-pin="infectious-disease"].is-tapped::before,[data-pin="surgery-anesthesia"].is-tapped::before,
  [data-pin="orthopedics"].is-tapped::before{ animation-name:burstFlash2; }

  [data-pin="genetics"].is-tapped::after,[data-pin="oncology"].is-tapped::after,
  [data-pin="laboratory"].is-tapped::after,[data-pin="pharmacy"].is-tapped::after,
  [data-pin="infusion"].is-tapped::after,[data-pin="ent"].is-tapped::after,
  [data-pin="ophthalmology"].is-tapped::after{ animation-name:burstSparks; }
  [data-pin="genetics"].is-tapped::before,[data-pin="oncology"].is-tapped::before,
  [data-pin="laboratory"].is-tapped::before,[data-pin="pharmacy"].is-tapped::before,
  [data-pin="infusion"].is-tapped::before,[data-pin="ent"].is-tapped::before,
  [data-pin="ophthalmology"].is-tapped::before{ animation-name:burstSparks2; }

  [data-pin="translate"].is-tapped::after,[data-pin="review"].is-tapped::after,
  [data-pin="medical-terminology"].is-tapped::after,[data-pin="userguide"].is-tapped::after,
  [data-pin="resources"].is-tapped::after,[data-pin="directory"].is-tapped::after,
  [data-pin="events"].is-tapped::after,[data-pin="updates"].is-tapped::after,
  [data-pin="doctor-prep"].is-tapped::after,[data-pin="doctor-directory"].is-tapped::after,
  [data-pin="providers"].is-tapped::after,[data-pin="find-doctor"].is-tapped::after,
  [data-pin="medifind"].is-tapped::after,[data-pin="wave"].is-tapped::after{ animation-name:burstArc; }
  [data-pin="translate"].is-tapped::before,[data-pin="review"].is-tapped::before,
  [data-pin="medical-terminology"].is-tapped::before,[data-pin="userguide"].is-tapped::before,
  [data-pin="resources"].is-tapped::before,[data-pin="directory"].is-tapped::before,
  [data-pin="events"].is-tapped::before,[data-pin="updates"].is-tapped::before,
  [data-pin="doctor-prep"].is-tapped::before,[data-pin="doctor-directory"].is-tapped::before,
  [data-pin="providers"].is-tapped::before,[data-pin="find-doctor"].is-tapped::before,
  [data-pin="medifind"].is-tapped::before,[data-pin="wave"].is-tapped::before{ animation-name:burstArc2; }

  [data-pin="cardiology"]     .is-tapped{animation-name:pinHeartbeat;animation-duration:.86s}
  [data-pin="heart-failure"]  .is-tapped{animation-name:pinHeartbeat;animation-duration:1.02s}
  [data-pin="pulmonology"]    .is-tapped{animation-name:pinBreathe;animation-duration:1.15s}
  [data-pin="genetics"]       .is-tapped{animation-name:pinHelix;animation-duration:1s}
  [data-pin="neurology"]      .is-tapped{animation-name:pinThink;animation-duration:.8s}
  [data-pin="developmental"]  .is-tapped{animation-name:pinThink;animation-duration:.96s}
  [data-pin="emergency"]      .is-tapped{animation-name:pinSiren;animation-duration:.74s}
  [data-pin="orthopedics"]    .is-tapped{animation-name:pinKnock;animation-duration:.7s}
  [data-pin="ent"]            .is-tapped{animation-name:pinListen;animation-duration:.82s}
  [data-pin="ophthalmology"]  .is-tapped{animation-name:pinBlink;animation-duration:.6s}
  [data-pin="pediatrics"]     .is-tapped{animation-name:pinHop;animation-duration:.9s}
  [data-pin="infusion"]       .is-tapped{animation-name:pinDrip;animation-duration:.9s}
  [data-pin="pharmacy"]       .is-tapped{animation-name:pinRattle;animation-duration:.72s}
  [data-pin="laboratory"]     .is-tapped{animation-name:pinSwirl;animation-duration:.88s}
  [data-pin="oncology"]       .is-tapped{animation-name:pinLift;animation-duration:.94s}
  [data-pin="hematology"]     .is-tapped{animation-name:pinFlow;animation-duration:.92s}
  [data-pin="leukemia"]       .is-tapped{animation-name:pinFlow;animation-duration:.76s}
  [data-pin="nephrology"]     .is-tapped{animation-name:pinWobble;animation-duration:.78s}
  [data-pin="urology"]        .is-tapped{animation-name:pinWobble;animation-duration:.94s}
  [data-pin="endocrinology"]  .is-tapped{animation-name:pinGlow;animation-duration:.98s}
  [data-pin="dermatology"]    .is-tapped{animation-name:pinShimmer;animation-duration:.84s}
  [data-pin="surgery-anesthesia"] .is-tapped{animation-name:pinPrecise;animation-duration:.68s}
  [data-pin="infectious-disease"] .is-tapped{animation-name:pinGuard;animation-duration:.8s}
  [data-pin="medical-terminology"] .is-tapped{animation-name:pinTurn;animation-duration:.86s}
  [data-pin="userguide"]      .is-tapped{animation-name:pinTurn;animation-duration:.74s}
  [data-pin="resources"]      .is-tapped{animation-name:pinTurn;animation-duration:.98s}
  [data-pin="directory"]      .is-tapped{animation-name:pinTurn;animation-duration:.66s}
  [data-pin="translate"]      .is-tapped{animation-name:pinSwap;animation-duration:.78s}
  [data-pin="review"]         .is-tapped{animation-name:pinSwap;animation-duration:.96s}
  [data-pin="chat"]           .is-tapped{animation-name:pinBubble;animation-duration:.74s}
  [data-pin="updates"]        .is-tapped{animation-name:pinRing;animation-duration:.94s;transform-origin:50% 10%}
  [data-pin="events"]         .is-tapped{animation-name:pinFlip;animation-duration:.82s}
  [data-pin="practice"]       .is-tapped{animation-name:pinStamp;animation-duration:.7s}
  [data-pin="ethics"]         .is-tapped{animation-name:pinStamp;animation-duration:.88s}
  [data-pin="doctor-prep"]    .is-tapped{animation-name:pinScan;animation-duration:.8s}
  [data-pin="doctor-directory"] .is-tapped{animation-name:pinScan;animation-duration:.96s}
  [data-pin="providers"]      .is-tapped{animation-name:pinScan;animation-duration:.72s}
  [data-pin="find-doctor"]    .is-tapped{animation-name:pinScan;animation-duration:.88s}
  [data-pin="medifind"]       .is-tapped{animation-name:pinScan;animation-duration:.64s}
  [data-pin="wave"]           .is-tapped{animation-name:pinListen;animation-duration:.68s}

  @media (prefers-reduced-motion: reduce){
    .medical-pin.is-tapped, .pin-sprite.is-tapped{animation:none !important}
    [data-pin].is-tapped::after,[data-pin].is-tapped::before{animation:none !important;opacity:0 !important}
  }
  `;
  document.head.appendChild(medicalStyle);

  // Remove only edge-connected pale background pixels. Enclosed white coats,
  // books, bones and other white enamel details remain opaque.
  /* ---- Play a pin's animation when its card is tapped -------------------
     Its own class, cleared on animationend, for the same reason the domain
     name flow uses one: .is-pressed only survives about 320ms on a quick tap
     and several of these run longer than that, so anything hung off the press
     state would be cut off part-way.

     The tab bar is deliberately not in the list. Its four pins are the same
     on every screen, so animating them would fire on every single navigation
     rather than being an occasional moment. */
  const TAP_CARDS = '.home-tile, .domain-family, .qa-card, .qa-tile, .domain-chip, .side-row, .folder-tile';
  document.addEventListener('pointerdown', (e) => {
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const card = e.target.closest && e.target.closest(TAP_CARDS);
    if(!card) return;
    const pinEl = card.querySelector('.medical-pin, .pin-sprite');
    if(!pinEl || pinEl.classList.contains('is-tapped')) return;
    const holder = pinEl.closest('[data-pin]');
    pinEl.classList.add('is-tapped');
    if(holder) holder.classList.add('is-tapped');   // the burst rides on this
    pinEl.addEventListener('animationend', () => {
      pinEl.classList.remove('is-tapped');
      if(holder) holder.classList.remove('is-tapped');
    }, { once:true });
  }, { passive:true });

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

  // Match the approved preview's optical sizing. Trim only transparent space
  // after the existing background/caption cleanup, then fit each pin into the
  // same square without stretching it or changing any artwork pixels.
  function fittedPinURL(canvas){
    const ctx = canvas.getContext('2d');
    const {width, height} = canvas;
    const {data} = ctx.getImageData(0, 0, width, height);
    let left = width, top = height, right = -1, bottom = -1;
    for(let y=0; y<height; y++) for(let x=0; x<width; x++){
      if(data[(y*width+x)*4+3] > 50){
        left = Math.min(left,x); top = Math.min(top,y);
        right = Math.max(right,x); bottom = Math.max(bottom,y);
      }
    }
    if(right < left || bottom < top) return canvas.toDataURL('image/png');
    left = Math.max(0,left-2); top = Math.max(0,top-2);
    right = Math.min(width-1,right+2); bottom = Math.min(height-1,bottom+2);
    const fitted = document.createElement('canvas');
    fitted.width = fitted.height = 256;
    const output = fitted.getContext('2d');
    if(!output) return canvas.toDataURL('image/png');
    const w = right-left+1, h = bottom-top+1, scale = 252/Math.max(w,h);
    output.drawImage(canvas,left,top,w,h,(256-w*scale)/2,(256-h*scale)/2,w*scale,h*scale);
    return fitted.toDataURL('image/png');
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
        prepared[key] = fittedPinURL(canvas);
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


  // Label-free 2 x 2 specialty sheet. Keep each quadrant separate and preserve
  // its original transparency and enamel details.
  const specialtyImage = new Image();
  specialtyImage.onload = () => {
    try{
      if(Math.abs(specialtyImage.naturalWidth / specialtyImage.naturalHeight - 1) > 0.02){
        throw new Error('Expected the square four-pin specialty sheet.');
      }
      const names = ['infectious-disease','dermatology','ophthalmology','surgery-anesthesia'];
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if(!ctx) return;
      const w = specialtyImage.naturalWidth / 2, h = specialtyImage.naturalHeight / 2;
      const prepared = Object.create(null);
      names.forEach((key, i) => {
        ctx.clearRect(0, 0, 256, 256);
        ctx.drawImage(specialtyImage, (i % 2) * w, Math.floor(i / 2) * h,
          w, h, 0, 0, 256, 256);
        prepared[key] = fittedPinURL(canvas);
      });
      Object.assign(medicalArtwork, prepared);
      if(typeof DOMAIN_ICONS !== 'undefined'){
        names.forEach(key => { DOMAIN_ICONS[key] = medicalHTML(key); });
      }
      if(typeof render === 'function') render();
      applyExactPins();
    }catch(error){
      console.warn('Specialty pins unavailable; keeping existing icons.', error);
    }
  };
  specialtyImage.onerror = () => console.warn('Specialty pin sheet unavailable; keeping existing icons.');
  specialtyImage.src = './specialty-pins.png.PNG';

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
