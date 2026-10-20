// The 3D promo remake (BRIEF.md). Steps 4 onward add their shots here.
// Step 4: the hook (v11's copy as thick 3D words, each under one spotlight,
// the camera flying through them, cuts on the beat) and the logo (the app
// icon's 16 tiles rise out of a phone and assemble inside rings of light).
// Every frame is a pure function of time (hf-seek), so any frame renders the same.
import * as THREE from "three";
import { FontLoader } from "../../vendor/addons/FontLoader.js";
import { TextGeometry } from "../../vendor/addons/TextGeometry.js";
import { EffectComposer } from "../../vendor/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "../../vendor/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../../vendor/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "../../vendor/addons/postprocessing/OutputPass.js";
import { RoundedBoxGeometry } from "../../vendor/RoundedBoxGeometry.js";
import { BokehPass } from "../../vendor/addons/postprocessing/BokehPass.js";
import { buildFeatures, FEATURES, FEATURE_LEN } from "./features.js";
import { buildEnd } from "./end.js";
import { clamp, lerp, prog, outBack, outExpo, outCubic, inOutExpo, inOutSine } from "../util.js";

const root = document.getElementById("root");
const W = +root.dataset.width, H = +root.dataset.height;
const DURATION = +root.dataset.duration;
// the HUMC opener runs first; everything after it keeps its own clock (t = time - OPEN)
const OPEN = 2.0;

const C = { navy0: 0x03061a, navy1: 0x0b1640, navy2: 0x1a3a96, cyan: 0x3fc6ee, red: 0xf0436a, white: 0xffffff };

/* The hook, cut to the music's beats (120 BPM, beats on .0/.5; strong at
   2.4, 3.84, 4.86, 5.99, 7.0, 8.0). Each shot: [start, end, group]. */
const SHOTS = [
  [0.0, 1.0, "says"],
  [1.0, 2.4, "doctor"],
  [2.4, 3.4, "timer"],
  [3.4, 5.98, "wrong"],
  [5.98, 7.5, "right"],
  [7.5, 9.5, "logo"],
  // features 1-5 (features.js), 2.5 s each
  ...FEATURES.map((f, i) => [9.5 + i * FEATURE_LEN, 9.5 + (i + 1) * FEATURE_LEN, f.g]),
  // the end card (end.js)
  [9.5 + FEATURES.length * FEATURE_LEN, DURATION - OPEN, "end"],
];
const WHIP = 0.24; // the fly-through between shots, ending on the beat

