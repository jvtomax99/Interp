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
     The artwork is a flat image, so there are no inner parts to animate: the
     whole pin is the only thing that can move. That is the constraint these
     are written against -- a heart can beat, a bell can swing, an ear can
     turn toward you, but nothing can move independently inside the frame.

     Keyed off data-pin, which placeMedicalPin() writes. Icons that genuinely
     depict the same object share a motion on purpose -- both heart pins beat,
     because a second invented motion would be arbitrary, not distinct. */

  .medical-pin, .pin-sprite{
    transform-origin:50% 60%;
    will-change:transform;
  }
  .medical-pin.is-tapped, .pin-sprite.is-tapped{
    animation-duration:.62s;
    animation-timing-function:cubic-bezier(.2,.8,.2,1);
    animation-fill-mode:none;
    animation-name:pinPop;                 /* the default, overridden below */
  }

  /* the fallback: a clean press-and-return */
  @keyframes pinPop{
    0%{ transform:none; } 34%{ transform:scale(1.18); } 100%{ transform:none; }
  }

  /* Cardiology and heart failure -- a double thump, systole then diastole. */
  @keyframes pinHeartbeat{
    0%{transform:none} 14%{transform:scale(1.22)} 28%{transform:scale(1.02)}
    42%{transform:scale(1.16)} 70%{transform:scale(.99)} 100%{transform:none}
  }
  /* Pulmonology -- one full breath, in and out, slower than everything else. */
  @keyframes pinBreathe{
    0%{transform:none} 45%{transform:scaleY(1.16) scaleX(1.06)}
    75%{transform:scaleY(.96) scaleX(1.01)} 100%{transform:none}
  }
  /* Genetics -- the helix turns over. */
  @keyframes pinHelix{
    0%{transform:perspective(220px) rotateY(0)}
    100%{transform:perspective(220px) rotateY(360deg)}
  }
  /* Neurology and developmental -- a thought arriving: pulse plus a lift. */
  @keyframes pinThink{
    0%{transform:none;filter:none}
    35%{transform:scale(1.14) translateY(-2px);filter:brightness(1.15)}
    70%{transform:scale(1.02) translateY(0);filter:brightness(1.04)}
    100%{transform:none;filter:none}
  }
  /* Emergency -- the dash, with the siren flash on it. */
  @keyframes pinSiren{
    0%{transform:none;filter:none}
    12%{transform:translateX(-3px) rotate(-4deg);filter:brightness(1.22)}
    30%{transform:translateX(4px) rotate(3deg)}
    48%{transform:translateX(-3px) rotate(-2deg);filter:brightness(1.18)}
    68%{transform:translateX(2px) rotate(1deg)}
    100%{transform:none;filter:none}
  }
  /* Orthopedics -- rigid. It knocks rather than squashes. */
  @keyframes pinKnock{
    0%{transform:none} 20%{transform:rotate(-9deg)} 45%{transform:rotate(7deg)}
    68%{transform:rotate(-3deg)} 100%{transform:none}
  }
  /* ENT -- turning an ear toward the sound. */
  @keyframes pinListen{
    0%{transform:none} 38%{transform:rotate(-13deg) scale(1.08)}
    72%{transform:rotate(4deg) scale(1.02)} 100%{transform:none}
  }
  /* Ophthalmology -- a blink. */
  @keyframes pinBlink{
    0%{transform:none} 22%{transform:scaleY(.12) scaleX(1.04)}
    44%{transform:scaleY(1.06)} 100%{transform:none}
  }
  /* Pediatrics -- two hops, landing light. */
  @keyframes pinHop{
    0%{transform:none} 22%{transform:translateY(-8px) scale(1.04)}
    42%{transform:translateY(0) scaleY(.94) scaleX(1.06)}
    62%{transform:translateY(-4px) scale(1.02)}
    82%{transform:translateY(0) scaleY(.98) scaleX(1.02)} 100%{transform:none}
  }
  /* Infusion -- a drop falls and the line settles. */
  @keyframes pinDrip{
    0%{transform:none} 30%{transform:translateY(-5px) scaleY(1.1)}
    58%{transform:translateY(5px) scaleY(.9)}
    78%{transform:translateY(0) scaleY(1.04)} 100%{transform:none}
  }
  /* Pharmacy -- pills rattling in the bottle. */
  @keyframes pinRattle{
    0%{transform:none} 15%{transform:translateX(-2.5px) rotate(-6deg)}
    32%{transform:translateX(2.5px) rotate(6deg)}
    49%{transform:translateX(-2px) rotate(-4deg)}
    66%{transform:translateX(1.5px) rotate(3deg)}
    83%{transform:translateX(-1px) rotate(-1deg)} 100%{transform:none}
  }
  /* Laboratory -- the swirl of a sample being mixed. */
  @keyframes pinSwirl{
    0%{transform:none} 25%{transform:rotate(-11deg) translateX(-2px)}
    50%{transform:rotate(0) translateY(-3px) scale(1.07)}
    75%{transform:rotate(9deg) translateX(2px)} 100%{transform:none}
  }
  /* Oncology -- the ribbon lifts and settles. Deliberately gentle. */
  @keyframes pinLift{
    0%{transform:none} 40%{transform:translateY(-7px) scale(1.09)}
    72%{transform:translateY(1px) scale(.99)} 100%{transform:none}
  }
  /* Haematology and leukaemia -- a slow pulse through the blood. */
  @keyframes pinFlow{
    0%{transform:none;filter:none}
    30%{transform:scale(1.11);filter:brightness(1.1) saturate(1.2)}
    60%{transform:scale(1.03);filter:brightness(1.03) saturate(1.08)}
    100%{transform:none;filter:none}
  }
  /* Nephrology and urology -- the wobble of something filtering. */
  @keyframes pinWobble{
    0%{transform:none} 22%{transform:skewX(-7deg) scale(1.05)}
    48%{transform:skewX(5deg) scale(1.02)}
    72%{transform:skewX(-2deg)} 100%{transform:none}
  }
  /* Endocrinology -- a slow glow, the way a hormone acts. */
  @keyframes pinGlow{
    0%{transform:none;filter:none}
    45%{transform:scale(1.1);filter:brightness(1.28) saturate(1.25)}
    100%{transform:none;filter:none}
  }
  /* Dermatology -- a shimmer across the surface. */
  @keyframes pinShimmer{
    0%{filter:none;transform:none}
    30%{filter:brightness(1.3) contrast(1.05);transform:scale(1.04)}
    60%{filter:brightness(1.08);transform:scale(1.01)}
    100%{filter:none;transform:none}
  }
  /* Surgery and anaesthesia -- one precise, unhurried movement. */
  @keyframes pinPrecise{
    0%{transform:none} 45%{transform:translateY(-4px) rotate(-3deg) scale(1.06)}
    100%{transform:none}
  }
  /* Infectious disease -- a guard going up. */
  @keyframes pinGuard{
    0%{transform:none} 25%{transform:scale(1.16) rotate(-3deg)}
    45%{transform:scale(1.04) rotate(2deg)}
    65%{transform:scale(1.1) rotate(-1deg)} 100%{transform:none}
  }
  /* Anything that opens: a page, a book, a directory. */
  @keyframes pinTurn{
    0%{transform:perspective(220px) rotateY(0)}
    50%{transform:perspective(220px) rotateY(-32deg) scale(1.05)}
    100%{transform:perspective(220px) rotateY(0)}
  }
  /* Translate and review -- the two sides swap over. */
  @keyframes pinSwap{
    0%{transform:perspective(240px) rotateY(0)}
    100%{transform:perspective(240px) rotateY(180deg)}
  }
  /* Chat -- the bounce of a message landing. */
  @keyframes pinBubble{
    0%{transform:none} 26%{transform:scale(1.24) translateY(-3px)}
    52%{transform:scale(.96) translateY(1px)}
    78%{transform:scale(1.06)} 100%{transform:none}
  }
  /* Updates -- the bell swings from its top. */
  @keyframes pinRing{
    0%{transform:none} 16%{transform:rotate(-17deg)} 36%{transform:rotate(14deg)}
    54%{transform:rotate(-9deg)} 72%{transform:rotate(5deg)}
    88%{transform:rotate(-2deg)} 100%{transform:none}
  }
  /* Events -- a page of the calendar flips up. */
  @keyframes pinFlip{
    0%{transform:perspective(220px) rotateX(0)}
    50%{transform:perspective(220px) rotateX(-42deg) translateY(-2px)}
    100%{transform:perspective(220px) rotateX(0)}
  }
  /* Practice and ethics -- a firm, settled confirmation. */
  @keyframes pinStamp{
    0%{transform:scale(1)} 30%{transform:scale(1.26) rotate(-5deg)}
    55%{transform:scale(.95) rotate(2deg)} 100%{transform:none}
  }
  /* Anything about finding someone -- a scan across, then focus. */
  @keyframes pinScan{
    0%{transform:none} 25%{transform:translateX(-4px) rotate(-6deg)}
    55%{transform:translateX(4px) rotate(6deg)}
    80%{transform:translateX(0) scale(1.12)} 100%{transform:none}
  }

  [data-pin="cardiology"]     .is-tapped{animation-name:pinHeartbeat;animation-duration:.78s}
  [data-pin="heart-failure"]  .is-tapped{animation-name:pinHeartbeat;animation-duration:.92s}
  [data-pin="pulmonology"]    .is-tapped{animation-name:pinBreathe;animation-duration:1.05s}
  [data-pin="genetics"]       .is-tapped{animation-name:pinHelix;animation-duration:.95s}
  [data-pin="neurology"]      .is-tapped{animation-name:pinThink;animation-duration:.72s}
  [data-pin="developmental"]  .is-tapped{animation-name:pinThink;animation-duration:.88s}
  [data-pin="emergency"]      .is-tapped{animation-name:pinSiren;animation-duration:.66s}
  [data-pin="orthopedics"]    .is-tapped{animation-name:pinKnock;animation-duration:.6s}
  [data-pin="ent"]            .is-tapped{animation-name:pinListen;animation-duration:.74s}
  [data-pin="ophthalmology"]  .is-tapped{animation-name:pinBlink;animation-duration:.5s}
  [data-pin="pediatrics"]     .is-tapped{animation-name:pinHop;animation-duration:.8s}
  [data-pin="infusion"]       .is-tapped{animation-name:pinDrip;animation-duration:.82s}
  [data-pin="pharmacy"]       .is-tapped{animation-name:pinRattle;animation-duration:.64s}
  [data-pin="laboratory"]     .is-tapped{animation-name:pinSwirl;animation-duration:.8s}
  [data-pin="oncology"]       .is-tapped{animation-name:pinLift;animation-duration:.86s}
  [data-pin="hematology"]     .is-tapped{animation-name:pinFlow;animation-duration:.84s}
  [data-pin="leukemia"]       .is-tapped{animation-name:pinFlow;animation-duration:.68s}
  [data-pin="nephrology"]     .is-tapped{animation-name:pinWobble;animation-duration:.7s}
  [data-pin="urology"]        .is-tapped{animation-name:pinWobble;animation-duration:.86s}
  [data-pin="endocrinology"]  .is-tapped{animation-name:pinGlow;animation-duration:.9s}
  [data-pin="dermatology"]    .is-tapped{animation-name:pinShimmer;animation-duration:.76s}
  [data-pin="surgery-anesthesia"] .is-tapped{animation-name:pinPrecise;animation-duration:.6s}
  [data-pin="infectious-disease"] .is-tapped{animation-name:pinGuard;animation-duration:.72s}
  [data-pin="medical-terminology"] .is-tapped{animation-name:pinTurn;animation-duration:.78s}
  [data-pin="userguide"]      .is-tapped{animation-name:pinTurn;animation-duration:.66s}
  [data-pin="resources"]      .is-tapped{animation-name:pinTurn;animation-duration:.9s}
  [data-pin="directory"]      .is-tapped{animation-name:pinTurn;animation-duration:.58s}
  [data-pin="translate"]      .is-tapped{animation-name:pinSwap;animation-duration:.7s}
  [data-pin="review"]         .is-tapped{animation-name:pinSwap;animation-duration:.88s}
  [data-pin="chat"]           .is-tapped{animation-name:pinBubble;animation-duration:.66s}
  [data-pin="updates"]        .is-tapped{animation-name:pinRing;animation-duration:.86s;transform-origin:50% 12%}
  [data-pin="events"]         .is-tapped{animation-name:pinFlip;animation-duration:.74s}
  [data-pin="practice"]       .is-tapped{animation-name:pinStamp;animation-duration:.62s}
  [data-pin="ethics"]         .is-tapped{animation-name:pinStamp;animation-duration:.8s}
  [data-pin="doctor-prep"]    .is-tapped{animation-name:pinScan;animation-duration:.72s}
  [data-pin="doctor-directory"] .is-tapped{animation-name:pinScan;animation-duration:.88s}
  [data-pin="providers"]      .is-tapped{animation-name:pinScan;animation-duration:.64s}
  [data-pin="find-doctor"]    .is-tapped{animation-name:pinScan;animation-duration:.8s}
  [data-pin="medifind"]       .is-tapped{animation-name:pinScan;animation-duration:.56s}
  [data-pin="wave"]           .is-tapped{animation-name:pinListen;animation-duration:.6s}

  @media (prefers-reduced-motion: reduce){
    .medical-pin.is-tapped, .pin-sprite.is-tapped{animation:none !important}
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
    pinEl.classList.add('is-tapped');
    pinEl.addEventListener('animationend', () => pinEl.classList.remove('is-tapped'), { once:true });
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
