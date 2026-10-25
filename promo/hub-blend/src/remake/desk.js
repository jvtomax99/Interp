// The feature shots, staged the way Jose liked in the first hub-blend reel (2026-10-21):
// one desk, a glossy table in front of a window onto HUMC, a laptop on the left with a big
// headline for the feature, and the phone standing upright on the right showing the real app
// screen (step 2's layers), its proof item popping forward with v11's cyan outline. Dr. Smiley
// is drawn by the overlay (overlay.js); here his poses are only recorded.
// Same API as the old features.js: update(g, u), view(g, u), smiley, idle, idleSpot, proofMesh.
import * as THREE from "three";
import { Reflector } from "../../vendor/Reflector.js";
import { RoundedBoxGeometry } from "../../vendor/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "../../vendor/RectAreaLightUniformsLib.js";
import { MOVES, loadSmileyArt, composeSmiley, BROWS } from "../smiley.js";
import { FEATURES, featureLen, CUT, EXPLODE_IN } from "./features.js";
import { clamp, lerp, prog, outBack, outExpo, outCubic, inOutSine, inOutCubic } from "../util.js";

const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const texOf = (img) => { const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; };

// which app screen each feature shows on the phone, and which HUMC photo fills the window
const SCREEN_OF = { home: "home", glossary: "heart", // the 3D Body lives in the Glossary shot now (Jose, 2026-10-22): the body comes apart, then its Heart / Corazón glossary card
   body: "heart", translate: "translate", physician: "physician", falsefriends: "falsefriends", drills: "drills", cert: "cert", team: "team", ask: "ask" };
// the 1-minute cut: the Glossary shows the glossary again (the body has its own shot), and two new shots
if (CUT === 60) Object.assign(SCREEN_OF, { glossary: "glossary", notifications: "notifications", brain: "review" });
const WINDOW_OF = { home: "entrance", glossary: "tower", body: "pavilion-dusk", translate: "aerial", physician: "pavilion-dusk-2", falsefriends: "entrance", drills: "tower", cert: "aerial", team: "pavilion-dusk", notifications: "entrance", brain: "tower", ask: "pavilion-dusk-2" };
const PHONE = { w: 0.98, h: 2.12 }, PX = PHONE.w / 390;
const LID_W = 3.3, LID_H = 2.1, SCR_W = 3.08, SCR_H = 1.9;
const TT = (s) => s.replace(/(^|\s)(\p{L})/gu, (m, a, b) => a + b.toUpperCase()); // every word capitalised (Jose)

