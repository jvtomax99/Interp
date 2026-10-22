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
import { FullScreenQuad } from "../../vendor/addons/postprocessing/Pass.js";
import { buildFeatures, FEATURES, FEATURE_STARTS, FEATURES_END, featureLen } from "./features.js";
import { MOVES } from "../smiley.js";
import { createOverlay, SMILEY_SHARE } from "./overlay.js";
import { buildEnd } from "./end.js";
import { buildDesk } from "./desk.js";
import { createCity } from "./city.js";
import { createHero } from "./hero.js";
import { clamp, lerp, prog, outBack, outExpo, outCubic, inOutExpo, inOutSine, inOutCubic } from "../util.js";

const root = document.getElementById("root");
const W = +root.dataset.width, H = +root.dataset.height;
const DURATION = +root.dataset.duration;
/* The reel starts on the hook (Jose, 2026-10-20: the carousel opener is gone), or, while he
   chooses, on a short first frame that sets the place (?first=sign or ?first=arrive, previews
   only). Everything after it keeps its own clock (t = time - OPEN). */
const FIRST = new URLSearchParams(location.search).get("first") || "none"; // the walk-in was cut (Jose, 2026-10-22): the reel opens on the hook, like v11
const TITLE = new URLSearchParams(location.search).get("title") || "glass-brick"; // Jose's pick // the name's lettering, while he picks
const OPEN = FIRST === "none" ? 0 : 2.5;

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
  ...FEATURES.map((f, i) => [FEATURE_STARTS[i], FEATURE_STARTS[i] + featureLen(f), f.g]),
  // the end card (end.js)
  [FEATURES_END, DURATION - OPEN, "end"],
];
/* v11's audio has a narrator reading the script, so it plays untouched (Jose, 2026-10-21) and the
   picture follows v11's clock: from the moment the words appear, the time maps onto the hook as
   designed through v11's own cut times ("Heart failure" 1.0, the timer 1.9 to zero at 3.2, the
   wrong word 3.3, the strike 4.85, the right word 6.0, the logo 8.0, the first feature 10.0);
   after that the features run 3 s each, as in v11, half a second behind the design clock. */
