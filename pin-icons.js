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
  background-image:url('./pin-icons.webp');
  background-repeat:no-repeat;
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
    if(!el || !coords) return;
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
  }

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