export async function buildDesk(scene, groups, { at = new THREE.Vector3(0, 0, -58) } = {}) {
  RectAreaLightUniformsLib.init();
  const desk = new THREE.Group();
  desk.position.copy(at);
  scene.add(desk);
  groups.desk = desk;
  // each feature keeps an (empty) group of its own, so the director's per-shot visibility still works
  for (const f of FEATURES) { const g = new THREE.Group(); g.position.copy(at); scene.add(g); groups[f.g] = g; }

  // ---------- the table and the window ----------
  const mirror = new Reflector(new THREE.PlaneGeometry(16, 12), { textureWidth: 540, textureHeight: 960, color: 0x7a8296, clipBias: 0.003 });
  mirror.rotation.x = -Math.PI / 2;
  desk.add(mirror);
  const lacquer = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), new THREE.MeshStandardMaterial({ color: 0x05070f, roughness: 0.22, metalness: 0.4, transparent: true, opacity: 0.6 }));
  lacquer.rotation.x = -Math.PI / 2; lacquer.position.y = 0.002; lacquer.receiveShadow = true;
  desk.add(lacquer);
  const photos = {};
  await Promise.all([...new Set(Object.values(WINDOW_OF))].map(async (n) => {
    const im = await loadImg(`assets/humc/${n}.jpg`);
    const c = document.createElement("canvas"); c.width = 1024; c.height = 1024;
    const g = c.getContext("2d"), k = Math.max(1024 / im.width, 1024 / im.height);
    g.filter = "blur(3px) saturate(0.95) brightness(0.78)";
    g.drawImage(im, (1024 - im.width * k) / 2, (1024 - im.height * k) / 2, im.width * k, im.height * k);
    g.filter = "none"; g.fillStyle = "rgba(3,6,26,0.25)"; g.fillRect(0, 0, 1024, 1024);
    g.fillStyle = "#06080f"; for (const x of [0, 512, 1018]) g.fillRect(x - 6, 0, 14, 1024); // window frames
    photos[n] = texOf(c);
  }));
  const windowView = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), new THREE.MeshBasicMaterial({ toneMapped: false, color: 0xcfcfcf, fog: false }));
  windowView.position.set(0.3, 3.4, -4.8);
  desk.add(windowView);

  // ---------- light ----------
  const key = new THREE.SpotLight(0xffe6c8, 60, 14, 0.6, 0.7, 1.4);
  key.position.set(-2.4, 6, 4); key.target.position.set(0.3, 0.8, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  desk.add(key, key.target);
  desk.add(new THREE.HemisphereLight(0xbfd4ff, 0x0a0f24, 0.45));

  // ---------- the laptop, its screen a canvas drawn per feature ----------
  const alu = new THREE.MeshStandardMaterial({ color: 0x2a2f3c, roughness: 0.38, metalness: 0.85 });
  const laptop = new THREE.Group();
  const base = new THREE.Mesh(new RoundedBoxGeometry(LID_W, 0.1, 2.25, 4, 0.05), alu); base.position.y = 0.05; base.castShadow = true;
  const kc = document.createElement("canvas"); kc.width = 1024; kc.height = 440;
  const kg = kc.getContext("2d"); kg.fillStyle = "#0c0f18"; kg.fillRect(0, 0, 1024, 440); kg.fillStyle = "#1b2030";
  for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) { kg.beginPath(); kg.roundRect(18 + c * 71, 14 + r * 70, 62, 60, 8); kg.fill(); }
  const keys = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.29), new THREE.MeshStandardMaterial({ map: texOf(kc), roughness: 0.6 }));
  keys.rotation.x = -Math.PI / 2; keys.position.set(0, 0.102, -0.25);
  const hinge = new THREE.Group(); hinge.position.set(0, 0.1, -1.1); hinge.rotation.x = -0.24;
  const lid = new THREE.Mesh(new RoundedBoxGeometry(LID_W, LID_H, 0.06, 4, 0.03), alu); lid.position.set(0, LID_H / 2, -0.03); lid.castShadow = true;
  const sc = document.createElement("canvas"); sc.width = 1280; sc.height = 790;
  const sg = sc.getContext("2d");
  const scrTex = texOf(sc);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCR_W, SCR_H), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false, color: 0xdedede }));
  screen.position.set(0, LID_H / 2 + 0.03, 0.002);
  const glow = new THREE.RectAreaLight(0x3fc6ee, 5, SCR_W, SCR_H); glow.position.set(0, LID_H / 2 + 0.03, 0.05);
  hinge.add(lid, screen, glow);
  laptop.add(base, keys, hinge);
  laptop.position.set(-0.55, 0, -1.0); laptop.rotation.y = 0.12;
  desk.add(laptop);

  // ---------- the phone, upright on the right, one screen per feature ----------
  const phone = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(PHONE.w + 0.08, PHONE.h + 0.08, 0.09, 6, 0.1), new THREE.MeshStandardMaterial({ color: 0x10152c, roughness: 0.3, metalness: 0.75 }));
  body.castShadow = true;
  phone.add(body);
  const stand = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.06, 0.5, 3, 0.03), alu); stand.position.set(0, -PHONE.h / 2 - 0.07, 0.05); phone.add(stand);
  phone.position.set(0.82, PHONE.h / 2 + 0.11, 1.55); phone.rotation.set(-0.05, -0.2, 0); // forward, so it reads big
  desk.add(phone);
  const screens = {};
  for (const state of new Set(FEATURES.map((f) => SCREEN_OF[f.g]).concat("cert"))) {
    const meta = await (await fetch(`assets/layers/${state}/layers.json`)).json();
    const g = new THREE.Group(); g.position.z = 0.047; g.visible = false;
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(PHONE.w, PHONE.h), new THREE.MeshBasicMaterial({ map: texOf(await loadImg(`assets/layers/${state}/${meta.bg}`)), toneMapped: false, color: 0xd6dbe6 }));
    g.add(bg);
    const layers = {};
    for (const l of meta.layers) {
      const c = l.clip, w = c.width * PX, h = c.height * PX;
      const pivot = new THREE.Group();
      pivot.position.set((c.x + c.width / 2) * PX - PHONE.w / 2, PHONE.h / 2 - (c.y + c.height / 2) * PX, 0.002 + l.depth * 0.001);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texOf(await loadImg(`assets/layers/${state}/${l.file}`)), transparent: true, toneMapped: false, depthWrite: false, color: 0xd6dbe6 }));
      // a layer inside an earlier one (CoreCHI's campus and stats inside its card) draws over it
      const inside = meta.layers.slice(0, meta.layers.indexOf(l)).filter((o) => o.clip.x <= c.x && o.clip.y <= c.y && o.clip.x + o.clip.width >= c.x + c.width && o.clip.y + o.clip.height >= c.y + c.height);
      m.renderOrder = Math.max(3 + l.depth, ...inside.map((o) => layers[o.key].mesh.renderOrder + 0.1));
      pivot.add(m);
      g.add(pivot);
      layers[l.key] = { pivot, mesh: m, l, w, h };
    }
    phone.add(g);
    screens[state] = { g, bg, layers, proofKey: Object.keys(layers).find((k) => layers[k].l.proof), meta };
  }
  // v11's cyan outline, around whatever pops forward
  const ringC = document.createElement("canvas"); ringC.width = 256; ringC.height = 256;
  { const r = ringC.getContext("2d"); r.strokeStyle = "#3fc6ee"; r.lineWidth = 10; r.shadowColor = "#3fc6ee"; r.shadowBlur = 18; r.beginPath(); r.roundRect(14, 14, 228, 228, 30); r.stroke(); }
  const ringTex = texOf(ringC);
  const outline = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, toneMapped: false, depthWrite: false }));
  outline.renderOrder = 10;
  phone.add(outline);
  // the 3D Body coming apart, from the real viewer (tools/capture-explode.cjs)
  const exMeta = await fetch("assets/layers/explode/frames.json").then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const exTex = exMeta ? await Promise.all(exMeta.frames.map(async (f) => texOf(await loadImg(`assets/layers/explode/${f.file}`)))) : [];
  const exPlane = new THREE.Mesh(new THREE.PlaneGeometry(PHONE.w, PHONE.h), new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, color: 0xd6dbe6, depthWrite: false }));
  exPlane.position.z = 0.052; exPlane.renderOrder = 9; exPlane.visible = false;
  phone.add(exPlane);

  // ---------- what the laptop says for each feature ----------
  const [iconImg, art, ...pinImgs] = await Promise.all([loadImg("assets/appicon.png"), loadSmileyArt("assets/drsmiley/"),
    ...["cardiology", "oncology", "emergency", "neurology", "pediatrics", "orthopedics", "nephrology", "pulmonology", "dermatology", "hematology", "infusion", "pharmacy", "surgery-anesthesia", "urology", "ophthalmology", "genetics", "laboratory", "endocrinology"].map((p) => loadImg(`assets/pins/${p}.webp`))]);
  // the knowledge brain's real points (tools/capture-kbrain.cjs), for the brain shot's laptop
  const KB = CUT === 60 ? await (await fetch("assets/kbrain.json")).json() : null;
  const smileyPic = document.createElement("canvas"); smileyPic.width = 480; smileyPic.height = 600;
  composeSmiley(smileyPic.getContext("2d"), art, "smile", BROWS.glad);
  const bgFill = () => {
    const gr = sg.createRadialGradient(640, 330, 40, 640, 395, 760);
    gr.addColorStop(0, "#1d3a8f"); gr.addColorStop(0.55, "#0b1640"); gr.addColorStop(1, "#03061a");
    sg.fillStyle = gr; sg.fillRect(0, 0, 1280, 790);
  };
  const txt = (s, x, y, font, color, a = 1, align = "center", glowC) => {
    sg.save(); sg.globalAlpha = a; sg.font = font; sg.textAlign = align; sg.fillStyle = color;
    if (glowC) { sg.shadowColor = glowC; sg.shadowBlur = 30; }
    sg.fillText(s, x, y); sg.restore();
  };
  const pill = (s, x, y, bg, fg, a = 1, font = '800 46px "Inter Tight"') => {
    sg.save(); sg.globalAlpha = a; sg.font = font; const w = sg.measureText(s).width + 56;
    sg.fillStyle = bg; sg.beginPath(); sg.roundRect(x - w / 2, y - 40, w, 62, 31); sg.fill();
    sg.fillStyle = fg; sg.textAlign = "center"; sg.fillText(s, x, y + 6); sg.restore();
  };
  const strike = (x0, x1, y, k, color = "#f0436a") => { if (k <= 0) return; sg.save(); sg.strokeStyle = color; sg.lineWidth = 9; sg.shadowColor = color; sg.shadowBlur = 16; sg.beginPath(); sg.moveTo(x0, y); sg.lineTo(lerp(x0, x1, k), y); sg.stroke(); sg.restore(); };
  const typed = (s, k) => s.slice(0, Math.round(s.length * clamp(k)));
  const ap = (u, a, b) => outCubic(prog(u, a, b));
  const LAPTOP = {
    home(u) {
      bgFill();
      const k = ap(u, 0.1, 0.5), s = 190 * outBack(k, 1.6);
      if (s > 1) { sg.save(); sg.globalAlpha = Math.min(1, k * 1.5); sg.drawImage(iconImg, 640 - s / 2, 250 - s / 2, s, s); sg.restore(); }
      txt("Interpreter Hub", 640, 440, '800 118px "Inter Tight"', "#fff", ap(u, 0.35, 0.7), "center", "rgba(120,200,255,.55)");
      txt(TT("built by our own interpreters, for HUMC"), 640, 520, '500 44px "Inter Tight"', "rgba(255,255,255,.82)", ap(u, 0.6, 0.95));
    },
    glossary(u) {
      bgFill();
      pinImgs.forEach((im, i) => {
        const col = i % 6, row = Math.floor(i / 6), d = Math.hypot(col - 2.5, row - 1);
        const a = ap(u, 0.05 + d * 0.06, 0.4 + d * 0.06), bob = Math.sin(u * 7 - d * 1.4) * 8;
        const s = 118 * a; if (s < 1) return;
        sg.drawImage(im, 260 + col * 152 - s / 2, 150 + row * 150 + bob - s / 2, s, s);
      });
      txt(TT("41 specialties, one glossary"), 640, 690, '800 62px "Inter Tight"', "#fff", ap(u, 0.7, 1.05));
    },
    body(u) {
      bgFill();
      txt("Heart", 640, 330, '800 150px "Inter Tight"', "#fff", ap(u, 0.3, 0.7), "center", "rgba(120,200,255,.5)");
      txt("Corazón", 640, 500, '800 150px "Inter Tight"', "#3fc6ee", ap(u, 1.4, 1.9), "center", "rgba(63,198,238,.7)");
      pill("EN  ·  ES", 640, 640, "#fff", "#0b1a4a", ap(u, 2.0, 2.4));
    },
    translate(u) {
      bgFill();
      txt(typed("Heart Failure", ap(u, 0.1, 0.9)), 640, 300, '800 120px "Inter Tight"', "#fff");
      txt("↓", 640, 420, '800 80px "Inter Tight"', "rgba(255,255,255,.7)", ap(u, 0.95, 1.15));
      txt(TT("insuficiencia cardíaca"), 640, 560, '800 96px "Inter Tight"', "#3fc6ee", ap(u, 1.2, 1.6), "center", "rgba(63,198,238,.7)");
      pill(TT("glossary first. AI second."), 640, 680, "#3fc6ee", "#0b1a4a", ap(u, 1.6, 1.95), '800 40px "Inter Tight"');
    },
    physician(u) {
      bgFill();
      txt("Dr. Elena Marin", 640, 300, '800 112px "Inter Tight"', "#fff", ap(u, 0.1, 0.5));
      txt(TT("hematology / oncology"), 640, 380, '500 50px "Inter Tight"', "rgba(255,255,255,.8)", ap(u, 0.35, 0.7));
      const n = Math.round(9 * ap(u, 0.7, 1.4));
      pill(`${n} ${TT("prep terms ready")}`, 640, 520, "#3fc6ee", "#0b1a4a", ap(u, 0.7, 0.95), '800 52px "Inter Tight"');
      txt(TT("john theurer cancer center"), 640, 650, '500 40px "JetBrains Mono"', "rgba(191,233,250,.85)", ap(u, 1.2, 1.6));
    },
    falsefriends(u) {
      bgFill();
      txt("Constipado", 640, 300, '800 140px "Inter Tight"', "#fff", ap(u, 0.1, 0.5));
      sg.save(); sg.font = '800 140px "Inter Tight"'; const w = sg.measureText("Constipado").width; sg.restore();
      txt(TT("≠ constipated"), 640, 440, '800 84px "Inter Tight"', "#f0436a", ap(u, 0.6, 0.95), "center", "rgba(240,67,106,.6)");
      strike(640 - w / 2, 640 + w / 2, 255, ap(u, 0.95, 1.25));
      pill(TT("= a cold. flagged."), 640, 600, "#f0436a", "#fff", ap(u, 1.3, 1.65), '800 52px "Inter Tight"');
    },
    drills(u) {
      bgFill();
      const words = ["Fue", "Un", "Ingreso", "De", "Urgencia."];
      sg.save(); sg.font = '800 92px "Inter Tight"';
      const ws = words.map((w) => sg.measureText(w + " ").width), tot = ws.reduce((a, b) => a + b, 0);
      sg.restore();
      let x = 640 - tot / 2;
      words.forEach((w, i) => {
        const a = ap(u, 0.1 + i * 0.12, 0.35 + i * 0.12);
        txt(w, x + ws[i] / 2 - 12, 330 - (1 - a) * 30, '800 92px "Inter Tight"', w === "Ingreso" ? "#f0436a" : "#fff", a);
        x += ws[i];
      });
      txt(TT("admission, not income."), 640, 500, '800 78px "Inter Tight"', "#3fc6ee", ap(u, 1.0, 1.4), "center", "rgba(63,198,238,.6)");
      pill(TT("counted"), 640, 640, "#3fc6ee", "#0b1a4a", ap(u, 1.5, 1.8));
    },
    cert(u) {
      // CoreCHI Practice and its five domains, lit one by one (the phone carries the campus)
      bgFill();
      txt("CoreCHI Practice", 560, 250 - (1 - ap(u, 0.05, 0.35)) * 30, '800 76px "Inter Tight"', "#fff", ap(u, 0.05, 0.35));
      const D = ["Terminology", "Ethics", "Encounter", "Culture", "US Systems"];
      D.forEach((d, i) => pill(d, [420, 720, 420, 720, 570][i], 400 + Math.floor(i / 2) * 115, i % 2 ? "#3fc6ee" : "rgba(255,255,255,.92)", "#0b1a4a", ap(u, 0.25 + i * 0.08, 0.45 + i * 0.08), '800 46px "Inter Tight"'));
    },
    team(u) {
      bgFill();
      const bub = (s, x, y, w, bg, fg, a, right) => { if (a <= 0) return; sg.save(); sg.globalAlpha = a; sg.fillStyle = bg; sg.beginPath(); sg.roundRect(right ? x - w : x, y, w, 120, 40); sg.fill(); sg.fillStyle = fg; sg.font = '800 48px "Inter Tight"'; sg.textAlign = right ? "right" : "left"; sg.fillText(s, right ? x - 40 : x + 40, y + 76); sg.restore(); };
      bub(TT("lavado del port. added it to the glossary."), 120, 160 + (1 - ap(u, 0.1, 0.45)) * 30, 1040, "#fff", "#0b1a4a", ap(u, 0.1, 0.45));
      bub(TT("ED is busy. who is free?"), 120, 330 + (1 - ap(u, 0.5, 0.85)) * 30, 760, "rgba(255,255,255,.85)", "#0b1a4a", ap(u, 0.5, 0.85));
      bub(TT("on my way."), 1160, 500 + (1 - ap(u, 0.95, 1.3)) * 30, 460, "#3fc6ee", "#0b1a4a", ap(u, 0.95, 1.3), true);
    },
    notifications(u) {
      // a lock screen: the time, then three of the Hub's notifications dropping in, newest on top
      bgFill();
      txt("9:41", 640, 170, '800 120px "Inter Tight"', "#fff", ap(u, 0.05, 0.35), "center", "rgba(120,200,255,.45)");
      const N = [[TT("team chat · Maria Ruiz"), TT("lavado del port. added it to the glossary.")],
        [TT("new training"), TT("the daily check found a new CE webinar.")],
        [TT("from the team's owners"), TT("the new schedule is posted.")]];
      N.forEach(([h, b], i) => {
        const a = ap(u, 0.35 + i * 0.4, 0.7 + i * 0.4); if (a <= 0) return;
        const y = 250 + i * 160 - (1 - outBack(prog(u, 0.35 + i * 0.4, 0.75 + i * 0.4), 1.4)) * 90;
        sg.save(); sg.globalAlpha = a; sg.fillStyle = "rgba(236,242,252,.94)"; sg.beginPath(); sg.roundRect(170, y, 940, 136, 34); sg.fill();
        sg.drawImage(iconImg, 196, y + 26, 84, 84);
        sg.fillStyle = "#0b1a4a"; sg.textAlign = "left"; sg.font = '800 40px "Inter Tight"'; sg.fillText(h, 304, y + 58);
        sg.fillStyle = "#33405e"; sg.font = '500 36px "Inter Tight"'; sg.fillText(b, 304, y + 104);
        sg.restore();
      });
      pill(TT("even with the hub closed"), 640, 735, "#3fc6ee", "#0b1a4a", ap(u, 1.6, 1.95), '800 42px "Inter Tight"');
    },
    brain(u) {
      // the knowledge brain turning, its terms lighting up one by one: the real page's points
      bgFill();
      if (!KB) return;
      const ang = -0.6 + u * 0.55, ca = Math.cos(ang), sa = Math.sin(ang), K = 205, cx = 640, cy = 350;
      const grow = outExpo(prog(u, 0.05, 0.6));
      sg.save(); sg.globalCompositeOperation = "lighter";
      const P = KB.cortex;
      for (let i = 0; i < P.length; i += 6) {
        const x = P[i] * ca - P[i + 2] * sa, y = P[i + 1];
        sg.fillStyle = `rgb(${P[i + 3] * 420 | 0},${P[i + 4] * 420 | 0},${P[i + 5] * 420 | 0})`;
        sg.fillRect(cx + x * K * grow - 1.5, cy - y * K * grow - 1.5, 3, 3);
      }
      const T = KB.terms, lit = prog(u, 0.55, 1.9), n = T.length / 6;
      for (let j = 0; j < n; j++) {
        const i = j * 6, on = ((j * 61) % n) / n < lit; // a fixed scattered order
        const x = T[i] * ca - T[i + 2] * sa, y = T[i + 1], X = cx + x * K * grow, Y = cy - y * K * grow;
        const r = Math.min(255, T[i + 3] * 255 | 0), g = Math.min(255, T[i + 4] * 255 | 0), b = Math.min(255, T[i + 5] * 255 | 0);
        sg.fillStyle = on ? `rgba(${r},${g},${b},.28)` : "rgba(90,110,170,.25)";
        sg.beginPath(); sg.arc(X, Y, on ? 16 : 5, 0, 7); sg.fill();
        if (on) { sg.fillStyle = `rgb(${r},${g},${b})`; sg.beginPath(); sg.arc(X, Y, 5.5, 0, 7); sg.fill(); }
      }
      sg.restore();
      const k = Math.round(171 * outCubic(prog(u, 0.55, 1.9)));
      pill(`${k} ${TT("of 328 known")}`, 640, 735, "#3fc6ee", "#0b1a4a", ap(u, 0.5, 0.8), '800 46px "Inter Tight"');
    },
    ask(u) {
      bgFill();
      const a = ap(u, 0.1, 0.5), h = 260 * outBack(a, 1.8);
      if (h > 1) sg.drawImage(smileyPic, 640 - (h * 0.8) / 2, 300 - h, h * 0.8, h);
      txt(TT("tu repaso de oncology está listo."), 640, 410, '800 54px "Inter Tight"', "#fff", ap(u, 0.5, 0.9));
      pill(TT("10 words · traps · the appointment timer"), 640, 540, "rgba(255,255,255,.92)", "#0b1a4a", ap(u, 0.9, 1.25), '800 38px "Inter Tight"');
      pill(TT("open the oncology briefing"), 640, 650, "#3fc6ee", "#0b1a4a", ap(u, 1.3, 1.6), '800 42px "Inter Tight"');
    },
  };
  let drawnKey = "";
  function drawLaptop(g, u) {
    const key = g + "|" + Math.round(u * 30);
    if (key === drawnKey) return;
    drawnKey = key;
    sg.clearRect(0, 0, 1280, 790);
    (LAPTOP[g] || bgFill)(u);
    scrTex.needsUpdate = true;
  }

  // ---------- Dr. Smiley's poses (the overlay draws him) ----------
  const smiley = { group: { visible: false, position: new THREE.Vector3() }, lastPose: null, pose(p) { this.lastPose = p; } };
  const POSE = {
    home: (u) => (u < 1.2 ? MOVES.wave(u / 1.2) : { face: "smile", brows: "glad" }),
    glossary: (u) => (u > 0.5 && u < 1.6 ? { face: "surprised", brows: "up" } : { face: "smile", brows: "glad" }),
    body: (u) => (u > 0.4 && u < 1.6 ? { face: "surprised", brows: "up" } : { face: "smile", brows: "glad" }),
    translate: (u) => (u < 1.0 ? MOVES.type(u) : { ...MOVES.point(prog(u, 1.0, 1.5)), face: "smile" }),
    physician: (u) => ({ face: u < 1 ? "halfR" : "smile", brows: "glad" }),
    falsefriends: (u) => (u > 0.95 ? { face: "worried", brows: "worried" } : { face: "doubt", brows: "doubt" }),
    drills: (u) => (u > 1.0 ? { face: "laugh", brows: "laugh", ...(u < 1.5 ? MOVES.land(prog(u, 1.0, 1.5)) : {}) } : { face: "lookUR", brows: "focused" }),
    cert: (u) => (u < 0.9 ? { face: "lookUR", brows: "up" } : u < 2.0 ? { face: "surprised", brows: "up" } : { ...MOVES.point(prog(u, 2.0, 2.5)), face: "smile", brows: "glad" }),
    team: (u) => ({ face: u % 1.4 < 0.9 ? "laugh" : "smile", brows: "laugh" }),
    notifications: (u) => (u < 0.4 ? { face: "lookUR", brows: "up" } : u < 1.4 ? { face: "surprised", brows: "up" } : { face: "smile", brows: "glad" }),
    brain: (u) => (u < 0.6 ? { face: "lookUR", brows: "focused" } : { face: u < 1.8 ? "surprised" : "laugh", brows: u < 1.8 ? "up" : "laugh" }),
    // out of the screen, then thinking (his AI brain lights up: main.js), then the wave
    ask: (u) => (u < 1.0 ? MOVES.stepOut(prog(u, 0.05, 1.0)) : u < 2.1 ? { face: "lookUR", brows: "up" } : MOVES.wave(prog(u, 2.1, 3.0))),
  };

  // ---------- each feature at u seconds in ----------
  let active = null;
  function update(g, u) {
    if (!SCREEN_OF[g]) return;
    const S = screens[SCREEN_OF[g]];
    if (active !== S) { for (const k in screens) screens[k].g.visible = false; S.g.visible = true; active = S; }
    windowView.material.map = photos[WINDOW_OF[g]]; windowView.material.needsUpdate = true;
    for (const k in S.layers) { const L = S.layers[k]; L.pivot.position.z = 0.002 + L.l.depth * 0.001; L.pivot.scale.setScalar(1); }
    // the proof pops forward with its cyan outline, on the beat after the shot settles
    const P = S.layers[S.proofKey];
    const pop = g === EXPLODE_IN ? 0 : g === "cert" ? outBack(prog(u, 0.1, 0.45), 1.6) * (1 - prog(u, 0.55, 0.8)) : outBack(prog(u, 0.55, 1.0), 1.6);
    outline.visible = false;
    if (P) {
      P.pivot.position.z = 0.002 + 0.16 * pop;
      P.pivot.scale.setScalar(1 + 0.16 * pop);
      outline.visible = pop > 0.02;
      outline.position.set(P.pivot.position.x, P.pivot.position.y, P.pivot.position.z + 0.004);
      outline.scale.set(P.w * P.pivot.scale.x + 0.05, P.h * P.pivot.scale.y + 0.05, 1);
      outline.material.opacity = Math.min(1, pop);
    }
    // the 3D Body: the real viewer coming apart on the phone, then the heart and its card
    exPlane.visible = g === EXPLODE_IN && exTex.length > 0 && u < 1.85;
    if (exPlane.visible) {
      const k = Math.min(exTex.length - 1, Math.floor(prog(u, 0.55, 1.5) * exTex.length));
      if (exPlane.material.map !== exTex[k]) { exPlane.material.map = exTex[k]; exPlane.material.needsUpdate = true; }
      exPlane.material.opacity = 1 - prog(u, 1.5, 1.85);
      if (P) { const pp = outBack(prog(u, 1.9, 2.35), 1.6); P.pivot.position.z = 0.002 + 0.16 * pp; P.pivot.scale.setScalar(1 + 0.16 * pp); outline.visible = pp > 0.02; outline.material.opacity = Math.min(1, pp); }
    }
    if (g === EXPLODE_IN && P && u >= 1.9) { const pp = outBack(prog(u, 1.9, 2.35), 1.6); P.pivot.position.z = 0.002 + 0.16 * pp; P.pivot.scale.setScalar(1 + 0.16 * pp); outline.visible = pp > 0.02; outline.material.opacity = Math.min(1, pp); outline.position.z = P.pivot.position.z + 0.004; outline.scale.set(P.w * P.pivot.scale.x + 0.05, P.h * P.pivot.scale.y + 0.05, 1); }
    drawLaptop(g, u);
    smiley.group.visible = true;
    smiley.pose(POSE[g] ? POSE[g](u) : { face: "smile", brows: "glad" });
  }

  // cameras: the desk framed like the first reel, each feature a slightly different, slowly moving angle
  const ANG = { home: -6, glossary: 5, body: -3, translate: 6, physician: -5, falsefriends: 4, drills: -4, cert: 6, team: -6, notifications: 5, brain: -4, ask: 3 };
  function view(g, u) {
    const len = featureLen(FEATURES.find((f) => f.g === g) || { len: 2.5 });
    const e = inOutSine(clamp(u / len)), a = THREE.MathUtils.degToRad((ANG[g] || 0) + lerp(-2, 2, e));
    // both screens whole in a portrait frame: the laptop's headline and the phone in front of it
    const look = new THREE.Vector3(0.05, 1.2, 0.2).add(desk.position);
    const r = lerp(7.9, 7.4, e);
    const pos = new THREE.Vector3(Math.sin(a) * r + 0.05, lerp(2.05, 1.9, e), Math.cos(a) * r + 0.2).add(desk.position);
    // focus on the phone, where the proof is
    const focus = phone.getWorldPosition(new THREE.Vector3());
    if (g === "cert") {
      // CoreCHI: the camera pushes into the phone, square onto the campus picture in the card,
      // close enough that it fills the frame's width; the city layer (city.js) takes it from there
      // it starts close on the phone (the doorway photo covers the first 0.7 s, doorway.js) and finishes the push
      const w = lerp(0.72, 1, inOutCubic(prog(u, 0.3, 0.98)));
      if (w > 0) {
        phone.updateWorldMatrix(true, false);
        const at = new THREE.Vector3(WORLD.cx, WORLD.cy, 0.05).applyMatrix4(phone.matrixWorld);
        const nrm = new THREE.Vector3(0, 0, 1).transformDirection(phone.matrixWorld);
        const d = (WORLD.w / 0.92) / (2 * Math.tan(THREE.MathUtils.degToRad(25)) * 0.5625);
        pos.lerp(at.clone().addScaledVector(nrm, d), w);
        look.lerp(at, w);
        focus.lerp(at, w);
      }
    }
    return { pos, look, focus };
  }
  // where the campus picture sits in the CoreCHI card, in phone units, and on screen
  const WL = screens.cert.layers.world.l;
  const WORLD = { cx: (WL.x + WL.w / 2) * PX - PHONE.w / 2, cy: PHONE.h / 2 - (WL.y + WL.h / 2) * PX, w: WL.w * PX, h: WL.h * PX };
  function worldRect(camera, W, H) {
    phone.updateWorldMatrix(true, false);
    const v = new THREE.Vector3();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      v.set(WORLD.cx + x * WORLD.w / 2, WORLD.cy + y * WORLD.h / 2, 0.05).applyMatrix4(phone.matrixWorld).project(camera);
      const px = (v.x + 1) / 2 * W, py = (1 - v.y) / 2 * H;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  const idleSpot = (g) => desk.position.clone();
  const idle = (g, u) => update(g, u);
  // the proof's picture, cropped to the element (hero.js shows it big)
  const proofArt = (g) => {
    const S = screens[SCREEN_OF[g]], P = S && S.proofKey && S.layers[S.proofKey];
    if (!P) return null;
    const img = P.mesh.material.map.image, l = P.l, c = l.clip, k = img.width / c.width;
    return { img, sx: (l.x - c.x) * k, sy: (l.y - c.y) * k, sw: l.w * k, sh: l.h * k };
  };
  // the body coming apart, one captured frame (i may be fractional: the next frame mixes in), cropped to the viewer
  const explodeArt = (i) => {
    if (!exTex.length) return null;
    const a = Math.max(0, Math.min(exTex.length - 1, Math.floor(i))), b = Math.min(exTex.length - 1, a + 1), img = exTex[a].image, k = img.width / 780;
    return { img, sx: 0, sy: 240 * k, sw: 780 * k, sh: 1240 * k, next: exTex[b].image, mix: i - a };
  };
  const proofMesh = (g) => { const S = screens[SCREEN_OF[g]]; return S && S.proofKey ? S.layers[S.proofKey].mesh : null; };
  // the whole phone screen on screen (for the "no dark or empty screen" check)
  function screenRect(camera, W, H) {
    phone.updateWorldMatrix(true, false);
    const v = new THREE.Vector3(), pts = [];
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      v.set(x * PHONE.w / 2, y * PHONE.h / 2, 0.05).applyMatrix4(phone.matrixWorld).project(camera);
      pts.push([(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]);
    }
    return pts;
  }
  return { update, view, smiley, idle, idleSpot, proofMesh, proofArt, explodeArt, desk, worldRect, screenRect };
}