const HOOK_MAP = [[0, 0], [1.0, 1.0], [1.9, 2.4], [3.2, 3.3], [4.85, 4.855], [6.0, 5.98], [8.0, 7.5], [10.0, 9.5]];
function hookTime(a) {
  if (a <= 0) return a;
  if (a >= 10.0) return a - 0.5;
  let i = 1; while (a > HOOK_MAP[i][0]) i++;
  const [a0, d0] = HOOK_MAP[i - 1], [a1, d1] = HOOK_MAP[i];
  return d0 + (d1 - d0) * (a - a0) / (a1 - a0);
}
const WHIP = 0.24; // the fly-through between shots, ending on the beat
const HOP = 0.4; // between two features: Dr. Smiley hops from one phone to the next (Jose: at most 0.4 s)
const isFeature = (g) => FEATURES.some((f) => f.g === g);

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
  // the features, staged at one desk like the first reel (Jose, 2026-10-21; desk.js)
  const feat = await buildDesk(scene, groups);
  const END_AT = FEATURES_END;
  groups.end = new THREE.Group();
  groups.end.position.set(0, 0, -58 - FEATURES.length * 12 - 2);
  scene.add(groups.end);
  const endCard = await buildEnd(scene, groups.end, { start: END_AT });

  // ---------- captions: v11's two lines (white, then navy on a cyan box wiping in) and its progress dashes ----------
  const capFont = Math.round(H * 0.044); // 84 px at 1920: each line box is over 64 px tall
  const caps = document.createElement("div");
  // a soft navy fade behind the caption area, so white text stays readable whatever sits behind it
  const scrim = document.createElement("div");
  scrim.style.cssText = `position:absolute;left:0;right:0;top:0;height:${H * 0.3}px;pointer-events:none;opacity:0;background:linear-gradient(180deg, rgba(3,6,26,0.86) 0%, rgba(3,6,26,0.72) 55%, rgba(3,6,26,0) 100%)`;
  root.appendChild(scrim);
  caps.id = "caps";
  caps.style.cssText = `position:absolute;left:${W * 0.075}px;top:${H * 0.085}px;right:${W * 0.075}px;font-family:"Inter Tight",sans-serif;font-weight:800;pointer-events:none`;
  caps.innerHTML = `<div class="dash" style="display:flex;gap:${W * 0.012}px;margin-bottom:${H * 0.022}px">${('<i style="flex:1;height:' + Math.max(2, H * 0.0035) + 'px;border-radius:9px;background:rgba(255,255,255,.22);overflow:hidden"><b style="display:block;height:100%;width:0;background:#fff"></b></i>').repeat(FEATURES.length)}</div>
    <div class="l1" style="color:#fff;font-size:${capFont}px;line-height:1.12;letter-spacing:-0.02em;text-shadow:0 2px 18px rgba(3,6,26,.6)"></div>
    <div class="l2" style="display:inline-block;margin-top:${H * 0.006}px;color:#0b1a4a;background:#3fc6ee;font-size:${capFont}px;line-height:1.12;letter-spacing:-0.02em;padding:0 ${capFont * 0.18}px;border-radius:${capFont * 0.1}px;box-shadow:0 0 ${capFont * 0.5}px rgba(63,198,238,.35)"></div>`;
  root.appendChild(caps);
  const l1 = caps.querySelector(".l1"), l2 = caps.querySelector(".l2"), dashes = [...caps.querySelectorAll(".dash b")];
  function captionsAt(t) {
    const fi = FEATURES.findIndex((f, i) => t >= FEATURE_STARTS[i] && t < FEATURE_STARTS[i] + featureLen(f));
    caps.style.opacity = fi < 0 ? "0" : "1";
    scrim.style.opacity = caps.style.opacity;
    if (fi < 0) return;
    const f = FEATURES[fi], t0 = FEATURE_STARTS[fi];
    if (l1.textContent !== f.a) { l1.textContent = f.a; l2.textContent = f.b; }
    const a = outExpo(prog(t, t0 + 0.04, t0 + 0.34));
    l1.style.opacity = String(a);
    l1.style.transform = `translateY(${(1 - a) * capFont * 0.5}px)`;
    const w = outExpo(prog(t, t0 + 0.3, t0 + 0.62));
    l2.style.clipPath = `inset(0 ${(1 - w) * 100}% 0 0 round ${capFont * 0.1}px)`;
    dashes.forEach((d, i) => { d.style.width = i < fi ? "100%" : i === fi ? `${100 * prog(t, t0, t0 + featureLen(f))}%` : "0"; });
  }

  // ---------- HUMC behind everything: one hospital photo as a large backdrop behind each word
  // shot and each phone, dimmed, tinted navy, out of focus, drifting slowly (Jose, 2026-10-20).
  // The skybridge stays in the end card's window. ----------
  const PHOTO_OF = {
    says: "entrance", doctor: "entrance", timer: "tower", wrong: "pavilion-dusk", right: "aerial", logo: "pavilion-dusk-2",
  };
  const photoImg = {};
  await Promise.all([...new Set(Object.values(PHOTO_OF))].map((n) => new Promise((res) => { const im = new Image(); im.onload = () => { photoImg[n] = im; res(); }; im.src = `assets/humc/${n}.jpg`; })));
  const backdropTex = {};
  const BACK = { w: 30, h: 22 }; // world size, enough to fill the frame from every camera
  function backdropTexture(n) {
    if (backdropTex[n]) return backdropTex[n];
    const c = document.createElement("canvas"); c.width = 1040; c.height = 760;
    const g = c.getContext("2d"), im = photoImg[n];
    // cover-fit, softened, darkened, then pulled toward the reel's navy
    const k = Math.max(c.width / im.width, c.height / im.height), w = im.width * k, h = im.height * k;
    g.filter = "blur(6px) saturate(0.9) brightness(0.86)";
    g.drawImage(im, (c.width - w) / 2, (c.height - h) / 2, w, h);
    g.filter = "none";
    g.globalCompositeOperation = "multiply"; g.fillStyle = "#5b6fa8"; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = "source-over"; g.fillStyle = "rgba(3,6,26,0.24)"; g.fillRect(0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return (backdropTex[n] = t);
  }
  const backdrops = [];
  for (const [g, n] of Object.entries(PHOTO_OF)) {
    if (!groups[g]) continue;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(BACK.w, BACK.h), new THREE.MeshBasicMaterial({ map: backdropTexture(n), toneMapped: false, fog: false, depthWrite: false }));
    m.position.set(0, 6.5, -15);
    m.renderOrder = -1;
    m.userData.phase = backdrops.length * 1.7;
    m.userData.g = g;
    groups[g].add(m);
    backdrops.push(m);
    if (new URLSearchParams(location.search).has("nobackdrop")) m.visible = false; // for before/after measurements
  }
  /* each hangs 12 units beyond what its shot looks at, square to the camera at mid-shot (so it fills
     the frame behind a phone seen from above too), then drifts a little on its own; the camera's own
     movement gives the parallax */
  function aimBackdrops() {
    for (const m of backdrops) {
      const sh = SHOTS.find((x) => x[2] === m.userData.g), v = view(m.userData.g, (sh[0] + sh[1]) / 2);
      const dir = v.look.clone().sub(v.pos).normalize();
      const at = v.look.clone().add(dir.multiplyScalar(12)).sub(groups[m.userData.g].position);
      m.userData.home = at;
      m.position.copy(at);
      m.lookAt(v.pos); // lookAt takes world space: the groups are only translated, so this holds
    }
  }
  const driftBackdrops = (t) => backdrops.forEach((m) => {
    const h = m.userData.home; if (!h) return;
    m.position.set(h.x + Math.sin(t * 0.22 + m.userData.phase) * 0.9, h.y + Math.cos(t * 0.17 + m.userData.phase) * 0.35, h.z);
  });

  // ---------- the first frame: walking up to HUMC's entrance and in through the doors ----------
  // The entrance photo in two layers (the ground and pillars near us, the building beyond), pushed
  // at different speeds with a walking bob, so it feels like stepping toward the doors; at the doors
  // a wash of light, and the hook begins over the same photo, softened, as its backdrop.
  const first = document.createElement("div");
  first.style.cssText = "position:absolute;inset:0;overflow:hidden;opacity:0;pointer-events:none;background:#03061a";
  const mkLayer = (mask) => {
    const d = document.createElement("div");
    d.style.cssText = `position:absolute;inset:0;background:url(assets/humc/entrance.jpg) 56% 50% / cover no-repeat;transform-origin:50% 54%;${mask}`;
    return d;
  };
  const far = mkLayer(""), near = mkLayer("-webkit-mask-image:linear-gradient(180deg, transparent 58%, #000 70%);mask-image:linear-gradient(180deg, transparent 58%, #000 70%);");
  const wash = document.createElement("div");
  wash.style.cssText = "position:absolute;inset:0;opacity:0;background:radial-gradient(60% 45% at 50% 54%, rgba(235,248,255,1), rgba(120,210,245,0.85) 45%, rgba(3,6,26,0.95) 100%)";
  const firstTitle = document.createElement("div");
  firstTitle.style.cssText = "position:absolute;left:0;right:0;text-align:center;pointer-events:none";
  // three letterings for the name, while Jose picks (?title=signage | stacked | rising)
  const F = Math.round(H * 0.031);
  // Jose: "stylish, not white". Three coloured letterings (champagne | glass | neon); the
  // gradients sweep (a shine) while the name is up.
  if (TITLE === "champagne") {
    // champagne gold: an italic serif "Hackensack", the rest in spaced small caps between fine gold rules
    firstTitle.style.top = H * 0.6 + "px";
    const gold = "background:linear-gradient(100deg,#8a6a2f 0%,#e9cf8f 28%,#fff3cf 42%,#c9a45a 58%,#f4dea4 76%,#9b7637 100%);background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent";
    firstTitle.innerHTML = `<div class="w shine" style="font:700 italic ${Math.round(H * 0.075)}px/1.05 'Playfair Display';letter-spacing:-.01em;${gold};filter:drop-shadow(0 3px 10px rgba(3,6,26,.75))">Hackensack</div>
      <div class="w" style="display:flex;align-items:center;justify-content:center;gap:${W * 0.03}px;margin-top:${H * 0.012}px">
        <i style="width:${W * 0.09}px;height:1.5px;background:linear-gradient(90deg,transparent,#e9cf8f)"></i>
        <span class="shine" style="font:700 ${Math.round(H * 0.0175)}px 'Playfair Display';letter-spacing:.3em;${gold};filter:drop-shadow(0 2px 6px rgba(3,6,26,.8))">UNIVERSITY MEDICAL CENTER</span>
        <i style="width:${W * 0.09}px;height:1.5px;background:linear-gradient(90deg,#e9cf8f,transparent)"></i></div>`;
  } else if (TITLE.startsWith("glass")) {
    // the app's liquid glass, in colours taken from the entrance photo (Jose: "coordinate with the
    // hospital"): its brick #755449, terracotta #9f7d69, limestone #cebba1-#e3dfd3, sky #5f94c4,
    // and HMH navy #252e6d. ?title=glass-limestone | glass-brick | glass-navy
    const P = {
      "glass-limestone": { card: "rgba(236,226,210,.68)", edge: "rgba(255,248,236,.75)", text: "#5a2f22,#8e4f3b,#b8735a,#8e4f3b,#5a2f22", line: "#252e6d" },
      "glass-brick": { card: "rgba(117,64,48,.58)", edge: "rgba(214,170,140,.55)", text: "#f6ead8,#e6cfae,#fff6e8,#e6cfae,#f6ead8", line: "#86b5dc" },
      "glass-navy": { card: "rgba(37,46,109,.58)", edge: "rgba(160,190,230,.5)", text: "#e3dfd3,#cebba1,#f4eee2,#cebba1,#e3dfd3", line: "#b8735a" },
    }[TITLE] || { card: "rgba(236,226,210,.68)", edge: "rgba(255,248,236,.75)", text: "#5a2f22,#8e4f3b,#b8735a,#8e4f3b,#5a2f22", line: "#252e6d" };
    firstTitle.style.top = H * 0.6 + "px";
    const fill = `background:linear-gradient(100deg,${P.text});background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent`;
    firstTitle.innerHTML = `<div class="w" style="display:inline-block;padding:${H * 0.018}px ${W * 0.07}px ${H * 0.02}px;border-radius:${H * 0.022}px;background:${P.card};backdrop-filter:blur(18px) saturate(150%);-webkit-backdrop-filter:blur(18px) saturate(150%);box-shadow:inset 0 1px 0 ${P.edge},0 18px 40px -12px rgba(30,16,10,.55);border:1px solid ${P.edge}">
        <div class="shine" style="font:800 ${Math.round(H * 0.044)}px/1.05 'Inter Tight';letter-spacing:-.02em;${fill}">Hackensack</div>
        <div class="shine" style="margin-top:${H * 0.004}px;font:800 ${Math.round(H * 0.026)}px/1.15 'Inter Tight';letter-spacing:-.01em;${fill}">University Medical Center</div>
        <div style="margin:${H * 0.01}px auto 0;width:${W * 0.16}px;height:3px;border-radius:2px;background:${P.line}"></div></div>`;
  } else if (TITLE === "neon") {
    // a cyan neon script, the rest in spaced caps lit the same colour
    firstTitle.style.top = H * 0.58 + "px";
    firstTitle.innerHTML = `<div class="w" style="font:400 ${Math.round(H * 0.095)}px/1 'Great Vibes';color:#9ff0ff;text-shadow:0 0 6px #3fc6ee,0 0 18px #3fc6ee,0 0 40px rgba(63,198,238,.8),0 0 70px rgba(63,198,238,.5)">Hackensack</div>
      <div class="w" style="margin-top:${H * 0.008}px;font:500 ${Math.round(H * 0.018)}px 'JetBrains Mono';letter-spacing:.34em;color:#7fe3fb;text-shadow:0 0 8px rgba(63,198,238,.9),0 0 22px rgba(63,198,238,.6)">UNIVERSITY MEDICAL CENTER</div>`;
  } else if (TITLE === "stacked") {
    firstTitle.style.top = H * 0.62 + "px";
    firstTitle.innerHTML = `<div class="w" style="font:800 ${Math.round(H * 0.06)}px 'Inter Tight';letter-spacing:.16em;color:#fff;text-shadow:0 3px 24px rgba(3,6,26,.85)">HACKENSACK</div>
      <div class="w" style="margin:${H * 0.01}px auto 0;width:${W * 0.18}px;height:3px;background:#3fc6ee;border-radius:2px;box-shadow:0 0 14px rgba(63,198,238,.7)"></div>
      <div class="w" style="margin-top:${H * 0.012}px;font:500 ${Math.round(H * 0.019)}px 'JetBrains Mono';letter-spacing:.32em;color:#d8f2fc;text-shadow:0 2px 14px rgba(3,6,26,.9)">UNIVERSITY MEDICAL CENTER</div>`;
  } else if (TITLE === "rising") {
    firstTitle.style.top = H * 0.56 + "px";
    firstTitle.innerHTML = ["Hackensack", "University", "Medical Center"].map((w) => `<div class="w" style="font:800 ${Math.round(H * 0.052)}px 'Inter Tight';letter-spacing:-.02em;line-height:1.08;color:#fff;text-shadow:0 4px 26px rgba(3,6,26,.9)">${w}</div>`).join("");
  } else {
    // signage: the name the way the hospital's own skybridge sign sets it, serif on a white band
    firstTitle.style.top = H * 0.66 + "px";
    firstTitle.innerHTML = `<div class="w" style="display:inline-block;padding:${H * 0.014}px ${W * 0.06}px;background:rgba(247,248,250,.96);box-shadow:0 8px 30px rgba(3,6,26,.45);font:400 ${F}px/1.35 'Libre Baskerville';color:#1b2340">Hackensack University<br>Medical Center</div>
      <div class="w" style="margin-top:${H * 0.014}px;font:500 ${Math.round(H * 0.016)}px 'JetBrains Mono';letter-spacing:.32em;color:#d8f2fc;text-shadow:0 2px 14px rgba(3,6,26,.9)">HACKENSACK, NJ</div>`;
  }
  // a soft dark band low in the frame, so the name reads over the busy photo
  const band = document.createElement("div");
  band.style.cssText = `position:absolute;left:0;right:0;bottom:0;height:${H * 0.5}px;background:linear-gradient(180deg, rgba(3,6,26,0) 0%, rgba(3,6,26,.55) 45%, rgba(3,6,26,.72) 100%)`;
  first.append(far, near, band, wash, firstTitle);
  root.appendChild(first);
  const titleParts = [...firstTitle.querySelectorAll(".w")];
  function firstAt(T0) {
    if (FIRST === "none" || T0 >= OPEN) { first.style.opacity = "0"; return; }
    first.style.opacity = "1";
    // the walk: 0 to 2 s; the near ground passes faster than the building; a step every 0.5 s (the beat)
    const walk = inOutSine(clamp(T0 / 2.0)), bob = Math.sin(T0 * Math.PI * 4) * H * 0.004, sway = Math.sin(T0 * Math.PI * 2) * W * 0.003;
    far.style.transform = `translate(${sway}px, ${bob}px) scale(${lerp(1.0, 1.55, walk)})`;
    near.style.transform = `translate(${sway * 1.6}px, ${bob * 1.6}px) scale(${lerp(1.0, 2.2, walk)})`;
    // the doors: light washes over, then hands over to the hook (its backdrop is this same photo)
    const w = prog(T0, 1.75, 2.15), out = prog(T0, 2.15, OPEN);
    wash.style.opacity = String(Math.sin(Math.PI * Math.min(1, w + out * 0.5)) * 0.9 * (1 - out) + w * (1 - out) * 0.2);
    first.style.opacity = String(1 - outCubic(out));
    // the name: in on the first beats, out before the doors
    for (const el of firstTitle.querySelectorAll(".shine")) el.style.backgroundPosition = `${lerp(100, 0, outCubic(prog(T0, 0.3, 1.7)))}% 0`;
    titleParts.forEach((el, i) => {
      const p = outExpo(prog(T0, 0.2 + i * 0.18, 0.6 + i * 0.18)), o = 1 - prog(T0, 1.6, 1.85);
      el.style.opacity = String(p * o);
      el.style.transform = TITLE === "rising" ? `perspective(600px) translateY(${(1 - p) * H * 0.04}px) rotateX(${(1 - p) * -60}deg)` : `translateY(${(1 - p) * H * 0.02}px)`;
    });
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
    const hopping = next && isFeature(s[2]) && isFeature(next[2]) && t > s[1] - HOP;
    if (hopping) {
      // follow Dr. Smiley across: from this shot's last view to the next one's first, rising over the gap,
      // the eye drawn along with him
      const w = inOutCubic(prog(t, s[1] - HOP, s[1]));
      const A = view(s[2], s[1] - HOP), B = view(next[2], next[0]);
      // no fly (it swept the proof cards through his path): this shot's camera keeps going, the
      // picture dips through navy under him, and at the darkest moment it cuts to the next shot
      const half = t >= s[1] - HOP / 2;
      const V = half ? view(next[2], next[0]) : view(s[2], t);
      cam.pos.copy(V.pos); cam.look.copy(V.look);
    } else if (next && t > s[1] - WHIP) {
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
    // the phone shots' lens shift (room for Dr. Smiley under the proof), blended across cuts
    const sh0 = SHIFT[s[2]] || 0;
    let shift = hopping ? (t >= s[1] - HOP / 2 ? SHIFT[next[2]] || 0 : sh0)
      : next && t > s[1] - WHIP ? lerp(sh0, SHIFT[next[2]] || 0, inOutCubic(prog(t, s[1] - WHIP, s[1]))) : sh0;
    // CoreCHI: the shift eases away as the camera squares up to the phone
    if (s[2] === "cert") shift *= 1 - inOutCubic(prog(t - s[0], 0.3, 0.98));
    if (shift > 0.5) camera.setViewOffset(W, H, 0, shift, W, H); else camera.clearViewOffset();
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
    if (hopping) { const half = t >= s[1] - HOP / 2; for (const g in groups) groups[g].visible = g === (half ? next[2] : s[2]); }
    else for (const g in groups) groups[g].visible = g === s[2] || (next && t > s[1] - WHIP && g === next[2]);
    groups.desk.visible = FEATURES.some((f) => groups[f.g].visible); // the features share one desk
    for (const [m, g] of walls) m.visible = g === s[2] || (next && t > s[1] - WHIP && g === next[2]);
    const glowing = s[2] === "wrong" ? C.red : s[2] === "right" ? C.cyan : null;
    tint.visible = !!glowing;
    if (glowing) { tint.color.setHex(glowing); tint.intensity = 6; tint.position.set(g.x, 1.4, g.z + 1.2); }
    spot.intensity = s[2] === "logo" ? 70 : 140;
    spot.color.setHex(0xf3f7ff);
    if (isFeature(s[2])) { spot.position.set(g.x - 1.8, 6.5, g.z + 3.5); spot.target.position.set(g.x, 0, g.z + 0.8); spot.intensity = 110; spot.color.setHex(0xffe6c8); } // warm, like the clip
    if (s[2] === "end" || (next && next[2] === "end" && t > s[1] - WHIP)) { spot.intensity = 18; spot.position.set(g.x + 2, 6, g.z + 3); spot.target.position.set(g.x, 0, g.z); }
    return { s, next, i, hopping };
  }

  aimBackdrops();
  // ---------- Dr. Smiley's spot in each shot: about 25% of the frame tall, fully in frame,
  // never over the proof item at any moment of the shot (measured here, checked per frame) ----------
  // the dip through navy during a hop: over the picture and the captions, under Dr. Smiley
  const dip = document.createElement("div");
  dip.style.cssText = "position:absolute;inset:0;background:#03061a;opacity:0;pointer-events:none";
  root.appendChild(dip);
  const overlay = await createOverlay(root, W, H);
  const city = await createCity(root, canvas, W, H); // CoreCHI's campus, flown into (city.js)
  const hero = createHero(city.canvas, W, H); // the proof, big enough to read (hero.js)
  let smileyState = null;
  const _v = new THREE.Vector3();
  function proofRect(g) {
    const m = feat.proofMesh(g);
    if (!m) return null;
    for (let o = m; o; o = o.parent) if (!o.visible) return null; // not on screen
    m.updateWorldMatrix(true, false);
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    const bb = m.geometry.boundingBox;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) {
      _v.set(x, y, 0).applyMatrix4(m.matrixWorld).project(camera);
      const px = (_v.x + 1) / 2 * W, py = (1 - _v.y) / 2 * H;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  const hit = (a, b, m = 0) => a && b && a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
  const SW_ = overlay.size.w, SH_ = overlay.size.h, MARGIN = W * 0.04;
  /* The proof cards are as wide as the frame, so he can't stand beside them: he stands in a band
     along the bottom, alternating corners (so each hop crosses the frame), and each phone shot's
     picture is shifted up (a lens shift: setViewOffset, the camera itself doesn't move) just enough
     that its proof item, at its largest in the shot, ends above his head and his hop. */
  const ARC = H * 0.05; // the highest he ever leaves the ground, so a hop stays under the proof
  const BASE = H * 0.965, LIMIT = BASE - SH_ * 1.06 - ARC - 8;
  const SPOT = {}, SHIFT = {};
  for (const [i, f] of FEATURES.entries()) {
    const t0 = FEATURE_STARTS[i], len = featureLen(f);
    let bottom = -Infinity, top = Infinity;
    camera.clearViewOffset();
    // CoreCHI: only before the camera dives into the phone (after that the city layer is on screen)
    for (let u = 0; u <= (f.g === "cert" ? 0.35 : len); u += 0.1) {
      feat.update(f.g, u);
      const v = view(f.g, t0 + u);
      camera.position.copy(v.pos); camera.lookAt(v.look); camera.updateMatrixWorld();
      scene.updateMatrixWorld();
      const r = proofRect(f.g); if (r) { bottom = Math.max(bottom, r.y + r.h); top = Math.min(top, r.y); }
    }
    SHIFT[f.g] = Math.max(0, bottom - LIMIT);
    SPOT[f.g] = { x: i % 2 ? W - MARGIN - SW_ / 2 : MARGIN + SW_ / 2, base: BASE };
    if (top - SHIFT[f.g] < H * 0.2) console.warn(`Dr. Smiley: in ${f.g} the proof reaches up under the caption (${Math.round(top - SHIFT[f.g])} px)`);
  }
  camera.clearViewOffset();
  window.__smileySpots = SPOT;

  // which shot is on at t, and whether we are in the hop between two features
  function shotAt(t) {
    const i = Math.max(0, SHOTS.findIndex((x) => t < x[1]));
    const s = SHOTS[i], next = SHOTS[i + 1];
    return { s, next, hopping: !!(next && isFeature(s[2]) && isFeature(next[2]) && t > s[1] - HOP) };
  }
  function drawScene(time) {
    const T0 = clamp(time, 0, DURATION - 1e-4);
    firstAt(T0);
    const t = hookTime(Math.max(0, T0 - OPEN)); // during the first frame the hook waits at its start, the photo behind it
    driftBackdrops(t);
    floor.visible = !isFeature(shotAt(t).s[2]); // phones float in front of their photo; the words keep their floor
    partsAt(t);
    logoAt(t);
    const { s, next, hopping } = shotAt(t);
    const sm = feat.smiley;
    if (next && t > s[1] - Math.max(WHIP, hopping ? HOP : 0)) feat.update(next[2], 0);
    sm.lastPose = null;
    feat.update(s[2], t - s[0]);
    if (isFeature(s[2]) && !sm.group.visible) feat.idle(s[2], t - s[0]);
    // after the cut at the middle of a hop, the desk shows the next feature
    if (hopping && t >= s[1] - HOP / 2) feat.update(next[2], 0);
    const pose = sm.lastPose;
    sm.group.visible = false; // never drawn in 3D: the overlay draws him
    smileyState = null;
    if (hopping) {
      // the hop: from his spot on this phone to his spot on the next, sharp at the top of the arc
      const a = prog(t, s[1] - HOP, s[1]), A = SPOT[s[2]], B = SPOT[next[2]];
      const arc = ARC, lift = Math.sin(Math.PI * a) * arc;
      const vy = Math.cos(Math.PI * a) * Math.PI * arc / HOP / 30; // px per frame, 0 at the top
      smileyState = { x: lerp(A.x, B.x, inOutSine(a)), base: lerp(A.base, B.base, inOutSine(a)), lift, smear: Math.abs(vy) > 3 ? vy : 0,
        squash: MOVES.hop(a).squash, lean: lerp(-6, 6, a), face: a < 0.5 ? "smile" : "laugh", brows: "glad" };
    } else if (isFeature(s[2]) && pose && !(next && !isFeature(next[2]) && t > s[1] - WHIP - 0.15)) { // gone before the fly to the end card
      const A = SPOT[s[2]], y = pose.y || 0;
      smileyState = { x: A.x, base: A.base, lift: Math.min(ARC, Math.max(0, y) * overlay.size.h * 0.35), rise: y < 0 ? clamp(1 + y / 1.1) : undefined,
        squash: pose.squash ?? 1, lean: -(pose.lean || 0), face: pose.face || "rest", brows: pose.brows || "rest",
        // his AI brain, on "Ask Dr. Smiley." (Jose, 2026-10-22)
        brain: s[2] === "ask" ? prog(t - s[0], 1.0, 1.3) * (1 - prog(t - s[0], 2.0, 2.3)) : 0, time: t };
    }
    cameraAt(t);
    if (s[2] === "end" || (next && next[2] === "end")) endCard.update(Math.max(0, t - END_AT));
    captionsAt(t);
    composer.render();
    dip.style.opacity = hopping ? String(0.92 * Math.pow(Math.sin(Math.PI * prog(t, s[1] - HOP, s[1])), 1.3)) : "0";
    // the campus takes over from the phone, until the cut in the middle of the hop out
    const inCity = s[2] === "cert" && !(hopping && t >= s[1] - HOP / 2);
    city.draw(t - s[0], t, inCity ? feat.worldRect(camera, W, H) : null, inCity ? prog(t - s[0], 0.78, 0.96) : 0);
    // the proof flies out to be read, then settles back onto the phone before his hop
    if (s[2] === "glossary") {
      // the 3D Body: off the phone, big, coming apart (the app's own explode frames), then it turns
      // into its Heart / Corazón glossary card, and settles back before his hop
      const u = t - s[0], len = s[1] - s[0], end = len - HOP - 0.06;
      const k = prog(u, 0.3, 0.62) * (1 - prog(u, end - 0.22, end));
      const q = feat.screenRect(camera, W, H), xs = q.map((p) => p[0]), ys = q.map((p) => p[1]);
      const from = { x: Math.min(...xs), y: Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * 0.14, w: Math.max(...xs) - Math.min(...xs), h: (Math.max(...ys) - Math.min(...ys)) * 0.74 };
      const body = feat.explodeArt(13 * inOutSine(prog(u, 0.55, 1.5)));
      hero.draw(k > 0.001 ? body : null, from, k, feat.proofArt("glossary"), prog(u, 1.55, 1.9));
    } else if (isFeature(s[2]) && s[2] !== "cert") {
      const u = t - s[0], len = s[1] - s[0], start = 0.6, end = len - HOP - 0.06;
      const k = prog(u, start, start + 0.35) * (1 - prog(u, end - 0.22, end));
      hero.draw(k > 0.001 ? feat.proofArt(s[2]) : null, k > 0.001 ? proofRect(s[2]) : null, k);
    } else hero.draw(null, null, 0);
    overlay.draw(smileyState);
    // for the checks: his box and the proof's box on screen this frame
    window.__smileyCheck = { t: time, shot: s[2], smiley: overlay.box(), proof: hero.box() || city.box() || (isFeature(s[2]) ? proofRect(s[2]) : null),
      nextProof: hopping ? proofRect(next[2]) : null, screen: isFeature(s[2]) ? feat.screenRect(camera, W, H) : null };
  }

  /* Motion blur, like the clip's: during the hops and fly-throughs a frame is the average of several
     moments inside a half-frame shutter, so fast motion smears the way a camera's does. Every
     moment is still a pure function of time. */
  const SUB = 7, SHUTTER = 0.35 / 30;
  const accRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
  const addQuad = new FullScreenQuad(new THREE.ShaderMaterial({
    uniforms: { tex: { value: null }, k: { value: 1 / SUB } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: "uniform sampler2D tex; uniform float k; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tex, vUv).rgb * k, 1.0); }",
    blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
  }));
  const showQuad = new FullScreenQuad(new THREE.ShaderMaterial({
    uniforms: { tex: { value: accRT.texture } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: "uniform sampler2D tex; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tex, vUv).rgb, 1.0); }",
    depthTest: false, depthWrite: false,
  }));
  function blurred(time) {
    const t = hookTime(time - OPEN);
    if (t < 0) return false;
    const { s, next, hopping } = shotAt(t);
    return !hopping && !!(next && t > s[1] - WHIP);
  }
  function renderAt(time) {
    if (!blurred(time)) { composer.renderToScreen = true; drawScene(time); return; }
    composer.renderToScreen = false;
    renderer.setRenderTarget(accRT); renderer.setClearColor(0x000000, 1); renderer.clear();
    for (let j = 0; j < SUB; j++) {
      drawScene(time - (j / (SUB - 1)) * SHUTTER);
      renderer.setRenderTarget(accRT);
      renderer.autoClear = false;
      addQuad.material.uniforms.tex.value = composer.readBuffer.texture;
      addQuad.render(renderer);
      renderer.autoClear = true;
    }
    renderer.setRenderTarget(null);
    showQuad.render(renderer);
    composer.renderToScreen = true;
  }
  timerSlot.userData.home = timerSlot.position.clone();
  window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
  renderAt(window.__hfThreeTime || 0);
  window.__renderAt = renderAt;
}

window.__hfBuildResolve(build());
