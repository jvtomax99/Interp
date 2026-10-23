// Opening bar: HUMC photos as floating cards in the navy void, camera flies into the hospital.
import * as THREE from "three";
import { C } from "./config.js";
import { clamp, lerp, prog, outExpo, outCubic, inExpo, inOutSine } from "./util.js";

function loadImage(src) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
}

function rounded(img, r = 26) {
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const x = c.getContext("2d");
  x.beginPath(); x.roundRect(0, 0, c.width, c.height, r); x.clip();
  x.drawImage(img, 0, 0);
  // cool grade so warm photos sit in the navy palette
  x.globalCompositeOperation = "soft-light";
  x.fillStyle = "rgba(40,80,200,0.55)";
  x.fillRect(0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function textTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, redraw: (...a) => { ctx.clearRect(0, 0, w, h); draw(ctx, ...a); tex.needsUpdate = true; } };
}

export async function createOpener(W, H, OPEN) {
  const [sky, pav, ent] = await Promise.all([
    loadImage("assets/humc/skybridge-sunset.jpg"),
    loadImage("assets/humc/pavilion-dusk.jpg"),
    loadImage("assets/humc/entrance.jpg"),
  ]);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050b26, 3.5, 9);
  const cam = new THREE.PerspectiveCamera(50, W / H, 0.05, 50);

  const bg = document.createElement("canvas");
  bg.width = 64; bg.height = 114;
  const bx = bg.getContext("2d");
  const g = bx.createRadialGradient(32, 50, 2, 32, 57, 70);
  g.addColorStop(0, "#14275f"); g.addColorStop(1, C.navy0);
  bx.fillStyle = g; bx.fillRect(0, 0, 64, 114);
  scene.background = new THREE.CanvasTexture(bg);
  scene.background.colorSpace = THREE.SRGBColorSpace;

  const card = (img, w, pos, ry, rz = 0) => {
    const h = w * (img.height / img.width);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: rounded(img), transparent: true, toneMapped: false, side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.rotation.set(0, ry, rz);
    m.userData.base = m.position.clone();
    scene.add(m);
    return m;
  };
  const back1 = card(pav, 1.12, [-0.2, 0.92, -0.9], 0.22, 0.03);
  const back2 = card(ent, 1.25, [0.16, -0.92, -0.7], -0.2, -0.02);
  const front = card(sky, 1.05, [0.05, 0.0, 0], 0.08, -0.015);

  const label = textTex(1400, 220, (ctx, n1, n2) => {
    ctx.font = '500 52px "JetBrains Mono"';
    ctx.letterSpacing = "10px";
    ctx.fillStyle = C.cyan;
    ctx.shadowColor = C.cyan; ctx.shadowBlur = 16;
    ctx.fillText("HACKENSACK UNIVERSITY".slice(0, n1), 10, 80);
    ctx.fillText("MEDICAL CENTER".slice(0, n2), 10, 160);
  });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(1400 / 1050, 220 / 1050),
    new THREE.MeshBasicMaterial({ map: label.tex, transparent: true, depthWrite: false, toneMapped: false }));
  lab.position.set(0.0, -1.42, 0.15);
  lab.rotation.y = 0.05;
  scene.add(lab);

  return {
    render(renderer, t) {
      const n1 = Math.floor(21 * prog(t, 0.25, 0.85));
      const n2 = Math.floor(14 * prog(t, 0.6, 1.1));
      label.redraw(n1, n2);
      // gentle drift on the cards
      for (const [m, k] of [[front, 0], [back1, 1], [back2, 2]]) {
        m.position.y = m.userData.base.y + Math.sin(t * 1.3 + k) * 0.03;
        m.material.opacity = clamp(prog(t, 0.05 + k * 0.12, 0.45 + k * 0.12) * 1.2);
      }
      const p = inOutSine(prog(t, 0, OPEN - 0.45));
      const fly = inExpo(prog(t, OPEN - 0.5, OPEN));
      cam.position.set(lerp(0.4, 0.1, p), lerp(-0.2, 0.05, p), lerp(4.6, 3.7, p) - fly * 3.6);
      cam.up.set(lerp(0.06, -0.02, p), 1, 0).normalize();
      cam.lookAt(lerp(-0.05, 0.05, p), lerp(0.2, 0.05, p), -0.5);
      renderer.setRenderTarget(null);
      renderer.autoClear = true;
      renderer.render(scene, cam);
    },
  };
}
