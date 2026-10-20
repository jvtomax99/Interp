// Shots 2-6 of BRIEF.md (features 1-5), each a real app screen from step 2
// lying in 3D with its layers able to lift off the glass, and one technique
// from the references per shot:
//   home        Slate phone: layers peel off, the quick tiles come forward
//   glossary    andremass clones: a field of the 41 specialty pins ripples, then folds into the Emergency list
//   body        Slate phone: the 3D Body on the phone, a tap on the chest, the view dives in to the heart, its card lifts
//   translate   After Effects mascot: Dr. Smiley types, the glossary answer rises first, the AI card second
//   physician   andremass chrome: Dr. Elena Marin's card turns like a solid slab, her terms fan out
//   falsefriends After Effects mascot: Dr. Smiley lands on "constipado" and it flips over red
//   drills      Slate lyric: "Fue un ingreso de urgencia." drops word by word, the trap word cracks
//   cert        pop-up book: the CoreCHI campus (city/, the app's own 3D render) stands up out of the phone, 145 counts up
//   team        Slate layers: chat bubbles stack in depth, "Lavado del port" comes forward
//   ask         After Effects mascot: Dr. Smiley steps out of the screen, his briefing card rises behind him
import * as THREE from "three";
import { RoundedBoxGeometry } from "../../vendor/RoundedBoxGeometry.js";
import { createSmiley, MOVES } from "../smiley.js";
import { clamp, lerp, prog, outBack, outExpo, outCubic, inOutSine, inOutCubic } from "../util.js";

export const FEATURES = [
  // every word capitalised (Jose, 2026-10-20)
  { g: "home", a: "Built By Our", b: "Own Interpreters." },
  { g: "glossary", a: "One Glossary.", b: "Every Specialty." },
  { g: "body", a: "Explore The 3D Body.", b: "English And Spanish.", len: 3.5 }, // longer: the body comes apart first
  { g: "translate", a: "Glossary First.", b: "AI Second." },
  { g: "physician", a: "Ready For", b: "Every Physician." },
  { g: "falsefriends", a: "101 False Friends.", b: "Flagged." },
  { g: "drills", a: "Daily Drills.", b: "Sharp Skills." },
  { g: "cert", a: "National Certification.", b: "Prep Built In." },
  { g: "team", a: "One Team.", b: "One Channel." },
  { g: "ask", a: "Stuck?", b: "Ask Dr. Smiley." },
];
export const FEATURE_LEN = 2.5;
export const featureLen = (f) => f.len || FEATURE_LEN;
// when each feature starts, in the clock after the opener (the hook and logo take the first 9.5 s)
export const FEATURE_STARTS = FEATURES.reduce((a, f, i) => (a.push(i ? a[i - 1] + featureLen(FEATURES[i - 1]) : 9.5), a), []);
export const FEATURES_END = FEATURE_STARTS.at(-1) + featureLen(FEATURES.at(-1));
const ZOOM = 1.28; // every camera this much farther from what it looks at

const PX = 0.01;             // world units per CSS pixel of the 390 x 844 screen
const SW = 390 * PX, SH = 844 * PX;
const TOP = 0.1;             // the glass sits this high on the phone body
const SCREEN = 0xc4cbdb;     // screens drawn a little under white, so bloom leaves them crisp
const PINS = ["anatomy", "cardiology", "chat", "dermatology", "developmental", "directory", "doctor-directory", "doctor-prep", "emergency", "endocrinology", "ent", "ethics", "events", "find-doctor", "genetics", "heart-failure", "hematology", "infectious-disease", "infusion", "laboratory", "leukemia", "medical-terminology", "medifind", "nephrology", "neurology", "oncology", "ophthalmology", "orthopedics", "pediatrics", "pharmacy", "practice", "providers", "pulmonology", "resources", "review", "surgery-anesthesia", "translate", "updates", "urology", "userguide", "wave"];

