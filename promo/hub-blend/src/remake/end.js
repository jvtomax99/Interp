// The end card (BRIEF.md shot 11), after the motionloved laptop reel: a
// laptop and a phone on a glossy table in the dark, the laptop's screen the
// main light. Its colour reaches the keys, the table and the reflection, and
// the end-card lines arrive on the screen one beat at a time.
import * as THREE from "three";
import { Reflector } from "../../vendor/Reflector.js";
import { RoundedBoxGeometry } from "../../vendor/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "../../vendor/RectAreaLightUniformsLib.js";
import { clamp, lerp, prog, outBack, outExpo, outCubic, inOutSine } from "../util.js";
import { loadSmileyArt, composeSmiley, BROWS } from "../smiley.js";

const LID_W = 3.3, LID_H = 2.1, SCR_W = 3.08, SCR_H = 1.9;

export async function buildEnd(scene, group, { start }) {
  RectAreaLightUniformsLib.init();
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const [art, homeImg, viewImg] = await Promise.all([loadSmileyArt("assets/drsmiley/"), loadImg("assets/layers/home/full.webp"), loadImg("assets/humc/skybridge-sunset.jpg")]);
  // Dr. Smiley whole, brows included, smiling: drawn once, then placed on the screen
  const smileyImg = document.createElement("canvas"); smileyImg.width = 480; smileyImg.height = 600;
  composeSmiley(smileyImg.getContext("2d"), art, "smile", BROWS.glad);

  // the window behind the table: HUMC's skybridge at sunset, a little soft, split by mullions
  const wc = document.createElement("canvas"); wc.width = 1024; wc.height = 1024;
  const wg = wc.getContext("2d");
  wg.filter = "blur(1.2px) saturate(1.08)"; wg.drawImage(viewImg, 0, 0, 1024, 1024); wg.filter = "none";
  wg.fillStyle = "rgba(4,7,18,0.18)"; wg.fillRect(0, 0, 1024, 1024);
  wg.fillStyle = "#06080f";
  for (const x of [0, 470, 1014]) wg.fillRect(x - 6, 0, 16, 1024); // mullions clear of the sign
  wg.fillRect(0, 1008, 1024, 16);
  const winTex = new THREE.CanvasTexture(wc); winTex.colorSpace = THREE.SRGBColorSpace;
  const windowView = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 9.6), new THREE.MeshBasicMaterial({ map: winTex, toneMapped: false, color: 0xd8d2d2 }));
  windowView.position.set(2.0, 2.9, -4.6);
  group.add(windowView);
  // the sunset's warm light coming in through it, onto the table and the laptop's back
  const sunset = new THREE.RectAreaLight(0xff9a6a, 0.9, 9, 4);
  sunset.position.set(-0.4, 2.0, -4.4);
  sunset.lookAt(-0.4, 0, 0);
  group.add(sunset);

  // the table: a mirror, dimmed by a dark sheet so the reflection fades like lacquer
  const mirror = new Reflector(new THREE.PlaneGeometry(14, 10), { textureWidth: 540, textureHeight: 960, color: 0x7a8296, clipBias: 0.003 });
  mirror.rotation.x = -Math.PI / 2;
  group.add(mirror);
  const lacquer = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshStandardMaterial({ color: 0x05070f, roughness: 0.22, metalness: 0.4, transparent: true, opacity: 0.62 }));
  lacquer.rotation.x = -Math.PI / 2;
  lacquer.position.y = 0.002;
  lacquer.receiveShadow = true;
  group.add(lacquer);

  // the laptop
  const laptop = new THREE.Group();
  const alu = new THREE.MeshStandardMaterial({ color: 0x2a2f3c, roughness: 0.38, metalness: 0.85 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(LID_W, 0.1, 2.25, 4, 0.05), alu);
  base.position.y = 0.05;
  base.castShadow = true;
  const kc = document.createElement("canvas"); kc.width = 1024; kc.height = 440;
  const kg = kc.getContext("2d");
  kg.fillStyle = "#0c0f18"; kg.fillRect(0, 0, 1024, 440);
  kg.fillStyle = "#1b2030";
  for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) { kg.beginPath(); kg.roundRect(18 + c * 71, 14 + r * 70, 62, 60, 8); kg.fill(); }
  kg.beginPath(); kg.roundRect(300, 370, 424, 60, 8); kg.fill();
  const keyTex = new THREE.CanvasTexture(kc); keyTex.colorSpace = THREE.SRGBColorSpace;
  const keys = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.29), new THREE.MeshStandardMaterial({ map: keyTex, roughness: 0.6, metalness: 0.2 }));
  keys.rotation.x = -Math.PI / 2;
  keys.position.set(0, 0.102, -0.25);
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.6), new THREE.MeshStandardMaterial({ color: 0x232838, roughness: 0.35, metalness: 0.6 }));
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, 0.102, 0.72);
  laptop.add(base, keys, pad);
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.1, -1.1);
  laptop.add(hinge);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(LID_W, LID_H, 0.06, 4, 0.03), alu);
  lid.position.set(0, LID_H / 2, -0.03);
  lid.castShadow = true;
  hinge.add(lid);
  // the screen, drawn on a canvas every frame
  const sc = document.createElement("canvas"); sc.width = 1280; sc.height = 790;
  const sg = sc.getContext("2d");
  const scrTex = new THREE.CanvasTexture(sc); scrTex.colorSpace = THREE.SRGBColorSpace; scrTex.anisotropy = 8;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCR_W, SCR_H), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false }));
  screen.position.set(0, LID_H / 2 + 0.03, 0.002);
  hinge.add(screen);
  // the light the screen throws: a panel light of the screen's own colour
  const glow = new THREE.RectAreaLight(0x3fc6ee, 6, SCR_W, SCR_H);
  glow.position.set(0, LID_H / 2 + 0.03, 0.05);
  hinge.add(glow);
  hinge.rotation.x = -0.32; // open a little past upright, toward the back
  laptop.position.set(-0.25, 0, 0);
  group.add(laptop);

  // the phone beside it, propped up, showing Home
  const phone = new THREE.Group();
  const pbody = new THREE.Mesh(new RoundedBoxGeometry(0.98, 2.05, 0.08, 6, 0.1), new THREE.MeshStandardMaterial({ color: 0x10152c, roughness: 0.3, metalness: 0.75 }));
  pbody.castShadow = true;
  const ht = new THREE.Texture(homeImg); ht.colorSpace = THREE.SRGBColorSpace; ht.needsUpdate = true;
  const pscr = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.95), new THREE.MeshBasicMaterial({ map: ht, toneMapped: false, color: 0xb6bed2 }));
  pscr.position.z = 0.042;
  phone.add(pbody, pscr);
  phone.position.set(1.85, 1.0, 0.55);
  phone.rotation.set(-0.18, -0.45, 0);
  group.add(phone);
  const phoneGlow = new THREE.PointLight(0xcfe2ff, 2.2, 3, 1.5);
  phoneGlow.position.set(1.6, 0.5, 1.0);
  group.add(phoneGlow);

  // ---------- the screen's content over time (u = seconds into the shot) ----------
  const LINES = [
    { t: 0.25, draw: (a) => drawSmiley(a) },
    { t: 0.45, draw: (a) => text("Interpreter Hub", 640, 345, '800 122px "Inter Tight"', "#fff", a, true) },
    { t: 0.75, draw: (a) => text("Built Here, For Our Patients.", 640, 408, '500 48px "Inter Tight"', "rgba(255,255,255,.85)", a) },
    { t: 1.05, draw: (a) => urlPill(a) },
    { t: 1.3, draw: (a) => text("Live Today, On Any Phone.", 640, 536, '500 36px "Inter Tight"', "rgba(255,255,255,.7)", a) },
    { t: 1.75, draw: (a) => text("Better Words.", 640, 628, '800 80px "Inter Tight"', "#fff", a) },
  ];
  let drawnKey = "";
  function text(s, x, y, font, color, a, glowText) {
    sg.save(); sg.globalAlpha = a; sg.font = font; sg.textAlign = "center"; sg.fillStyle = color;
    if (glowText) { sg.shadowColor = "rgba(120,200,255,.55)"; sg.shadowBlur = 40; }
    sg.fillText(s, x, y + (1 - a) * 22); sg.restore();
  }
  function drawSmiley(a) {
    const h = 205 * outBack(a, 2), w = (h * 480) / 600;
    if (h <= 1) return;
    sg.save(); sg.globalAlpha = Math.min(1, a * 1.6);
    sg.drawImage(smileyImg, 640 - w / 2, 238 - h, w, h); sg.restore();
  }
  function urlPill(a) {
    sg.save(); sg.globalAlpha = a;
    sg.fillStyle = "#fff"; sg.beginPath(); sg.roundRect(640 - 260, 434, 520, 62, 31); sg.fill();
    sg.font = '500 36px "JetBrains Mono"'; sg.fillStyle = "#0b1a4a"; sg.textAlign = "center"; sg.fillText("interp-six.vercel.app", 640, 477);
    sg.restore();
  }
  function drawScreen(u) {
    // the first beat flashes the screen cyan, so its light visibly sweeps the table, then it settles navy
    const flash = 1 - outCubic(prog(u, 0.05, 0.6));
    const wipe = outExpo(prog(u, 2.05, 2.4));
    const key = [flash.toFixed(2), wipe.toFixed(2), ...LINES.map((l) => outCubic(prog(u, l.t, l.t + 0.35)).toFixed(2))].join();
    if (key === drawnKey) return;
    drawnKey = key;
    const gr = sg.createRadialGradient(640, 330, 40, 640, 395, 760);
    gr.addColorStop(0, "#1d3a8f"); gr.addColorStop(0.55, "#0b1640"); gr.addColorStop(1, "#03061a");
    sg.fillStyle = gr; sg.fillRect(0, 0, 1280, 790);
    if (flash > 0) { sg.fillStyle = `rgba(63,198,238,${flash})`; sg.fillRect(0, 0, 1280, 790); }
    for (const l of LINES) { const a = outCubic(prog(u, l.t, l.t + 0.35)); if (a > 0) l.draw(a); }
    // "Safer care." on v11's cyan box, wiped in
    if (wipe > 0) {
      sg.save(); sg.beginPath(); sg.rect(640 - 225, 648, 450 * wipe, 96); sg.clip();
      sg.fillStyle = "#3fc6ee"; sg.beginPath(); sg.roundRect(640 - 225, 648, 450, 96, 12); sg.fill();
      sg.font = '800 80px "Inter Tight"'; sg.fillStyle = "#0b1a4a"; sg.textAlign = "center"; sg.fillText("Safer Care.", 640, 722);
      sg.restore();
    }
    scrTex.needsUpdate = true;
  }

  function update(u) {
    drawScreen(u);
    const flash = 1 - outCubic(prog(u, 0.05, 0.6));
    // the panel light takes the screen's colour: bright cyan on the flash, deep blue after
    glow.color.setRGB(lerp(0.2, 0.25, flash), lerp(0.38, 0.78, flash), lerp(0.85, 0.93, flash));
    glow.intensity = lerp(7, 22, flash);
    // the lid opens the last few degrees as we arrive
    hinge.rotation.x = lerp(-0.05, -0.32, outBack(prog(u, 0, 0.6), 1.2));
  }
  function view(u) {
    const e = inOutSine(clamp(u / 4));
    const o = group.position;
    return {
      pos: new THREE.Vector3(o.x + lerp(1.1, 0.15, e), lerp(2.6, 2.0, e), o.z + lerp(8.2, 6.4, e)),
      look: new THREE.Vector3(o.x + lerp(0.2, 0.15, e), lerp(1.15, 1.25, e), o.z - 1.2),
      focus: new THREE.Vector3(o.x - 0.25, 1.2, o.z - 1.0),
    };
  }
  return { update, view };
}
