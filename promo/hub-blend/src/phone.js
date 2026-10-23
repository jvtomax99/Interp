// The phone: model, real app screens from v11, exploding UI layers, icon disc with holo rings, Dr. Smiley.
import * as THREE from "three";
import { RoundedBoxGeometry } from "../vendor/RoundedBoxGeometry.js";
import { C } from "./config.js";
import { clamp, lerp, prog, outExpo, outBack, inOutCubic, outCubic } from "./util.js";

export const PW = 0.8, PH = 0.8 / (640 / 1260) + 0.13, PD = 0.07;
const SW = 0.74, SHt = SW * (1260 / 640);

function loadImage(src) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
}

function roundedAlpha(w, h, r) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d");
  x.fillStyle = "#000"; x.fillRect(0, 0, w, h);
  x.fillStyle = "#fff";
  x.beginPath(); x.roundRect(0, 0, w, h, r); x.fill();
  return new THREE.CanvasTexture(c);
}

function bandGeometry(v0, v1) {
  // plane covering screen rows v0..v1 (0 = top) with matching UVs
  const h = (v1 - v0) * SHt;
  const g = new THREE.PlaneGeometry(SW, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) > 0.5 ? 1 - v0 : 1 - v1);
  g.translate(0, SHt / 2 - (v0 + v1) / 2 * SHt, 0);
  return g;
}

