// Director: act 1 (void type) then the table scene (laptop + phone), cut to v11's track.
import * as THREE from "three";
import { Reflector } from "../vendor/Reflector.js";
import { RoundedBoxGeometry } from "../vendor/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "../vendor/RectAreaLightUniformsLib.js";
import { RoomEnvironment } from "../vendor/RoomEnvironment.js";
import { C, COPY, DURATION, OPEN, T } from "./config.js";
import { drawScreen, SW, SH, setIcon, setPhotos } from "./screen2d.js";
import { createCubes } from "./cubes.js";
import { createVoid } from "./void.js";
import { createPhone } from "./phone.js";
import { createOpener } from "./opener.js";
import { clamp, lerp, prog, outCubic, outBack, outExpo, inOutCubic, inOutSine, roundRect } from "./util.js";

const W = 1080, H = 1920;
const Q = new URLSearchParams(location.search);

// table-scene camera keys: [time, pos, look]
const KEYS = JSON.parse(Q.get("keys") || "null") || [
  [8.0, [0.0, 1.5, 5.0], [0.85, 1.15, 2.2]],
  [9.6, [0.25, 1.0, 3.9], [0.85, 0.92, 2.2]],
  [10.6, [0.3, 0.98, 3.65], [0.85, 0.92, 2.2]],
  [12.0, [-0.5, 1.6, 6.2], [0.3, 0.88, 0.5]],
  [22.0, [-0.4, 1.55, 6.0], [0.3, 0.88, 0.5]],
  [29.0, [-0.3, 1.5, 5.8], [0.3, 0.88, 0.5]],
];
const PHONE_AT = Object.assign({ x: 0.85, z: 2.2, ry: -0.35, lean: -0.1 }, JSON.parse(Q.get("phone") || "{}"));

const CAPTIONS = [
  { t0: 10.95, t1: T.features[0], a: COPY.built[0], b: COPY.built[1] },
  ...COPY.features.map((f, i) => ({ t0: T.features[i] + 0.05, t1: i < 4 ? T.features[i + 1] : T.featEnd, a: f.a, b: f.b })),
  { t0: 23.2, t1: T.dim + 0.3, a: "Built here.", b: "For our patients." },
];
const SWAPS = [[10.95, "home"], ...COPY.features.map((f, i) => [T.features[i], f.screen]), [T.featEnd, "home"]];