async function build() {
  await Promise.all([document.fonts.load('500 40px "JetBrains Mono"'), document.fonts.load('800 40px "Inter Tight"'), document.fonts.load('500 40px "Inter Tight"')]);
  const font = await new Promise((res, rej) => new FontLoader().load("fonts/inter-tight-900.typeface.json", res, undefined, rej));
  const loadTex = (src) => new Promise((res, rej) => new THREE.TextureLoader().load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, rej));
  const homeTex = await loadTex("assets/layers/home/full.webp");
  const tiles = (await (await fetch("assets/icon-tiles.json")).json()).tiles;

  const canvas = document.getElementById("stage");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.navy0);
  scene.fog = new THREE.Fog(C.navy0, 9, 22);
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 80);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // the background out of focus (the references' shallow depth of field); focus follows the shot
  const bokeh = new BokehPass(scene, camera, { focus: 6, aperture: 0.0007, maxblur: 0.006 });
  composer.addPass(bokeh);
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.5, 0.5, 0.86);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- the stage: a glossy navy floor, one spotlight that moves to the shot ----------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 120), new THREE.MeshStandardMaterial({ color: 0x0a1233, roughness: 0.34, metalness: 0.35 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -30;
  floor.receiveShadow = true;
  scene.add(floor);
  scene.add(new THREE.HemisphereLight(0x8fb4ff, 0x05081a, 0.35));
  const spot = new THREE.SpotLight(0xf3f7ff, 140, 16, 0.5, 0.75, 1.6);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -0.0004;
  spot.shadow.radius = 4;
  scene.add(spot, spot.target);
  const tint = new THREE.PointLight(C.cyan, 0, 7, 1.6); // the glowing words light their surroundings
  scene.add(tint);

  // ---------- thick words ----------
  const geoCache = new Map();
  function textGeo(str) {
    if (geoCache.has(str)) return geoCache.get(str);
    const g = new TextGeometry(str, { font, size: 1, depth: 0.32, curveSegments: 5, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.022, bevelSegments: 2 });
    g.computeBoundingBox();
    const b = g.boundingBox;
    g.translate(-(b.max.x + b.min.x) / 2, 0, -0.16);
    g.userData.w = b.max.x - b.min.x;
    geoCache.set(str, g);
    return g;
  }
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x1b2a6b, roughness: 0.45, metalness: 0.25 });
  const faceMats = {
    white: new THREE.MeshStandardMaterial({ color: 0xf4f7ff, roughness: 0.32, metalness: 0.05 }),
    red: new THREE.MeshStandardMaterial({ color: 0xff7a95, emissive: C.red, emissiveIntensity: 1.6, roughness: 0.4 }),
    cyan: new THREE.MeshStandardMaterial({ color: 0x9be6ff, emissive: C.cyan, emissiveIntensity: 1.35, roughness: 0.4 }),
  };
  const redSide = new THREE.MeshStandardMaterial({ color: 0x5a1230, emissive: 0x3a0716, roughness: 0.5 });
  const cyanSide = new THREE.MeshStandardMaterial({ color: 0x0d3a66, emissive: 0x06223f, roughness: 0.5 });
  // fit: the word is scaled to this width (world units), never above maxSize
  function word(str, { fit = 2.6, maxSize = 1.1, face = "white" } = {}) {
    const g = textGeo(str);
    const side = face === "red" ? redSide : face === "cyan" ? cyanSide : sideMat;
    const m = new THREE.Mesh(g, [faceMats[face], side]);
    m.castShadow = true;
    const s = Math.min(maxSize, fit / g.userData.w);
    m.scale.setScalar(s);
    m.userData.size = s;
    return m;
  }
  // flat labels and pills, drawn on a canvas
  function flat(draw, w, h, worldH) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry((worldH * w) / h, worldH), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, depthWrite: false }));
    return m;
  }
  const label = (txt, color = "#3fc6ee") => {
    const m = document.createElement("canvas").getContext("2d");
    m.font = '500 44px "JetBrains Mono"'; m.letterSpacing = "14px";
    return flat((g, w, h) => {
      g.font = '500 44px "JetBrains Mono"'; g.letterSpacing = "14px"; g.fillStyle = color; g.textBaseline = "middle"; g.textAlign = "center";
      g.fillText(txt, w / 2 + 7, h / 2);
    }, Math.ceil(m.measureText(txt).width + 40), 80, 0.22);
  };
  const pill = (txt) => flat((g, w, h) => {
    g.fillStyle = "#f0436a"; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, (h - 16) / 2); g.fill();
    g.font = '800 58px "Inter Tight"'; g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, w / 2, h / 2 + 3);
  }, 620, 112, 0.36);
  // a faint wall of the same words far behind each shot, like v11's background
  const wall = (txt) => flat((g, w, h) => {
    g.font = '800 150px "Inter Tight"'; g.fillStyle = "rgba(160,190,255,0.09)"; g.textBaseline = "middle";
    for (let r = 0; r < 4; r++) g.fillText((txt + " · ").repeat(4), -r * 260, 95 + r * 170);
  }, 2048, 720, 7.5);

  // ---------- the shots, each a group on the floor ----------
  // a shot's wall shows only while that shot is on screen, so it never stands in front of the next one
  const walls = [];
  const wallIn = (g, txt) => { const m = wall(txt); m.position.set(0, 2.6, -3.5); groups[g].add(m); walls.push([m, g]); };
  const groups = {};
  const Z = { says: 0, doctor: -9, timer: -18, wrong: -27, right: -36, logo: -46 };
  const X = { says: 0, doctor: 0.3, timer: -0.2, wrong: 0.2, right: -0.2, logo: 0 };
  for (const k in Z) { const g = new THREE.Group(); g.position.set(X[k], 0, Z[k]); scene.add(g); groups[k] = g; }
  const parts = {}; // name -> { obj, t0, kind }
  function place(name, group, obj, x, y, z, t0, kind = "rise") {
    obj.position.set(x, y, z);
    obj.userData.home = obj.position.clone();
    groups[group].add(obj);
    parts[name] = { obj, t0, kind };
    return obj;
  }

  // 0-1 s
  place("says", "says", word("The Doctor Says:", { fit: 2.5, maxSize: 0.5 }), 0, 1.15, 0, 0.05);
  // 1-2.4 s
  place("docLabel", "doctor", label("THE DOCTOR"), 0, 2.95, 0, 1.0, "fade");
  place("heart", "doctor", word("Heart", { fit: 2.2, maxSize: 0.95 }), 0, 1.75, 0, 1.0);
  place("failure", "doctor", word("Failure", { fit: 2.2, maxSize: 0.95 }), 0, 0.6, 0, 1.415);
  wallIn("doctor", "HEART FAILURE");
  // 2.4-3.4 s: the timer
  place("timerLabel", "timer", label("TO FIND THE WORD"), 0, 2.55, 0, 2.4, "fade");
  const timerBar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: C.cyan, toneMapped: false }));
  place("timerBar", "timer", timerBar, 0, 0.55, 0.1, 2.4, "fade");
  const timerSlot = new THREE.Group();
  place("timer", "timer", timerSlot, 0, 0.95, 0, 2.4, "none");
  // 3.4-6 s: the wrong word, struck
  place("wrongLabel", "wrong", label("THE INTERPRETER", "#ff8aa3"), 0, 2.95, 0, 3.335, "fade");
  place("fallo", "wrong", word("¿Fallo", { fit: 2.4, maxSize: 0.85, face: "red" }), 0, 1.85, 0, 3.335);
  place("cardiaco", "wrong", word("Cardíaco?", { fit: 2.5, maxSize: 0.85, face: "red" }), 0, 0.8, 0, 3.835);
  const strikeMat = new THREE.MeshStandardMaterial({ color: 0xff8aa3, emissive: C.red, emissiveIntensity: 2.2 });
  for (const [n, y, w] of [["strike1", 2.12, 2.5], ["strike2", 1.07, 2.7]]) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(w, 0.075, 0.09), strikeMat);
    s.rotation.z = -0.05;
    place(n, "wrong", s, 0, y, 0.25, 4.855, "wipe");
  }
  place("pill", "wrong", pill("Not For Patients."), 0.35, 0.22, 0.6, 5.0, "pop");
  wallIn("wrong", "¿FALLO CARDÍACO?");
  // 6-7.5 s: the right word
  place("rightLabel", "right", label("THE RIGHT WORD"), 0, 2.95, 0, 5.985, "fade");
  place("insuf", "right", word("Insuficiencia", { fit: 2.6, maxSize: 0.8, face: "cyan" }), 0, 1.85, 0, 5.985);
  place("cardiaca", "right", word("Cardíaca", { fit: 2.3, maxSize: 0.8, face: "cyan" }), 0, 0.85, 0, 6.505);
  const under = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: C.cyan, toneMapped: false }));
  place("under", "right", under, 0, 0.55, 0.15, 7.0, "wipe");
  wallIn("right", "INSUFICIENCIA CARDÍACA");

  // ---------- the logo: a phone, its icon's tiles rising into rings ----------
  const logo = groups.logo;
  const phone = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.14, 4.2, 6, 0.18), new THREE.MeshStandardMaterial({ color: 0x10152c, roughness: 0.28, metalness: 0.7 }));
  body.castShadow = true;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 4.02), new THREE.MeshBasicMaterial({ map: homeTex, toneMapped: false, color: 0x6b7aa8 }));
  scr.rotation.x = -Math.PI / 2;
  scr.position.y = 0.072;
  // the light the rings throw on the glass
  const gc = document.createElement("canvas"); gc.width = gc.height = 256;
  const gg = gc.getContext("2d"), rg = gg.createRadialGradient(128, 128, 6, 128, 128, 126);
  rg.addColorStop(0, "rgba(120,220,255,1)"); rg.addColorStop(0.35, "rgba(63,198,238,0.55)"); rg.addColorStop(1, "rgba(63,198,238,0)");
  gg.fillStyle = rg; gg.fillRect(0, 0, 256, 256);
  const glassGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  glassGlow.rotation.x = -Math.PI / 2;
  glassGlow.position.set(0, 0.075, -0.4);
  phone.add(body, scr, glassGlow);
  phone.position.set(0, 0.07, 0.4);
  logo.add(phone);
  const iconLight = new THREE.PointLight(C.cyan, 0, 5, 1.4);
  logo.add(iconLight);
  // the icon: its disc and its 16 tiles, each a small thick tile
  const ICON = 1.25; // world size of the icon
  const iconGroup = new THREE.Group();
  logo.add(iconGroup);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(ICON * 0.5, ICON * 0.5, 0.05, 72),
    [new THREE.MeshStandardMaterial({ color: 0x6f86a8, roughness: 0.4, metalness: 0.3 }), new THREE.MeshStandardMaterial({ color: 0xa9c4dc, roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: 0xa9c4dc, roughness: 0.6 })]);
  disc.rotation.x = Math.PI / 2;
  iconGroup.add(disc);
  const discRim = new THREE.Mesh(new THREE.TorusGeometry(ICON * 0.5, 0.018, 8, 96), new THREE.MeshStandardMaterial({ color: 0x1a3a96, metalness: 0.6, roughness: 0.3 }));
  iconGroup.add(discRim);
  const tileMeshes = tiles.map((t, i) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(t.w * ICON, t.h * ICON, 0.06, 2, 0.008), new THREE.MeshStandardMaterial({ color: new THREE.Color(t.color), roughness: 0.35, metalness: 0.1, emissive: new THREE.Color(t.color), emissiveIntensity: 0.05 }));
    m.userData.t = t; m.userData.i = i;
    m.castShadow = true;
    iconGroup.add(m);
    return m;
  });
  // three rings that climb and spread around the rising icon
  const ringMat = () => new THREE.MeshBasicMaterial({ color: C.cyan, transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false });
  const rings = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.016, 10, 120), ringMat()); r.rotation.x = Math.PI / 2; logo.add(r); return r; });
  const title = word("Interpreter Hub", { fit: 2.5, maxSize: 0.42 });
  title.position.set(0, 3.0, 0.3);
  logo.add(title);
  const sub = label("FOR THE HUMC INTERPRETER TEAM", "#bfe9fa");
  sub.position.set(0, 2.72, 0.3);
  sub.scale.setScalar(0.8);
  logo.add(sub);

  // ---------- features 1-5 ----------
  const feat = await buildFeatures(scene, groups, { word, label });
  const END_AT = 9.5 + FEATURES.length * FEATURE_LEN;
  groups.end = new THREE.Group();
  groups.end.position.set(0, 0, -58 - FEATURES.length * 12 - 2);
  scene.add(groups.end);
  const endCard = await buildEnd(scene, groups.end, { start: END_AT });

  // ---------- captions: v11's two lines (white, then navy on a cyan box wiping in) and its progress dashes ----------
  const capFont = Math.round(H * 0.044); // 84 px at 1920: each line box is over 64 px tall
  const caps = document.createElement("div");
  caps.style.cssText = `position:absolute;left:${W * 0.075}px;top:${H * 0.085}px;right:${W * 0.075}px;font-family:"Inter Tight",sans-serif;font-weight:800;pointer-events:none`;
  caps.innerHTML = `<div class="dash" style="display:flex;gap:${W * 0.012}px;margin-bottom:${H * 0.022}px">${('<i style="flex:1;height:' + Math.max(2, H * 0.0035) + 'px;border-radius:9px;background:rgba(255,255,255,.22);overflow:hidden"><b style="display:block;height:100%;width:0;background:#fff"></b></i>').repeat(FEATURES.length)}</div>
    <div class="l1" style="color:#fff;font-size:${capFont}px;line-height:1.12;letter-spacing:-0.02em;text-shadow:0 2px 18px rgba(3,6,26,.6)"></div>
    <div class="l2" style="display:inline-block;margin-top:${H * 0.006}px;color:#0b1a4a;background:#3fc6ee;font-size:${capFont}px;line-height:1.12;letter-spacing:-0.02em;padding:0 ${capFont * 0.18}px;border-radius:${capFont * 0.1}px;box-shadow:0 0 ${capFont * 0.5}px rgba(63,198,238,.35)"></div>`;
  root.appendChild(caps);
  const l1 = caps.querySelector(".l1"), l2 = caps.querySelector(".l2"), dashes = [...caps.querySelectorAll(".dash b")];
  function captionsAt(t) {
    const fi = FEATURES.findIndex((f, i) => t >= 9.5 + i * FEATURE_LEN && t < 9.5 + (i + 1) * FEATURE_LEN);
    caps.style.opacity = fi < 0 ? "0" : "1";
    if (fi < 0) return;
    const f = FEATURES[fi], t0 = 9.5 + fi * FEATURE_LEN;
    if (l1.textContent !== f.a) { l1.textContent = f.a; l2.textContent = f.b; }
    const a = outExpo(prog(t, t0 + 0.04, t0 + 0.34));
    l1.style.opacity = String(a);
    l1.style.transform = `translateY(${(1 - a) * capFont * 0.5}px)`;
    const w = outExpo(prog(t, t0 + 0.3, t0 + 0.62));
    l2.style.clipPath = `inset(0 ${(1 - w) * 100}% 0 0 round ${capFont * 0.1}px)`;
    dashes.forEach((d, i) => { d.style.width = i < fi ? "100%" : i === fi ? `${100 * prog(t, t0, t0 + FEATURE_LEN)}%` : "0"; });
  }

  // ---------- the HUMC opener: the hospital's photos as glass panels the camera flies past ----------
  const opener = new THREE.Group();
  opener.position.set(0, 0, 40);
  scene.add(opener);
  groups.opener = opener; // hidden by cameraAt once the hook starts
  const PHOTOS = [["entrance", -1.45, 6.0, 0.42], ["tower", 1.5, 3.6, -0.42], ["pavilion-dusk", -1.4, 1.2, 0.38], ["aerial", 0, -1.6, 0]];
  const panels = [];
  for (const [name, x, z, ry] of PHOTOS) {
    const tex = await new Promise((res) => new THREE.TextureLoader().load(`assets/humc/${name}.jpg`, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }));
    const hgt = name === "aerial" ? 2.3 : 1.75, wdt = (hgt * tex.image.width) / tex.image.height;
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(wdt + 0.06, hgt + 0.06), new THREE.MeshBasicMaterial({ color: 0xbfe9fa, transparent: true, opacity: 0.55, toneMapped: false }));
    frame.position.z = -0.005;
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(wdt, hgt), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0xe6e6e6 }));
    g.add(frame, photo);
    g.position.set(x, 1.55, z);
    g.rotation.y = ry;
    g.userData.home = g.position.clone();
    opener.add(g);
    panels.push(g);
  }
  const openerTitle = document.createElement("div");
  openerTitle.style.cssText = `position:absolute;left:0;right:0;bottom:${H * 0.1}px;text-align:center;color:#fff;font-family:"Inter Tight",sans-serif;opacity:0;pointer-events:none;text-shadow:0 2px 22px rgba(3,6,26,.85)`;
  openerTitle.innerHTML = `<div style="font-weight:800;font-size:${Math.round(H * 0.026)}px;letter-spacing:-0.01em;white-space:nowrap">Hackensack University Medical Center</div><div style="margin-top:${H * 0.008}px;font:500 ${Math.round(H * 0.017)}px 'JetBrains Mono',monospace;letter-spacing:.3em;color:#bfe9fa">HACKENSACK, NJ</div>`;
  root.appendChild(openerTitle);
  function openerAt(t) {
    for (const g in groups) groups[g].visible = g === "opener";
    // each panel swings in as the camera nears it
    panels.forEach((g, i) => {
      const p = outExpo(prog(t, i * 0.32, i * 0.32 + 0.5));
      g.position.y = g.userData.home.y - (1 - p) * 0.8;
      g.scale.setScalar(Math.max(0.001, 0.75 + 0.25 * p));
      g.children.forEach((m) => { m.material.transparent = true; m.material.opacity = (m === g.children[0] ? 0.55 : 1) * p; });
    });
    const e = inOutSine(prog(t, 0, OPEN));
    const z = lerp(9.2, 2.7, 1 - Math.pow(1 - e, 1.6));
    camera.position.set(Math.sin(t * 1.4) * 0.25, 1.6 + 0.15 * Math.sin(t * 2), opener.position.z + z);
    camera.lookAt(0, 1.55, opener.position.z + z - 4);
    camera.rotation.z += Math.sin(t * 1.3) * 0.012;
    bokeh.uniforms.focus.value = 3.2;
    bokeh.uniforms.aperture.value = 0.0005;
    tint.visible = false;
    openerTitle.style.opacity = String(outCubic(prog(t, 0.6, 1.0)) * (1 - prog(t, OPEN - 0.15, OPEN)));
    openerTitle.style.transform = `translateY(${(1 - outExpo(prog(t, 0.6, 1.1))) * H * 0.02}px)`;
  }

  // ---------- timing ----------
  function partsAt(t) {
    for (const k in parts) {
      const { obj, t0, kind } = parts[k];
      const h = obj.userData.home;
      const p = prog(t, t0, t0 + 0.42);
      if (kind === "rise") {
        const e = outBack(p, 1.6);
        obj.visible = p > 0;
        obj.position.set(h.x, h.y - (1 - e) * 1.4, h.z + (1 - outExpo(p)) * 0.8);
        obj.rotation.x = (1 - outExpo(p)) * -0.9;
        obj.scale.setScalar(obj.userData.size * (0.6 + 0.4 * outExpo(p)));
      } else if (kind === "fade") {
        obj.visible = p > 0;
        obj.material.opacity = outCubic(p);
        if (k === "timerBar") obj.scale.x = Math.max(0.001, 1 - prog(t, 2.45, 3.3));
      } else if (kind === "wipe") {
        const e = outExpo(prog(t, t0, t0 + 0.22));
        obj.visible = e > 0.001;
        obj.scale.x = Math.max(0.001, e);
        obj.position.x = h.x - (1 - e) * 1.25;
      } else if (kind === "pop") {
        const e = outBack(prog(t, t0, t0 + 0.32), 2.4);
        obj.visible = e > 0.001;
        obj.scale.setScalar(Math.max(0.001, e));
        obj.rotation.z = (1 - e) * 0.3 - 0.04;
      }
    }
    // the timer: 0.33s counting down to 0.00s, white turning red at zero
    const left = Math.max(0, 0.33 * (1 - prog(t, 2.45, 3.3)));
    const txt = left.toFixed(2) + "s";
    if (timerSlot.userData.txt !== txt) {
      timerSlot.clear();
      const m = word(txt, { fit: 2.3, maxSize: 1.0, face: left === 0 ? "red" : "white" });
      timerSlot.add(m);
      timerSlot.userData.txt = txt;
    }
    const tp = outBack(prog(t, 2.4, 2.75), 1.6);
    timerSlot.visible = t >= 2.4;
    timerSlot.position.y = timerSlot.userData.home.y - (1 - tp) * 1.2;
    timerSlot.scale.setScalar(1 + 0.12 * Math.sin(Math.PI * prog(t, 3.3, 3.45)));
  }

  function logoAt(t) {
    const u = t - 7.5;
    // the phone slides in tilted and settles flat
    const sp = outExpo(prog(u, 0, 0.5));
    phone.rotation.set((1 - sp) * 0.5, (1 - sp) * -0.6, 0);
    phone.position.y = 0.07 + (1 - sp) * 0.6;
    // icon: tiles leave the glass and assemble 1.6 above it, facing the camera
    const rise = outBack(prog(u, 0.45, 1.05), 1.3);
    iconGroup.position.set(0, lerp(0.12, 1.75, rise), lerp(0.1, 0.25, rise));
    iconGroup.rotation.set(lerp(-Math.PI / 2, -0.12, outExpo(prog(u, 0.45, 1.0))), 0, 0);
    const disc_p = outExpo(prog(u, 0.85, 1.2));
    disc.scale.set(Math.max(0.001, disc_p), 1, Math.max(0.001, disc_p));
    discRim.scale.setScalar(Math.max(0.001, disc_p));
    tileMeshes.forEach((m, i) => {
      const t0 = 0.45 + (i % 8) * 0.035;
      const a = outExpo(prog(u, t0, t0 + 0.55));
      const tt = m.userData.t;
      const ang = (i / tiles.length) * Math.PI * 2 + u * 0.8;
      const sx = Math.cos(ang) * 1.6 * (1 - a), sy = Math.sin(ang) * 1.6 * (1 - a);
      m.position.set(tt.x * ICON + sx, tt.y * ICON + sy, 0.04 + (1 - a) * 0.5);
      m.rotation.set((1 - a) * 2.2, (1 - a) * -1.4, THREE.MathUtils.degToRad(tt.rot) + (1 - a) * 3);
      m.visible = u > 0.4;
    });
    // rings: climb from the glass in turn, spread, fade
    rings.forEach((r, i) => {
      const p = prog(u, 0.5 + i * 0.16, 1.5 + i * 0.16);
      r.visible = p > 0 && p < 1;
      r.position.set(0, lerp(0.1, 1.75, outCubic(p)), lerp(0.1, 0.25, p));
      r.scale.setScalar(lerp(0.5, 1.25 + i * 0.12, outCubic(p)));
      r.material.opacity = Math.sin(Math.PI * p) * 0.95;
      r.rotation.x = lerp(Math.PI / 2, Math.PI / 2 - 0.35, p);
    });
    const glow = Math.max(prog(u, 0.45, 0.8) * (1 - 0.5 * prog(u, 1.2, 1.8)), 0);
    glassGlow.material.opacity = glow;
    iconLight.position.set(0, 0.6, -0.2);
    iconLight.intensity = 4 * glow;
    // the name, on the beat after the icon lands
    const tp = outBack(prog(u, 1.0, 1.4), 1.4);
    title.visible = sub.visible = u > 1.0;
    title.position.y = 3.0 - (1 - tp) * 0.6;
    title.scale.setScalar(title.userData.size * Math.max(0.001, tp));
    sub.material.opacity = outCubic(prog(u, 1.25, 1.6));
  }

  // ---------- camera: a slow push in each shot, a fly-through on each cut ----------
  const view = (g, t) => {
    const s = SHOTS.find((x) => x[2] === g), p = prog(t, s[0], s[1]);
    if (feat.view && FEATURES.some((f) => f.g === g)) return feat.view(g, t - s[0]);
    if (g === "end") return endCard.view(t - s[0]);
    const gp = groups[g].position;
    if (g === "logo") {
      const e = inOutSine(p);
      return { pos: new THREE.Vector3(gp.x + lerp(0.9, 0.2, e), lerp(2.9, 2.6, e), gp.z + lerp(7.0, 6.2, e)), look: new THREE.Vector3(gp.x, lerp(1.45, 1.65, e), gp.z + 0.3) };
    }
    const e = inOutSine(p), side = g === "wrong" ? -1 : 1;
    return {
      pos: new THREE.Vector3(gp.x + side * lerp(0.55, -0.25, e), lerp(1.55, 1.75, e), gp.z + lerp(6.4, 5.1, e)),
      look: new THREE.Vector3(gp.x + side * lerp(0.1, -0.05, e), lerp(1.45, 1.6, e), gp.z),
    };
  };
  const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  function cameraAt(t) {
    const i = Math.max(0, SHOTS.findIndex((s) => t < s[1]));
    const s = SHOTS[i === -1 ? SHOTS.length - 1 : i];
    const a = view(s[2], t);
    cam.pos.copy(a.pos); cam.look.copy(a.look);
    const next = SHOTS[i + 1];
    if (next && t > s[1] - WHIP) {
      // fly from the end of this shot to the start of the next, through the words
      const w = inOutExpo(prog(t, s[1] - WHIP, s[1]));
      const b = view(next[2], next[0]);
      cam.pos.lerpVectors(view(s[2], s[1]).pos, b.pos, w);
      cam.look.lerpVectors(view(s[2], s[1]).look, b.look, w);
      cam.pos.y += Math.sin(Math.PI * w) * 0.25;
    }
    // the word shots sit a little farther back too, so nothing is cut off
    if (["says", "doctor", "timer", "wrong", "right"].includes(s[2])) cam.pos.sub(cam.look).multiplyScalar(1.12).add(cam.look);
    camera.position.copy(cam.pos);
    camera.lookAt(cam.look);
    const fp = a.focus || a.look;
    bokeh.uniforms.focus.value = camera.position.distanceTo(fp);
    // the end card keeps the hospital behind the table readable: less blur there
    bokeh.uniforms.aperture.value = s[2] === "end" ? 0.00025 : 0.0007;
    camera.rotation.z += Math.sin(t * 1.3) * 0.012; // a hand-held breath
    // the spotlight moves with the shot
    const g = groups[s[2]].position;
    spot.position.set(g.x - 1.2, 7.5, g.z + 2.5);
    spot.target.position.set(g.x, 0.8, g.z);
    spot.target.updateMatrixWorld();
    for (const g in groups) groups[g].visible = g === s[2] || (next && t > s[1] - WHIP && g === next[2]);
    for (const [m, g] of walls) m.visible = g === s[2] || (next && t > s[1] - WHIP && g === next[2]);
    const glowing = s[2] === "wrong" ? C.red : s[2] === "right" ? C.cyan : null;
    tint.visible = !!glowing;
    if (glowing) { tint.color.setHex(glowing); tint.intensity = 6; tint.position.set(g.x, 1.4, g.z + 1.2); }
    spot.intensity = s[2] === "logo" ? 70 : 140;
    if (FEATURES.some((f) => f.g === s[2])) { spot.position.set(g.x - 1.8, 6.5, g.z + 3.5); spot.target.position.set(g.x, 0, g.z + 0.8); spot.intensity = 110; }
    if (s[2] === "end" || (next && next[2] === "end" && t > s[1] - WHIP)) { spot.intensity = 18; spot.position.set(g.x + 2, 6, g.z + 3); spot.target.position.set(g.x, 0, g.z); }
    return { s, next, i };
  }

  function renderAt(time) {
    const T0 = clamp(time, 0, DURATION - 1e-4);
    if (T0 < OPEN) { openerAt(T0); captionsAt(-1); composer.render(); return; }
    openerTitle.style.opacity = "0";
    const t = T0 - OPEN;
    partsAt(t);
    logoAt(t);
    const { s, next } = cameraAt(t);
    // the incoming shot sits at its start during the fly-through; the current one wins Dr. Smiley
    if (next && t > s[1] - WHIP) feat.update(next[2], 0);
    feat.update(s[2], t - s[0]);
    if (s[2] === "end" || (next && next[2] === "end")) endCard.update(Math.max(0, t - END_AT));
    captionsAt(t);
    composer.render();
  }
  timerSlot.userData.home = timerSlot.position.clone();
  window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
  renderAt(window.__hfThreeTime || 0);
  window.__renderAt = renderAt;
}

window.__hfBuildResolve(build());