export async function createPhone(names) {
  const imgs = {};
  await Promise.all(names.map(async (n) => { imgs[n] = await loadImage(`assets/screens/${n}.png`); }));
  const iconImg = await loadImage("assets/appicon.png");
  const smileyImg = await loadImage("assets/drsmiley.png");

  const texs = {};
  for (const n of names) {
    const t = new THREE.Texture(imgs[n]);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true;
    texs[n] = t;
  }
  // splash screen: navy with icon
  const sc = document.createElement("canvas");
  sc.width = 640; sc.height = 1260;
  const sx = sc.getContext("2d");
  const sg = sx.createLinearGradient(0, 0, 0, 1260);
  sg.addColorStop(0, "#0d1d56"); sg.addColorStop(1, "#050a24");
  sx.fillStyle = sg; sx.fillRect(0, 0, 640, 1260);
  const splash = new THREE.CanvasTexture(sc);
  splash.colorSpace = THREE.SRGBColorSpace;
  texs.splash = splash;

  const outer = new THREE.Group();   // pivot at the phone's bottom edge
  const body = new THREE.Group();
  body.position.y = PH / 2;
  outer.add(body);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0xc9ccd2, roughness: 0.22, metalness: 1.0 });
  const shell = new THREE.Mesh(new RoundedBoxGeometry(PW, PH, PD, 6, 0.1), frameMat);
  body.add(shell);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.08, metalness: 0 });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.03, PH - 0.03), glassMat);
  glass.position.z = PD / 2 + 0.0005;
  body.add(glass);

  const alpha = roundedAlpha(256, 504, 34);
  const screenMat = new THREE.MeshBasicMaterial({ map: texs.splash, alphaMap: alpha, transparent: true, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SHt), screenMat);
  screen.position.z = PD / 2 + 0.002;
  body.add(screen);

  // exploding bands
  const BANDS = [[0, 0.12, 0.17], [0.12, 0.5, 0.32], [0.5, 0.84, 0.23], [0.84, 1.0, 0.12]];
  const bands = BANDS.map(([a, b, lift]) => {
    const m = new THREE.MeshBasicMaterial({ map: texs.splash, transparent: true, toneMapped: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(bandGeometry(a, b), m);
    mesh.position.z = PD / 2 + 0.003;
    mesh.userData.lift = lift;
    mesh.visible = false;
    body.add(mesh);
    return mesh;
  });

  // screen light onto the table
  const glow = new THREE.RectAreaLight(0xbfd8ff, 2.0, SW, SHt);
  glow.position.z = PD / 2 + 0.02;
  glow.rotation.y = Math.PI;
  body.add(glow);

  // icon disc + holo rings
  const ic = document.createElement("canvas");
  ic.width = ic.height = 256;
  ic.getContext("2d").drawImage(iconImg, 0, 0, 256, 256);
  const iconTex = new THREE.CanvasTexture(ic);
  iconTex.colorSpace = THREE.SRGBColorSpace;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 64), [
    new THREE.MeshStandardMaterial({ color: 0x9fdcf3, metalness: 0.9, roughness: 0.25 }),
    new THREE.MeshBasicMaterial({ map: iconTex, toneMapped: false }),
    new THREE.MeshBasicMaterial({ color: 0x0b1a4a }),
  ]);
  disc.rotation.x = Math.PI / 2;
  const discG = new THREE.Group();
  discG.add(disc);
  body.add(discG);
  const rc = document.createElement("canvas");
  rc.width = rc.height = 256;
  const rx = rc.getContext("2d");
  rx.strokeStyle = C.cyan; rx.lineWidth = 9; rx.shadowColor = C.cyan; rx.shadowBlur = 18;
  rx.beginPath(); rx.arc(128, 128, 110, 0, Math.PI * 2); rx.stroke();
  const ringTex = new THREE.CanvasTexture(rc);
  ringTex.colorSpace = THREE.SRGBColorSpace;
  const rings = [0, 1, 2, 3].map(() => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95),
      new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    body.add(m);
    return m;
  });

  // Dr. Smiley billboard (fade the cropped chest edge)
  const dc = document.createElement("canvas");
  dc.width = smileyImg.width; dc.height = smileyImg.height;
  const dx = dc.getContext("2d");
  dx.drawImage(smileyImg, 0, 0);
  dx.globalCompositeOperation = "destination-out";
  const fg = dx.createLinearGradient(0, dc.height * 0.8, 0, dc.height);
  fg.addColorStop(0, "rgba(0,0,0,0)"); fg.addColorStop(1, "rgba(0,0,0,1)");
  dx.fillStyle = fg; dx.fillRect(0, 0, dc.width, dc.height);
  const smTex = new THREE.CanvasTexture(dc);
  smTex.colorSpace = THREE.SRGBColorSpace;
  const smH = 0.95, smW = smH * (dc.width / dc.height);
  const smGeo = new THREE.PlaneGeometry(smW, smH);
  smGeo.translate(0, smH / 2, 0);
  const smiley = new THREE.Mesh(smGeo, new THREE.MeshBasicMaterial({ map: smTex, transparent: true, toneMapped: false, depthWrite: false }));
  smiley.visible = false;

  let current = "splash";
  function setScreen(name) {
    if (name === current) return;
    current = name;
    screenMat.map = texs[name];
    for (const b of bands) b.material.map = texs[name];
    screenMat.needsUpdate = true;
    for (const b of bands) b.material.needsUpdate = true;
  }

  return {
    outer, body, smiley, glow, setScreen, iconImg, smileyImg,
    // lift: 0..1 exploded amount
    explode(lift, t) {
      const on = lift > 0.002;
      for (let i = 0; i < bands.length; i++) {
        const b = bands[i];
        b.visible = on;
        b.position.z = PD / 2 + 0.003 + b.userData.lift * lift;
        b.position.x = (i % 2 ? 0.04 : -0.04) * lift;
        b.rotation.y = (i % 2 ? -0.12 : 0.12) * lift;
        b.rotation.x = 0.06 * lift;
      }
      screenMat.color.setScalar(on ? lerp(1, 0.25, clamp(lift * 2)) : 1);
    },
    icon(p, ringP, t) {
      // p: 0 hidden -> 1 fully risen; ringP: ring expansion phase
      discG.visible = p > 0.002;
      discG.position.set(0, 0.05, PD / 2 + 0.02 + 0.42 * p);
      discG.scale.setScalar(Math.max(0.001, lerp(0.6, 1, p)));
      discG.rotation.set(0, Math.sin(t * 3) * 0.25 * p, Math.sin(t * 2) * 0.1);
      rings.forEach((r, i) => {
        const k = clamp(ringP * 1.2 - i * 0.18);
        r.visible = ringP > 0.002 && k > 0;
        r.position.set(0, 0.05, PD / 2 + 0.01 + 0.16 * i * k);
        r.scale.setScalar(lerp(0.4, 0.75 + i * 0.16, outCubic(k)));
        r.material.opacity = (1 - i * 0.18) * Math.min(1, k * 3) * (1 - prog(ringP, 0.85, 1));
      });
    },
  };
}