const loadTex = (src) => new Promise((res, rej) => new THREE.TextureLoader().load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, rej));

// A soft rounded shadow, shared by every lifted layer.
function shadowTex() {
  const c = document.createElement("canvas"); c.width = 128; c.height = 128;
  const g = c.getContext("2d");
  g.filter = "blur(14px)"; g.fillStyle = "rgba(8,18,52,0.9)";
  g.beginPath(); g.roundRect(26, 26, 76, 76, 14); g.fill();
  return new THREE.CanvasTexture(c);
}

// One app screen on a phone body. Layers start on the glass (it reads as the
// plain screen) and lift when told.
async function phoneScreen(state) {
  const meta = await (await fetch(`assets/layers/${state}/layers.json`)).json();
  const base = `assets/layers/${state}/`;
  const group = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(SW + 0.24, 0.2, SH + 0.24, 6, 0.22), new THREE.MeshStandardMaterial({ color: 0x0e1328, roughness: 0.3, metalness: 0.75 }));
  body.position.y = TOP - 0.1;
  body.castShadow = true;
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: await loadTex(base + meta.bg), toneMapped: false, color: SCREEN }));
  bg.rotation.x = -Math.PI / 2;
  bg.position.y = TOP + 0.001;
  group.add(body, bg);
  const sh = shadowTex();
  const layers = {};
  for (const l of meta.layers) {
    const c = l.clip, w = c.width * PX, h = c.height * PX;
    const pivot = new THREE.Group(); // at the layer's centre on the glass; lifts along +y
    pivot.position.set((c.x + c.width / 2) * PX - SW / 2, TOP, (c.y + c.height / 2) * PX - SH / 2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: await loadTex(base + l.file), transparent: true, toneMapped: false, depthWrite: false, color: SCREEN }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.003 + l.depth * 0.001;
    m.renderOrder = 2 + l.depth;
    pivot.add(m);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.12, h * 1.12), new THREE.MeshBasicMaterial({ map: sh, transparent: true, depthWrite: false, opacity: 0 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set((c.x + c.width / 2) * PX - SW / 2, TOP + 0.002, (c.y + c.height / 2) * PX - SH / 2);
    shadow.renderOrder = 1;
    group.add(pivot, shadow);
    layers[l.key] = { pivot, mesh: m, shadow, l, w, h };
  }
  /* lift(key, height, tilt toward the camera in radians, spin about the screen's normal) */
  function lift(key, y, tilt = 0, spin = 0) {
    const L = layers[key]; if (!L) return;
    L.pivot.position.y = TOP + y;
    L.pivot.rotation.set(tilt, spin, 0);
    L.shadow.material.opacity = Math.min(0.55, y * 1.4);
    const s = 1 + y * 0.35;
    L.shadow.scale.set(s, s, 1);
  }
  return { group, layers, lift, meta };
}

