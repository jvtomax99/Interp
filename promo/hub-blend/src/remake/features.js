// Shots 2-6 of BRIEF.md (features 1-5), each a real app screen from step 2
// lying in 3D with its layers able to lift off the glass, and one technique
// from the references per shot:
//   home        Slate phone: layers peel off, the quick tiles come forward
//   glossary    andremass clones: a field of the 41 specialty pins ripples, then folds into the Emergency list
//   translate   After Effects mascot: Dr. Smiley types, the glossary answer rises first, the AI card second
//   physician   andremass chrome: Dr. Elena Marin's card turns like a solid slab, her terms fan out
//   falsefriends After Effects mascot: Dr. Smiley lands on "constipado" and it flips over red
import * as THREE from "three";
import { RoundedBoxGeometry } from "../../vendor/RoundedBoxGeometry.js";
import { createSmiley, MOVES } from "../smiley.js";
import { clamp, lerp, prog, outBack, outExpo, outCubic, inOutSine, inOutCubic } from "../util.js";

export const FEATURES = [
  { g: "home", a: "Built by our", b: "own interpreters." },
  { g: "glossary", a: "One glossary.", b: "Every specialty." },
  { g: "translate", a: "Glossary first.", b: "AI second." },
  { g: "physician", a: "Ready for", b: "every physician." },
  { g: "falsefriends", a: "101 false friends.", b: "Flagged." },
];
export const FEATURE_LEN = 2.5;

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

export async function buildFeatures(scene, groups, { label } = {}) {
  const Z0 = -58, STEP = 12;
  const shots = {};
  for (const [i, f] of FEATURES.entries()) {
    const g = new THREE.Group();
    g.position.set(0, 0, Z0 - i * STEP);
    scene.add(g);
    groups[f.g] = g;
  }
  for (const f of FEATURES) {
    shots[f.g] = await phoneScreen(f.g);
    groups[f.g].add(shots[f.g].group);
  }

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
  bg2.font = '800 96px "Inter Tight"'; bg2.fillText("constipado", 378, 330);
  bg2.font = '800 150px "Inter Tight"'; bg2.fillText("≠", 378, 500);
  bg2.font = '500 64px "Inter Tight"'; bg2.fillText("constipated", 378, 600);
  bg2.fillStyle = "#ffe3e9"; bg2.font = '800 80px "Inter Tight"'; bg2.fillText("= a cold", 378, 760);
  const backTex = new THREE.CanvasTexture(bc); backTex.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(ffL.w * 0.97, ffL.h * 0.97), new THREE.MeshBasicMaterial({ map: backTex, toneMapped: false, transparent: true }));
  back.rotation.x = Math.PI / 2; // faces down until the card flips
  back.position.y = -0.004;
  ffL.pivot.add(back);

  // ---- Dr. Smiley ----
  const smiley = await createSmiley({ root: "assets/drsmiley/" });
  smiley.group.scale.setScalar(0.9);
  scene.add(smiley.group);

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
  };

  // cameras: low, close, always moving. [from pos, to pos, from look, to look, focus point]
  const CAMS = {
    home: [[1.0, 3.0, 7.4], [-0.4, 3.4, 6.2], [0, 0.2, 0.2], [0, 0.4, 0.6], [0, 0.6, 1.2]],
    glossary: [[1.2, 1.6, 6.6], [0.2, 3.3, 6.4], [0, 0.55, 0.4], [0, 0.4, 0.6], [0, 0.6, 1.0]],
    translate: [[1.1, 2.9, 7.2], [0.1, 3.6, 7.0], [-0.2, 0.35, 0.0], [0, 0.4, 0.6], [0, 0.6, 1.4]],
    physician: [[-1.0, 3.2, 5.0], [0.6, 3.5, 4.4], [0, 0.6, -1.5], [0, 0.7, -1.0], [0, 0.9, -1.6]],
    falsefriends: [[1.3, 3.0, 7.6], [0.3, 3.7, 7.6], [-0.2, 0.4, 1.2], [0, 0.4, 1.0], [0, 0.6, 1.8]],
  };
  function view(g, u) {
    const c = CAMS[g], e = inOutSine(clamp(u / FEATURE_LEN)), o = groups[g].position;
    const v = (a, b) => new THREE.Vector3(lerp(a[0], b[0], e) + o.x, lerp(a[1], b[1], e) + o.y, lerp(a[2], b[2], e) + o.z);
    return { pos: v(c[0], c[1]), look: v(c[2], c[3]), focus: new THREE.Vector3(...c[4]).add(o) };
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
  return { update, view, smiley };
}