async function build() {
  await Promise.all([
    document.fonts.load('500 40px "Inter Tight"'), document.fonts.load('800 40px "Inter Tight"'),
    document.fonts.load('900 40px "Inter Tight"'), document.fonts.load('italic 400 40px "Instrument Serif"'),
    document.fonts.load('500 20px "JetBrains Mono"'),
  ]);

  const canvas = document.getElementById("stage");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  RectAreaLightUniformsLib.init();

  const voidAct = createVoid(W, H);
  const phone = await createPhone(["home", ...COPY.features.map((f) => f.screen)]);
  setIcon(phone.iconImg);
  const opener = await createOpener(W, H, OPEN);
  const loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  const [pavImg, aerialImg] = await Promise.all([loadImg("assets/humc/pavilion-dusk.jpg"), loadImg("assets/humc/aerial.jpg")]);
  setPhotos({ aerial: aerialImg });

  // ---------- laptop screen pipeline ----------
  const bgCanvas = document.createElement("canvas"), fgCanvas = document.createElement("canvas");
  bgCanvas.width = fgCanvas.width = SW; bgCanvas.height = fgCanvas.height = SH;
  const bgCtx = bgCanvas.getContext("2d"), fgCtx = fgCanvas.getContext("2d");
  const bgTex = new THREE.CanvasTexture(bgCanvas), fgTex = new THREE.CanvasTexture(fgCanvas);
  for (const tx of [bgTex, fgTex]) { tx.colorSpace = THREE.SRGBColorSpace; tx.generateMipmaps = false; tx.minFilter = THREE.LinearFilter; }
  const screenRT = new THREE.WebGLRenderTarget(SW, SH, { samples: 4, type: THREE.HalfFloatType });
  const ortho = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 10);
  ortho.position.z = 1;
  const layer = (map, transparent) => {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map, transparent, toneMapped: false, depthTest: false, depthWrite: false })));
    return s;
  };
  const bgLayer = layer(bgTex, false), fgLayer = layer(fgTex, true);
  const cubes = createCubes(SW / SH);
  const avgCanvas = document.createElement("canvas");
  avgCanvas.width = 8; avgCanvas.height = 5;
  const avgCtx = avgCanvas.getContext("2d", { willReadFrequently: true });

  // ---------- table scene ----------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070f);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.25;
  const camera = new THREE.PerspectiveCamera(56, W / H, 0.05, 100);

  const wc = document.createElement("canvas");
  wc.width = 512; wc.height = 512;
  const wg = wc.getContext("2d");
  const grad = wg.createRadialGradient(200, 170, 10, 240, 230, 470);
  grad.addColorStop(0, "#2a3d7a"); grad.addColorStop(0.5, "#121c40"); grad.addColorStop(1, "#05070f");
  wg.fillStyle = grad; wg.fillRect(0, 0, 512, 512);
  const wallTex = new THREE.CanvasTexture(wc);
  wallTex.colorSpace = THREE.SRGBColorSpace;
  const wallMat = new THREE.MeshBasicMaterial({ map: wallTex });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(26, 15), wallMat);
  wall.position.set(-1, 6.5, -7);
  scene.add(wall);
  const mq = document.createElement("canvas");
  mq.width = 2048; mq.height = 512;
  const mqx = mq.getContext("2d");
  mqx.font = '900 150px "Inter Tight"';
  mqx.fillStyle = "rgba(170,200,255,0.07)";
  mqx.textBaseline = "middle";
  const mqWords = ["INSUFICIENCIA CARD\u00cdACA \u00b7 ", "HEART FAILURE \u00b7 ", "INSUFICIENCIA CARD\u00cdACA \u00b7 "];
  mqWords.forEach((w, r) => mqx.fillText(w.repeat(3), -r * 300, 90 + r * 165));
  const mqTex = new THREE.CanvasTexture(mq);
  mqTex.colorSpace = THREE.SRGBColorSpace;
  mqTex.wrapS = THREE.RepeatWrapping;
  const marquee = new THREE.Mesh(new THREE.PlaneGeometry(26, 6.5),
    new THREE.MeshBasicMaterial({ map: mqTex, transparent: true, depthWrite: false, toneMapped: false }));
  marquee.position.set(-1, 4.2, -6.95);
  marquee.visible = false;
  scene.add(marquee);
  const wn = document.createElement("canvas");
  wn.width = 1024; wn.height = 830;
  const wnx = wn.getContext("2d");
  wnx.filter = "blur(6px) brightness(0.62) saturate(1.15)";
  wnx.drawImage(pavImg, -20, -20, 1064, 870);
  wnx.filter = "none";
  wnx.globalCompositeOperation = "destination-in";
  const wm = wnx.createRadialGradient(512, 400, 180, 512, 415, 560);
  wm.addColorStop(0, "rgba(0,0,0,1)"); wm.addColorStop(1, "rgba(0,0,0,0)");
  wnx.fillStyle = wm; wnx.fillRect(0, 0, 1024, 830);
  const winTex = new THREE.CanvasTexture(wn);
  winTex.colorSpace = THREE.SRGBColorSpace;
  const windowView = new THREE.Mesh(new THREE.PlaneGeometry(13, 10.5),
    new THREE.MeshBasicMaterial({ map: winTex, transparent: true, depthWrite: false, toneMapped: false }));
  windowView.position.set(0.4, 4.3, -6.9);
  scene.add(windowView);

  const mirror = new Reflector(new THREE.PlaneGeometry(40, 40), { textureWidth: 720, textureHeight: 1280, color: 0x8a8fa0, clipBias: 0.003 });
  mirror.rotation.x = -Math.PI / 2;
  scene.add(mirror);
  const ac = document.createElement("canvas");
  ac.width = 4; ac.height = 256;
  const ag = ac.getContext("2d");
  const fade = ag.createLinearGradient(0, 0, 0, 256);
  fade.addColorStop(0.0, "rgb(245,245,245)"); fade.addColorStop(0.3, "rgb(150,150,150)");
  fade.addColorStop(0.42, "rgb(95,95,95)"); fade.addColorStop(0.6, "rgb(140,140,140)");
  fade.addColorStop(0.75, "rgb(210,210,210)"); fade.addColorStop(1.0, "rgb(240,240,240)");
  ag.fillStyle = fade; ag.fillRect(0, 0, 4, 256);
  const floorTop = new THREE.Mesh(new THREE.PlaneGeometry(16, 16),
    new THREE.MeshStandardMaterial({ color: 0x0d1124, roughness: 0.5, metalness: 0, transparent: true, alphaMap: new THREE.CanvasTexture(ac), depthWrite: false }));
  floorTop.rotation.x = -Math.PI / 2;
  floorTop.position.set(0, 0.002, 1);
  scene.add(floorTop);

  // laptop
  const metal = new THREE.MeshStandardMaterial({ color: 0x2b2d34, roughness: 0.36, metalness: 0.7 });
  const laptop = new THREE.Group();
  scene.add(laptop);
  const base = new THREE.Mesh(new RoundedBoxGeometry(3.0, 0.07, 2.05, 4, 0.03), metal);
  base.position.y = 0.035; laptop.add(base);
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(2.62, 0.98), new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.7 }));
  deck.rotation.x = -Math.PI / 2; deck.position.set(0, 0.0705, -0.36); laptop.add(deck);
  const keyList = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) keyList.push([-1.157 + c * 0.178, -0.76 + r * 0.168, 0.152]);
  for (const [x, w] of [[-1.157, 0.152], [-0.979, 0.152], [-0.801, 0.152], [-0.623, 0.152], [-0.07, 0.92], [0.445, 0.152], [0.623, 0.152], [0.801, 0.152], [1.01, 0.3]]) keyList.push([x, 0.08, w]);
  const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.016, 1), new THREE.MeshStandardMaterial({ color: 0x131316, roughness: 0.55 }), keyList.length);
  const km = new THREE.Matrix4();
  keyList.forEach(([x, z, w], i) => { km.makeScale(w, 1, 0.14); km.setPosition(x, 0.079, z); keys.setMatrixAt(i, km); });
  laptop.add(keys);
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.66), new THREE.MeshStandardMaterial({ color: 0x2a2a2f, roughness: 0.22, metalness: 0.5 }));
  pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.0712, 0.58); laptop.add(pad);
  const lid = new THREE.Group();
  lid.position.set(0, 0.07, -0.99); lid.rotation.x = -0.3; laptop.add(lid);
  const shell = new THREE.Mesh(new RoundedBoxGeometry(3.0, 1.98, 0.035, 4, 0.015), metal);
  shell.position.set(0, 0.99, 0); lid.add(shell);
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(2.95, 1.93), new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.12 }));
  bezel.position.set(0, 0.99, 0.0181); lid.add(bezel);
  const DW = 2.84, DH = DW * (SH / SW);
  const display = new THREE.Mesh(new THREE.PlaneGeometry(DW, DH), new THREE.MeshBasicMaterial({ map: screenRT.texture, toneMapped: false }));
  display.position.set(0, 1.0, 0.0186); lid.add(display);
  const spill = new THREE.RectAreaLight(0xffffff, 4, DW, DH);
  spill.position.set(0, 1.0, 0.03); spill.rotation.y = Math.PI; lid.add(spill);

  // floating v11-style caption above the laptop
  const cc = document.createElement("canvas");
  cc.width = 1800; cc.height = 400;
  const cx = cc.getContext("2d");
  const capTex = new THREE.CanvasTexture(cc);
  capTex.colorSpace = THREE.SRGBColorSpace;
  const caption = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.9 * (400 / 1800)),
    new THREE.MeshBasicMaterial({ map: capTex, transparent: true, depthWrite: false, toneMapped: false }));
  caption.position.set(0.05, 2.32, 0.12);
  lid.add(caption);
  function drawCaption(t) {
    cx.clearRect(0, 0, 1800, 400);
    capTex.needsUpdate = true;
    const c = CAPTIONS.find((k) => t >= k.t0 && t < k.t1);
    if (!c) return;
    const pin = prog(t, c.t0, c.t0 + 0.45), pout = prog(t, c.t1 - 0.12, c.t1);
    const dim = 1 - 0.8 * prog(t, T.dim, T.dim + 0.4);
    cx.save();
    cx.globalAlpha = (1 - pout) * dim;
    cx.translate(0, -40 * pout);
    cx.font = '800 104px "Inter Tight"';
    cx.letterSpacing = "-2px";
    cx.textBaseline = "alphabetic";
    cx.shadowColor = "rgba(0,0,0,0.45)"; cx.shadowBlur = 20;
    const a1 = outExpo(prog(t, c.t0, c.t0 + 0.3));
    cx.globalAlpha *= a1;
    cx.fillStyle = "#fff";
    cx.fillText(c.a, 20, 130 + (1 - a1) * 30);
    cx.globalAlpha = (1 - pout) * dim;
    const bw = cx.measureText(c.b).width + 56;
    const wp = outExpo(prog(t, c.t0 + 0.12, c.t0 + 0.45));
    cx.shadowColor = C.cyan; cx.shadowBlur = 30;
    cx.fillStyle = C.cyan;
    roundRect(cx, 10, 170, Math.max(1, bw * wp), 136, 10);
    cx.fill();
    cx.shadowBlur = 0;
    cx.save();
    cx.beginPath(); cx.rect(10, 170, bw * wp, 136); cx.clip();
    cx.fillStyle = C.cyanDeep;
    cx.fillText(c.b, 38, 276);
    cx.restore();
    cx.restore();
    capTex.needsUpdate = true;
  }

  // phone on the table
  scene.add(phone.outer);
  phone.outer.add(phone.smiley);
  phone.smiley.position.set(-0.5, 0, 0.22);
  const rimA = new THREE.PointLight(0x3a6dff, 0, 4, 1.6);
  const rimB = new THREE.PointLight(0x3fc6ee, 0, 4, 1.6);
  scene.add(rimA, rimB);
  const key = new THREE.DirectionalLight(0xdfe8ff, 0.35);
  key.position.set(-3, 5, 3); scene.add(key);
  const hemi = new THREE.HemisphereLight(0xb0c0e0, 0x05070f, 0.15);
  scene.add(hemi);

  // DOM overlays
  const $ = (id) => document.getElementById(id);
  const fadeEl = $("fade"), endEl = $("endcard");
  const parts = ["e-smiley", "e-name", "e-url", "e-live", "e-c1", "e-c2"].map($);
  $("e-name").textContent = COPY.laptopTitle;
  $("e-url").textContent = COPY.url;
  $("e-live").textContent = COPY.live;
  $("e-c1").textContent = COPY.closer[0];
  $("e-c2").textContent = COPY.closer[1];

  const tmp = new THREE.Color();
  const pv = new THREE.Vector3(), lv = new THREE.Vector3();

  function camAt(t) {
    let i = 0;
    while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
    const [t0, p0, l0] = KEYS[i], [t1, p1, l1] = KEYS[i + 1];
    let k = prog(t, t0, t1);
    k = i === 2 ? inOutCubic(k) : i >= 3 ? inOutSine(k) : outCubic(k);
    pv.set(lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k), lerp(p0[2], p1[2], k));
    lv.set(lerp(l0[0], l1[0], k), lerp(l0[1], l1[1], k), lerp(l0[2], l1[2], k));
    // punch-in on each feature beat
    for (const ft of T.features) {
      const p = prog(t, ft, ft + 0.6);
      if (p > 0 && p < 1) {
        const amt = Math.sin(Math.PI * p) * (1 - p) * 0.55;
        pv.lerp(lv, amt * 0.12);
      }
    }
    camera.position.copy(pv);
    camera.lookAt(lv);
  }

  function explodeAt(t) {
    let lift = 0, swapTo = "splash";
    for (const [ts, name] of SWAPS) {
      if (t >= ts + 0.22) swapTo = name;
      const up = outExpo(prog(t, ts, ts + 0.22));
      const down = inOutCubic(prog(t, ts + 0.25, ts + 0.75));
      lift = Math.max(lift, up * (1 - down));
    }
    phone.setScreen(swapTo);
    phone.explode(lift, t);
  }

  function renderTable(t) {
    const { scene: s, lt } = drawScreen(bgCtx, fgCtx, t);
    bgTex.needsUpdate = true; fgTex.needsUpdate = true;
    let rgb;
    if (s.cube) rgb = [60, 150, 230];
    else {
      avgCtx.drawImage(bgCanvas, 0, 0, 8, 5);
      const d = avgCtx.getImageData(0, 0, 8, 5).data;
      rgb = [0, 0, 0];
      for (let i = 0; i < d.length; i += 4) { rgb[0] += d[i]; rgb[1] += d[i + 1]; rgb[2] += d[i + 2]; }
      rgb = rgb.map((v) => v / 40);
    }
    const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
    const endDim = 1 - 0.7 * outCubic(prog(t, T.dim, T.dim + 0.6));
    tmp.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace);
    spill.color.copy(tmp);
    spill.intensity = (1.0 + 10 * lum) * endDim;
    const amb = prog(t, T.logoEnd, T.logoEnd + 0.8);
    wallMat.color.setRGB(1, 1, 1).lerp(tmp, 0.15).multiplyScalar(lerp(0.25, 0.9, amb) * endDim);
    key.intensity = lerp(0.08, 0.35, amb) * endDim;
    mqTex.offset.x = t * 0.012;
    marquee.material.opacity = amb * endDim;
    windowView.material.color.setScalar(lerp(0.2, 1, amb) * endDim);

    // phone: spin in, land, logo pop, then rest
    const sp = outExpo(prog(t, T.hookEnd, T.spinEnd - 0.1));
    phone.outer.position.set(lerp(PHONE_AT.x + 0.5, PHONE_AT.x, sp), lerp(2.4, 0, sp), lerp(PHONE_AT.z + 0.9, PHONE_AT.z, sp));
    phone.outer.rotation.set(lerp(0.5, PHONE_AT.lean, sp), PHONE_AT.ry + (1 - sp) * Math.PI * 3.5, (1 - sp) * 0.9);
    const rise = outBack(prog(t, T.spinEnd, T.spinEnd + 0.45)) * (1 - outExpo(prog(t, T.logoEnd, T.logoEnd + 0.35)));
    phone.icon(rise, prog(t, T.spinEnd + 0.1, T.logoEnd + 0.2), t);
    explodeAt(t);
    const rimK = lerp(14, 2.5, amb) * endDim;
    phone.outer.updateMatrixWorld(true);
    const pc = new THREE.Vector3(0, 0.85, 0).applyMatrix4(phone.outer.matrixWorld);
    rimA.position.set(pc.x + 0.9, pc.y + 0.9, pc.z - 0.6); rimA.intensity = rimK;
    rimB.position.set(pc.x - 0.9, pc.y + 0.3, pc.z + 0.4); rimB.intensity = rimK * 0.6;
    phone.glow.intensity = 2.2 * endDim;

    // Dr. Smiley pops up beside the phone
    const smP = outBack(prog(t, T.features[4] + 0.3, T.features[4] + 0.65), 2.2);
    const smOut = prog(t, T.dim, T.dim + 0.3);
    phone.smiley.visible = smP > 0.002 && smOut < 1;
    phone.smiley.scale.setScalar(Math.max(0.001, smP * (1 - smOut)));
    phone.smiley.rotation.set(0, 0.3, Math.sin(t * 5) * 0.04);

    drawCaption(t);
    camAt(t);

    renderer.setRenderTarget(screenRT);
    renderer.autoClear = true;
    renderer.render(bgLayer, ortho);
    renderer.autoClear = false;
    if (s.cube) { renderer.clearDepth(); cubes.render(renderer, lt); }
    renderer.render(fgLayer, ortho);
    renderer.autoClear = true;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  }

  const endBg = $("endbg");
  function renderAt(time) {
    const T0 = clamp(time, 0, DURATION - 1e-4);
    if (T0 < OPEN) {
      opener.render(renderer, T0);
      fadeEl.style.opacity = String(Math.max(1 - prog(T0, 0, 0.3), prog(T0, OPEN - 0.18, OPEN)));
      endEl.style.opacity = "0";
      endBg.style.opacity = "0";
      return;
    }
    const t = T0 - OPEN;
    if (t < T.hookEnd) voidAct.render(renderer, t);
    else renderTable(t);

    // fades: in from black, dip at the act cut, end dim
    const fin = 1 - prog(t, 0, 0.35);
    const cut = t < T.hookEnd ? prog(t, 7.75, 8.0) : 1 - prog(t, T.hookEnd, T.hookEnd + 0.35);
    const dim = 0.72 * outCubic(prog(t, T.dim, T.dim + 0.6));
    fadeEl.style.opacity = String(Math.max(fin, cut, dim));

    // HUMC skybridge behind the final card
    const bgp = outCubic(prog(t, T.dim + 0.1, T.dim + 0.9));
    endBg.style.opacity = String(bgp);
    endBg.style.transform = `scale(${1.04 + 0.05 * prog(t, T.dim, DURATION - OPEN)})`;

    endEl.style.opacity = String(prog(t, T.dim + 0.3, T.dim + 0.45));
    const beats = [25.5, 26.0, 26.5, 26.75, 27.0, 27.5];
    parts.forEach((el, i) => {
      const p = i === 0 ? outBack(prog(t, beats[i], beats[i] + 0.4), 2) : outExpo(prog(t, beats[i], beats[i] + 0.4));
      el.style.opacity = String(Math.min(1, p * 1.5));
      el.style.transform = i === 0 ? `scale(${Math.max(0, p)})` : `translateY(${(1 - p) * 26}px)`;
    });
    $("e-c2").style.setProperty("--wipe", String(outExpo(prog(t, 27.6, 28.0))));
  }

  window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
  renderAt(window.__hfThreeTime || 0);
  window.__renderAt = renderAt;
}

window.__hfBuildResolve(build());
