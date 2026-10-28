// ---- Toy look: a switch to try the "toy model" style of the train diorama Jose sent (2026-10-28), live, on the phone.
// Satin plastic (smoother, no metal), richer colours at the same brightness, a touch more fill light, a dark
// studio backdrop instead of the sky, and the miniature blur at the top and bottom of the screen (a CSS backdrop blur
// under a gradient mask, so the phone's compositor does it, not an extra WebGL pass). Everything is undone when it's
// switched off. The choice is kept on the phone (localStorage) so the frame-rate reading can be compared both ways.
{ const KEY = 'campus_toy', orig = new Map(), hsl = {};
  const look = m => { if (!m || orig.has(m) || !m.isMeshStandardMaterial) return;
    orig.set(m, { c:m.color.clone(), r:m.roughness, mt:m.metalness, e:m.envMapIntensity }); };
  const toyM = m => { const o = orig.get(m); if (!o) return;
    const glass = o.mt > 0.3 && o.r < 0.2;   // glass and mirror stay glass: they already read as toy windows
    m.color.copy(o.c).getHSL(hsl); m.color.setHSL(hsl.h, Math.min(1, hsl.s*1.5 + 0.06), hsl.l);
    if (!glass){ m.roughness = Math.min(o.r, 0.55); m.metalness = 0; } };
  const back = m => { const o = orig.get(m); if (!o) return; m.color.copy(o.c); m.roughness = o.r; m.metalness = o.mt; m.envMapIntensity = o.e; };
  const all = () => { const ms = new Set(); scene.traverse(o => { if (!o.isMesh) return; [].concat(o.material).forEach(m => ms.add(m));
    if (o.userData.litM) ms.add(o.userData.litM); if (o.userData.dark) ms.add(o.userData.dark); }); return ms; };
  const css = document.createElement('style'); css.textContent =
    'body.toy #stage{background:radial-gradient(120% 80% at 50% 38%,#3a3d44 0%,#22242a 55%,#16171b 100%) !important}' +
    '#tiltBlur{position:fixed;inset:0;pointer-events:none;z-index:1;display:none;backdrop-filter:blur(3.5px);-webkit-backdrop-filter:blur(3.5px);' +
    '-webkit-mask-image:linear-gradient(#000 0%,rgba(0,0,0,.85) 14%,transparent 34%,transparent 62%,rgba(0,0,0,.85) 82%,#000 100%);' +
    'mask-image:linear-gradient(#000 0%,rgba(0,0,0,.85) 14%,transparent 34%,transparent 62%,rgba(0,0,0,.85) 82%,#000 100%)}' +
    'body.toy #tiltBlur{display:block}';
  document.head.appendChild(css);
  const blur = document.createElement('div'); blur.id = 'tiltBlur'; document.body.appendChild(blur);
  let on = false, fogKeep = null, hemiK = 1;
  function setToy(v){ on = v; document.body.classList.toggle('toy', v);
    const ms = all(); ms.forEach(look); ms.forEach(v ? toyM : back);
    if (v){ fogKeep = scene.fog; scene.fog = null; hemiK = 1.1; renderer.toneMappingExposure = 1.04; }
    else { if (fogKeep) scene.fog = fogKeep; hemiK = 1; renderer.toneMappingExposure = 1.0; }
    btn.textContent = v ? 'Real look' : 'Toy look'; btn.setAttribute('aria-pressed', v ? 'true' : 'false');
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch(e){}
    if (typeof shadowsDirty === 'function') shadowsDirty(); }
  // the brighter fill rides on the runtime's own light for the hour
  const _setHour = setHour; setHour = h => { _setHour(h); if (on) HEMI.intensity *= hemiK; };
  // windows switching lit at dusk bring in materials of their own: give them the look too
  const _frameHook = controls.update.bind(controls); let n = 0;
  controls.update = () => { _frameHook(); if (on && (++n % 60) === 0){ const ms = all(); ms.forEach(m => { if (!orig.has(m)){ look(m); toyM(m); } }); } };
  const btn = document.createElement('button'); btn.type = 'button'; btn.id = 'toyBtn'; btn.className = 'chip'; btn.textContent = 'Toy look';
  btn.style.cssText = 'position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:calc(env(safe-area-inset-bottom,0px) + 190px);padding:11px 15px;font-size:13px;color:var(--ink);font-family:inherit;cursor:pointer;z-index:2';
  btn.onclick = () => { setToy(!on); setHour(hourNow); };
  document.body.appendChild(btn);
  let want = new URLSearchParams(location.search).get('toy') === '1'; try { if (localStorage.getItem(KEY) === '1') want = true; } catch(e){}
  if (want) requestAnimationFrame(() => { setToy(true); setHour(hourNow); });
  window.__toy = v => { setToy(v); setHour(hourNow); }; }