export async function buildFeatures(scene, groups, { word, label } = {}) {
  const Z0 = -58, STEP = 12;
  const shots = {};
  for (const [i, f] of FEATURES.entries()) {
    const g = new THREE.Group();
    g.position.set(0, 0, Z0 - i * STEP);
    scene.add(g);
    groups[f.g] = g;
  }
  for (const f of FEATURES) {
    shots[f.g] = await phoneScreen(f.g === "body" ? "heart" : f.g); // the 3D Body shot is built on the heart screen
    groups[f.g].add(shots[f.g].group);
  }
  // ---- 3D Body: the whole body over the heart screen, faded and dived through ----
  const bodyFull = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: await loadTex("assets/layers/body/full.webp"), toneMapped: false, color: SCREEN, transparent: true, depthWrite: false }));
  bodyFull.rotation.x = -Math.PI / 2;
  bodyFull.renderOrder = 6;
  const bodyPivot = new THREE.Group(); // at the heart on the chest, so the dive zooms there
  const HEART_AT = new THREE.Vector3((193 - 195) * PX, TOP + 0.004, (330 - 422) * PX);
  bodyPivot.position.copy(HEART_AT);
  bodyFull.position.set(-HEART_AT.x, 0, -HEART_AT.z);
  bodyPivot.add(bodyFull);
  shots.body.group.add(bodyPivot);
  const tapRing = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.13, 64), new THREE.MeshBasicMaterial({ color: 0x3fc6ee, transparent: true, toneMapped: false, depthWrite: false }));
  tapRing.rotation.x = -Math.PI / 2;
  tapRing.position.copy(HEART_AT).add(new THREE.Vector3(0, 0.004, 0));
  tapRing.renderOrder = 7;
  shots.body.group.add(tapRing);
  // the body coming apart: frames recorded from the real viewer (tools/capture-explode.cjs)
  const exMeta = await fetch("assets/layers/explode/frames.json").then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const exTex = exMeta ? await Promise.all(exMeta.frames.map((f) => loadTex(`assets/layers/explode/${f.file}`))) : [];

  // ---- glossary: the field of specialty pins ----
  const pinTex = await Promise.all(PINS.map((p) => loadTex(`assets/pins/${p}.webp`)));
  const pins = pinTex.map((t, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.05, toneMapped: false }));
    const col = i % 7, row = Math.floor(i / 7);
    m.userData.home = new THREE.Vector3((col - 3) * 0.72, 0.42, (row - 2.5) * 0.85 + 0.2);
    m.userData.i = i;
    groups.glossary.add(m);
    return m;
  });

  // ---- physician: the bento card as a slab with chrome sides ----
  const bentoL = shots.physician.layers.bento;
  const slab = new THREE.Mesh(new RoundedBoxGeometry(bentoL.w * 0.97, 0.09, bentoL.h * 0.95, 4, 0.04), new THREE.MeshStandardMaterial({ color: 0xc9d4ea, metalness: 1, roughness: 0.18 }));
  slab.position.y = -0.05;
  bentoL.pivot.add(slab);
  bentoL.mesh.position.y = 0.002;

  // ---- false friends: the card's back, red ----
  const ffL = shots.falsefriends.layers.proof;
  const bc = document.createElement("canvas"); bc.width = 756; bc.height = 974;
  const bg2 = bc.getContext("2d");
  bg2.fillStyle = "#c2485c"; bg2.beginPath(); bg2.roundRect(0, 0, 756, 974, 44); bg2.fill();
  bg2.fillStyle = "#fff"; bg2.textAlign = "center";
  bg2.font = '800 96px "Inter Tight"'; bg2.fillText("Constipado", 378, 330);
  bg2.font = '800 150px "Inter Tight"'; bg2.fillText("≠", 378, 500);
  bg2.font = '500 64px "Inter Tight"'; bg2.fillText("Constipated", 378, 600);
  bg2.fillStyle = "#ffe3e9"; bg2.font = '800 80px "Inter Tight"'; bg2.fillText("= A Cold", 378, 760);
  const backTex = new THREE.CanvasTexture(bc); backTex.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(ffL.w * 0.97, ffL.h * 0.97), new THREE.MeshBasicMaterial({ map: backTex, toneMapped: false, transparent: true }));
  back.rotation.x = Math.PI / 2; // faces down until the card flips
  back.position.y = -0.004;
  ffL.pivot.add(back);

  // ---- Dr. Smiley ----
  // His 3D body is kept only as the shots' choreography: it is never drawn (Jose: the rounded
  // body warped his drawing). Each pose is recorded and the overlay (overlay.js) draws him from it.
  const smiley = await createSmiley({ root: "assets/drsmiley/" });
  const rawPose = smiley.pose;
  smiley.pose = (p) => { smiley.lastPose = p; rawPose(p); };
  smiley.group.scale.setScalar(0.9);
  scene.add(smiley.group);
  // nothing of him shows below the glass, so he can rise out of a screen (Ask)
  const glassClip = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -(TOP - 0.004))];
  smiley.group.traverse((o) => { if (o.material) o.material.clippingPlanes = glassClip; });
  const holeRing = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.47, 96), new THREE.MeshBasicMaterial({ color: 0x3fc6ee, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  const holeHalo = new THREE.Mesh(new THREE.RingGeometry(0.47, 0.85, 96), new THREE.MeshBasicMaterial({ color: 0x3fc6ee, transparent: true, opacity: 0.25, toneMapped: false, depthWrite: false }));
  for (const r of [holeRing, holeHalo]) { r.rotation.x = -Math.PI / 2; r.position.set(-0.55, TOP + 0.006, 2.35); groups.ask.add(r); }

  // ---- drills: the heard line as thick words over the sheet; "ingreso" cracks in two ----
  // two centred lines, laid out from each word's real width
  const DSIZE = 0.34, GAP = 0.13;
  const DRILL = [["Fue", 0], ["Un", 0], ["Ingreso", 0], ["De", 1], ["Urgencia.", 1]].map(([w, line]) => ({ w, line, width: (word(w, { fit: 99, maxSize: DSIZE }).geometry.userData.w) * DSIZE }));
  for (const line of [0, 1]) {
    const ws = DRILL.filter((d) => d.line === line), total = ws.reduce((a, d) => a + d.width, 0) + GAP * (ws.length - 1);
    let x = -total / 2;
    for (const d of ws) { d.x = x + d.width / 2; x += d.width + GAP; d.y = line ? 0.62 : 1.12; } // low over the sheet, clear of the caption once the picture shifts up for Dr. Smiley
  }
  const drillWords = DRILL.map(({ w, x, y }) => {
    const g = new THREE.Group();
    if (w === "Ingreso") {
      // the trap word is two pieces set side by side ("ingr" + "eso"), so it can crack apart cleanly
      const L = word("Ingr", { fit: 99, maxSize: DSIZE, face: "red" }), R = word("eso", { fit: 99, maxSize: DSIZE, face: "red" });
      const wl = L.geometry.userData.w * DSIZE, wr = R.geometry.userData.w * DSIZE, tot = wl + wr + 0.012;
      L.position.x = -tot / 2 + wl / 2; R.position.x = tot / 2 - wr / 2;
      L.userData.side = -1; R.userData.side = 1; L.userData.x = L.position.x; R.userData.x = R.position.x;
      g.add(L, R);
    } else g.add(word(w, { fit: 99, maxSize: DSIZE }));
    g.position.set(x, y, 0.9);
    g.userData.home = g.position.clone();
    groups.drills.add(g);
    return g;
  });
  // ---- cert: the CoreCHI campus, the app's own 3D render in three depth layers, as a pop-up ----
  const [skyT, farT, nearT] = await Promise.all(["sky", "far", "near"].map((n) => loadTex(`assets/city/${n}.webp`)));
  const CW = 3.7, CH = CW * 760 / 960;
  const popLayer = (tex, z, scale = 1) => {
    const hinge = new THREE.Group(); // hinged at its bottom edge on the glass, like a pop-up book
    hinge.position.set(0, TOP + 0.01, z);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(CW * scale, CH * scale), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide, alphaTest: 0.02 }));
    m.position.y = (CH * scale) / 2;
    hinge.add(m);
    groups.cert.add(hinge);
    return hinge;
  };
  const campusSky = popLayer(skyT, -1.9, 1.25), campusFar = popLayer(farT, -1.0, 1.08), campusNear = popLayer(nearT, -0.1);
  const counter = new THREE.Group();
  counter.position.set(1.15, 0.72, 2.1);
  groups.cert.add(counter);
  const qLabel = label ? label("QUESTIONS") : new THREE.Group();
  qLabel.position.set(1.15, 0.5, 2.1);
  groups.cert.add(qLabel);

  // ---------- each shot as a function of u = seconds into it ----------
  const play = {
    home(u, S) {
      const order = [["tabbar", 0.1, 0.16], ["drill", 0.3, 0.22], ["search", 0.45, 0.28], ["banner", 0.6, 0.12]];
      for (const [k, t0, h] of order) S.lift(k, h * outBack(prog(u, t0, t0 + 0.45), 1.4));
      const p = outBack(prog(u, 0.95, 1.5), 1.5);
      S.lift("tiles", 0.6 * p, 0.5 * p);
    },
    glossary(u, S) {
      const fold = inOutCubic(prog(u, 0.95, 1.55));
      pins.forEach((m) => {
        const h = m.userData.home, i = m.userData.i;
        const d = Math.hypot(h.x, h.z);
        const wave = Math.sin(d * 2.3 - u * 7) * 0.22 * (1 - fold);
        const target = new THREE.Vector3(0, TOP + 0.05, 1.0);
        m.position.set(lerp(h.x, target.x, fold), lerp(h.y + wave + 0.25 * outExpo(prog(u, 0, 0.5)) - 0.25, target.y, fold), lerp(h.z, target.z, fold));
        m.rotation.set(lerp(-0.12, -Math.PI / 2, fold), 0, Math.sin(u * 3 + i) * 0.08 * (1 - fold));
        m.scale.setScalar(Math.max(0.001, (1 - fold * 0.9) * outBack(prog(u, (i % 7) * 0.03, (i % 7) * 0.03 + 0.35), 1.6)));
        m.visible = fold < 0.98;
      });
      const rise = outExpo(prog(u, 0.85, 1.35));
      S.group.position.y = lerp(-0.6, 0, rise);
      S.group.visible = u > 0.85;
      for (const k of ["row1", "row2", "row3", "head"]) S.lift(k, 0.06 * outBack(prog(u, 1.3, 1.7)));
      const p = outBack(prog(u, 1.45, 1.95), 1.5);
      S.lift("proof", 0.42 * p, 0.42 * p);
    },
    translate(u, S) {
      smiley.group.visible = true;
      smiley.group.position.copy(S.group.parent.position).add(new THREE.Vector3(-0.85, TOP, 0.55));
      smiley.group.rotation.y = 0.35;
      smiley.pose(u < 1.0 ? MOVES.type(u) : MOVES.point(prog(u, 1.0, 1.6)));
      S.lift("input", 0.12 * outBack(prog(u, 0.05, 0.4)));
      S.lift("result1", 0.3 * outBack(prog(u, 0.9, 1.3), 1.4), 0.2 * prog(u, 0.9, 1.3));
      const p = outBack(prog(u, 1.3, 1.85), 1.5);
      S.lift("proof", 0.36 * p, 0.4 * p);
    },
    physician(u, S) {
      const p = outBack(prog(u, 0.25, 0.85), 1.3);
      const turn = Math.sin(Math.PI * prog(u, 0.35, 1.55)) * 0.55;
      S.lift("bento", 0.6 * p, 0.5 * outCubic(prog(u, 0.3, 1.2)), turn * 0.8);
      ["row1", "row2", "row3"].forEach((k, i) => {
        const q = outBack(prog(u, 1.0 + i * 0.12, 1.5 + i * 0.12), 1.4);
        S.lift(k, 0.18 * q + i * 0.04 * q, 0.15 * q, (i - 1) * -0.16 * q);
        const L = S.layers[k]; if (L) L.pivot.position.x = L.l.clip.x * PX + (L.l.clip.width * PX) / 2 - SW / 2 + (i - 1) * 0.25 * q;
      });
      S.lift("hero", 0.1 * outBack(prog(u, 0.1, 0.5)));
    },
    falsefriends(u, S) {
      smiley.group.visible = true;
      const card = S.layers.proof;
      // he hops in from the left and lands on the card (u 0.2-0.75), then hops off as it flips
      const start = new THREE.Vector3(-1.3, TOP, 2.6), onCard = new THREE.Vector3(-0.35, TOP + 0.02, 1.9), off = new THREE.Vector3(-1.45, TOP, 3.2);
      const base = S.group.parent.position;
      let pos, pose;
      if (u < 0.2) { pos = start; pose = MOVES.land(1); }
      else if (u < 0.75) { const a = prog(u, 0.2, 0.75); pos = start.clone().lerp(onCard, a); pose = MOVES.hop(a); }
      else if (u < 1.05) { pos = onCard; pose = { ...MOVES.land(prog(u, 0.75, 1.05)), face: "worried", brows: "worried" }; }
      else { const a = prog(u, 1.05, 1.55); pos = onCard.clone().lerp(off, a); pose = { ...MOVES.hop(a), face: a < 0.9 ? "surprised" : "worried", brows: "up" }; }
      smiley.group.position.copy(base).add(pos);
      smiley.group.rotation.y = 0.25;
      smiley.pose(pose);
      // the card flips over, red side up, once he's off it
      const lift = outBack(prog(u, 1.05, 1.4), 1.3);
      const flip = inOutCubic(prog(u, 1.2, 1.8));
      S.lift("proof", 0.3 * lift + 0.3 * Math.sin(Math.PI * flip), 0.35 * outCubic(prog(u, 1.7, 2.2)));
      card.pivot.rotateX(-Math.PI * flip);
      card.mesh.visible = flip < 0.5;
      back.visible = flip >= 0.5;
    },
    drills(u, S) {
      S.lift("sheet", 0.04);
      S.lift("title", 0.1 * outBack(prog(u, 0.0, 0.3)));
      drillWords.forEach((g, i) => {
        const t0 = 0.12 + i * 0.17, p = prog(u, t0, t0 + 0.32), e = outBack(p, 1.8);
        g.visible = p > 0;
        g.position.set(g.userData.home.x, g.userData.home.y + (1 - e) * 1.6, g.userData.home.z);
        g.rotation.x = (1 - outExpo(p)) * 1.2;
        g.scale.setScalar(Math.max(0.001, 0.5 + 0.5 * outExpo(p)));
      });
      // the trap word cracks on the beat after it lands
      const c = outExpo(prog(u, 1.05, 1.4));
      const ing = drillWords[2];
      ing.children.forEach((m) => { const sd = m.userData.side; m.position.set(m.userData.x + sd * 0.1 * c, -0.1 * c * c, sd * 0.05 * c); m.rotation.z = -sd * 0.2 * c; });
      const p = outBack(prog(u, 1.45, 1.95), 1.5);
      S.lift("proof", 0.3 * p, 0.35 * p);
    },
    cert(u, S) {
      S.lift("proof", 0.25 * outBack(prog(u, 0.1, 0.45)), 0.3 * prog(u, 0.1, 0.45));
      // the campus stands up out of the phone: sky, then the city behind, then the hospital
      [[campusSky, 0.05], [campusFar, 0.15], [campusNear, 0.28]].forEach(([h, t0]) => {
        const p = outBack(prog(u, t0, t0 + 0.6), 1.25) * (1 - inOutCubic(prog(u, 1.75, 2.0))); // folds shut before he hops on
        h.rotation.x = lerp(-Math.PI / 2, -0.08, p);
        h.visible = u > t0 && p > 0.01;
      });
      // 0 to 145, in fives, then the exact number
      const n = Math.round(145 * outCubic(prog(u, 0.45, 1.3)) / 5) * 5;
      const txt = String(u >= 1.3 ? 145 : Math.min(145, n));
      if (counter.userData.txt !== txt) { counter.clear(); counter.add(word(txt, { fit: 2, maxSize: 0.42 })); counter.userData.txt = txt; }
      counter.visible = qLabel.visible = u > 0.4;
      if (qLabel.material) qLabel.material.opacity = outCubic(prog(u, 0.5, 0.8));
      // Dr. Smiley hops in front of his campus and points at it
      smiley.group.visible = true;
      const a = prog(u, 0.7, 1.2);
      smiley.group.position.copy(S.group.parent.position).add(new THREE.Vector3(lerp(-1.9, -1.05, a), TOP, lerp(2.4, 1.6, a)));
      smiley.group.rotation.y = 0.35;
      smiley.pose(u < 0.7 ? MOVES.land(1) : u < 1.2 ? MOVES.hop(a) : { ...MOVES.point(prog(u, 1.2, 1.7)), face: "smile", brows: "glad" });
    },
    body(u, S) {
      // the body turns and comes apart (Explode anatomy, the real viewer's frames), a tap on the
      // chest, the view dives in to the heart, its Heart / Corazon card lifts
      if (exTex.length) {
        const k = Math.min(exTex.length - 1, Math.floor(prog(u, 0.1, 1.7) * exTex.length));
        if (bodyFull.material.map !== exTex[k]) { bodyFull.material.map = exTex[k]; bodyFull.material.needsUpdate = true; }
      }
      const tap = prog(u, 1.75, 2.1);
      tapRing.visible = tap > 0 && tap < 1;
      tapRing.scale.setScalar(1 + 2.2 * outCubic(tap));
      tapRing.material.opacity = 1 - tap;
      const dive = inOutCubic(prog(u, 1.95, 2.4));
      bodyPivot.scale.set(1 + 3 * dive, 1, 1 + 3 * dive);
      bodyFull.material.opacity = 1 - outCubic(prog(u, 2.1, 2.4));
      bodyFull.visible = bodyFull.material.opacity > 0.01;
      S.layers.proof.mesh.visible = u > 2.35;
      const p = outBack(prog(u, 2.45, 3.0), 1.5);
      S.lift("proof", 0.12 * p, 0.18 * p); // a small lift: a big one ran up under the caption
    },

    team(u, S) {
      S.lift("channels", 0.1 * outBack(prog(u, 0.05, 0.35)));
      S.lift("msg1", 0.16 * outBack(prog(u, 0.2, 0.55), 1.4), 0.12);
      S.lift("msg2", 0.24 * outBack(prog(u, 0.35, 0.7), 1.4), 0.15);
      S.lift("input", 0.08 * outBack(prog(u, 0.5, 0.8)));
      const p = outBack(prog(u, 0.9, 1.45), 1.5);
      S.lift("proof", 0.42 * p, 0.42 * p);
      const L = S.layers.proof; L.pivot.position.x += 0.35 * p; // into the middle as it comes forward
    },
    ask(u, S) {
      smiley.group.visible = true;
      smiley.group.position.copy(S.group.parent.position).add(new THREE.Vector3(-0.55, TOP, 2.35));
      smiley.group.rotation.y = 0.2;
      // he has just landed (from the last shot): he dives into the glowing ring, then steps back out of the screen
      const sink = prog(u, 0.12, 0.55);
      smiley.pose(u < 0.55 ? { y: -1.1 * sink * sink * sink, face: "smile", brows: "glad", glow: 1, rim: 1 } : u < 1.6 ? MOVES.stepOut(prog(u, 0.55, 1.45)) : MOVES.wave(prog(u, 1.6, 2.5)));
      holeRing.material.opacity = Math.sin(Math.PI * Math.min(1, prog(u, 0.0, 1.5))) * 0.95;
      holeHalo.material.opacity = holeRing.material.opacity * 0.3;
      const p = outBack(prog(u, 0.75, 1.3), 1.4);
      S.lift("proof", 0.3 * p, 0.38 * p);
      S.lift("input", 0.08 * outBack(prog(u, 0.2, 0.5)));
    },
  };

  // cameras: low, close, always moving. [from pos, to pos, from look, to look, focus point]
  const CAMS = {
    home: [[1.0, 3.0, 7.4], [-0.4, 3.4, 6.2], [0, 0.2, 0.2], [0, 0.4, 0.6], [0, 0.6, 1.2]],
    glossary: [[1.2, 1.6, 6.6], [0.2, 3.3, 6.4], [0, 0.55, 0.4], [0, 0.4, 0.6], [0, 0.6, 1.0]],
    translate: [[1.1, 2.9, 7.2], [0.1, 3.6, 7.0], [-0.2, 0.35, 0.0], [0, 0.4, 0.6], [0, 0.6, 1.4]],
    physician: [[-1.0, 3.2, 5.0], [0.6, 3.5, 4.4], [0, 0.6, -1.5], [0, 0.7, -1.0], [0, 0.9, -1.6]],
    falsefriends: [[1.3, 3.0, 7.6], [0.3, 3.7, 7.6], [-0.2, 0.4, 1.2], [0, 0.4, 1.0], [0, 0.6, 1.8]],
    drills: [[-0.9, 2.3, 7.2], [0.3, 2.6, 6.6], [0, 0.9, 0.5], [0, 0.95, 0.6], [0, 1.2, 0.9]],
    body: [[0.6, 4.4, 6.4], [-0.2, 4.6, 6.0], [0, 0.4, -0.6], [0, 0.45, -0.3], [0, 0.6, -0.6]],
    cert: [[1.4, 2.6, 7.0], [-0.3, 2.9, 6.6], [-0.2, 1.4, 0.0], [0, 1.5, 0.2], [0, 1.4, -0.2]],
    team: [[1.1, 3.0, 7.0], [-0.1, 3.4, 6.6], [0, 0.35, 0.0], [0, 0.4, -0.4], [0, 0.6, -0.8]],
    ask: [[0.9, 2.4, 7.0], [-0.2, 2.9, 6.4], [-0.2, 0.7, 0.8], [0, 0.6, 0.6], [-0.4, 0.8, 2.3]],
  };
  function view(g, u) {
    const c = CAMS[g], e = inOutSine(clamp(u / featureLen(FEATURES.find((f) => f.g === g)))), o = groups[g].position;
    const v = (a, b) => new THREE.Vector3(lerp(a[0], b[0], e) + o.x, lerp(a[1], b[1], e) + o.y, lerp(a[2], b[2], e) + o.z);
    const look = v(c[2], c[3]);
    // pulled back from the first cut (Jose: "it gets cut off, too zoomed in")
    const pos = look.clone().add(v(c[0], c[1]).sub(look).multiplyScalar(ZOOM));
    return { pos, look, focus: new THREE.Vector3(...c[4]).add(o) };
  }

  function update(g, u) {
    smiley.group.visible = false;
    if (!play[g]) return;
    const S = shots[g];
    // every lift back to rest first, so a frame never depends on the one before it
    for (const k in S.layers) { S.lift(k, 0); const L = S.layers[k]; L.pivot.position.x = L.l.clip.x * PX + (L.l.clip.width * PX) / 2 - SW / 2; }
    S.group.position.y = 0; S.group.visible = true;
    play[g](u, S);
  }
  // where he waits on a phone when its shot has nothing for him to do: bottom left, glancing at the proof
  const idleSpot = (g) => groups[g].position.clone().add(new THREE.Vector3(-0.95, TOP, 2.4));
  function idle(g, u) {
    smiley.group.visible = true;
    smiley.group.position.copy(idleSpot(g));
    smiley.group.rotation.y = 0.3;
    smiley.pose({ y: 0.015 * Math.abs(Math.sin(u * 5)), face: u % 2.2 < 1.4 ? "halfR" : "smile", brows: "glad", glow: 0.25, rim: 0.6 });
  }
  // the proof item of a shot (the layer the caption points at), to keep Dr. Smiley off it
  const proofMesh = (g) => { const S = shots[g]; const k = Object.keys(S.layers).find((k) => S.layers[k].l.proof); return k ? S.layers[k].mesh : null; };
  return { update, view, smiley, idle, idleSpot, proofMesh };
}
