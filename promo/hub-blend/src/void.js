// Act 1: the hook. v11's story as 3D kinetic type flying through a navy void.
import * as THREE from "three";
import { C, COPY } from "./config.js";
import { clamp, lerp, prog, outExpo, inOutExpo, outBack, outCubic, inExpo, roundRect } from "./util.js";

const PX = 1 / 780; // world units per canvas pixel

function textPlane({ w, h, draw, dynamic = false }) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d");
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w * PX, h * PX), mat);
  const api = {
    mesh, mat,
    redraw(...a) { ctx.clearRect(0, 0, w, h); draw(ctx, w, h, ...a); tex.needsUpdate = true; },
  };
  api.redraw(0);
  return api;
}

const sans = (wt, px) => `${wt} ${px}px "Inter Tight"`;
const mono = (px) => `500 ${px}px "JetBrains Mono"`;

function label(text, color) {
  return textPlane({
    w: 900, h: 90,
    draw(ctx) {
      ctx.font = mono(40);
      ctx.letterSpacing = "12px";
      ctx.fillStyle = color;
      ctx.textBaseline = "middle";
      ctx.fillText(text, 10, 45);
    },
  });
}

function word(text, { size = 230, color = "#fff", glow = null, glowBlur = 40, w = 1500, h = 300 } = {}) {
  return textPlane({
    w, h,
    draw(ctx, W, H, strike = 0) {
      ctx.font = sans(800, size);
      ctx.letterSpacing = "-6px";
      ctx.textBaseline = "middle";
      const x = 40, y = H / 2 + 6;
      if (glow) {
        ctx.shadowColor = glow;
        ctx.shadowBlur = glowBlur;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = glowBlur * 0.4;
      }
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
      if (strike > 0) {
        const tw = ctx.measureText(text).width;
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 16;
        ctx.lineCap = "round";
        ctx.shadowColor = C.red;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.moveTo(x - 10, y + 4);
        ctx.lineTo(x - 10 + (tw + 20) * strike, y - 2);
        ctx.stroke();
      }
    },
  });
}

function pill(text, bg, fg) {
  return textPlane({
    w: 820, h: 170,
    draw(ctx) {
      ctx.font = sans(800, 78);
      const tw = ctx.measureText(text).width;
      ctx.shadowColor = bg;
      ctx.shadowBlur = 30;
      ctx.fillStyle = bg;
      roundRect(ctx, 20, 25, tw + 90, 120, 60);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = fg;
      ctx.textBaseline = "middle";
      ctx.fillText(text, 65, 87);
    },
  });
}

export function createVoid(W, H) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050b26, 4.5, 13);
  const cam = new THREE.PerspectiveCamera(50, W / H, 0.05, 60);

  // background: radial navy + ghost marquee (drawn per frame)
  const bg = document.createElement("canvas");
  bg.width = 540; bg.height = 960;
  const bgx = bg.getContext("2d");
  const bgTex = new THREE.CanvasTexture(bg);
  bgTex.colorSpace = THREE.SRGBColorSpace;
  const bgScene = new THREE.Scene();
  const bgCam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 2);
  bgCam.position.z = 1;
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: bgTex, depthTest: false, depthWrite: false, toneMapped: false })));

  const H1 = COPY.hook;
  const groups = [];
  const mk = (pos, rotY, rotZ = 0) => {
    const g = new THREE.Group();
    g.position.set(...pos);
    g.rotation.set(0, rotY, rotZ);
    scene.add(g);
    groups.push(g);
    return g;
  };

  // G1 the doctor
  const g1 = mk([0, 0, 0], 0.22, 0.03);
  const l1 = label(H1.doctorLabel, C.cyan);
  const w1a = word(H1.doctor[0], { size: 300, h: 360 });
  const w1b = word(H1.doctor[1], { size: 300, h: 360 });
  g1.add(l1.mesh, w1a.mesh, w1b.mesh);

  // G2 timer
  const g2 = mk([3.2, -0.8, -6], -0.32, -0.04);
  const l2 = label(H1.timerLabel, "rgba(255,255,255,0.7)");
  const timer = textPlane({
    w: 1300, h: 420,
    draw(ctx, W2, H2, v = 0.38, drain = 0) {
      const red = v <= 0.001;
      ctx.font = sans(800, 300);
      ctx.letterSpacing = "-8px";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = red ? C.red : "#fff";
      if (red) { ctx.shadowColor = C.red; ctx.shadowBlur = 50; }
      ctx.fillText(`${v.toFixed(2)}s`, 30, 300);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(40, 350, 1100, 10);
      ctx.fillStyle = red ? C.red : C.cyan;
      ctx.fillRect(40, 350, 1100 * (1 - drain), 10);
    },
  });
  g2.add(l2.mesh, timer.mesh);

  // G3 the interpreter (wrong)
  const g3 = mk([-2.8, 0.9, -12], 0.38, 0.05);
  const l3 = label(H1.interpLabel, C.red);
  const w3a = word(H1.wrong[0], { glow: C.red, color: "#ffd9e1" });
  const w3b = word(H1.wrong[1], { glow: C.red, color: "#ffd9e1" });
  const p3 = pill(H1.wrongPill, C.red, "#fff");
  g3.add(l3.mesh, w3a.mesh, w3b.mesh, p3.mesh);

  // G4 the right word
  const g4 = mk([1.6, 0.1, -18], -0.24, -0.03);
  const l4 = label(H1.rightLabel, C.cyan);
  const w4a = word(H1.right[0], { glow: C.cyan, color: "#e9fbff", size: 200, w: 1500 });
  const w4b = word(H1.right[1], { glow: C.cyan, color: "#e9fbff", size: 200, w: 1500 });
  const ul = textPlane({ w: 1400, h: 40, draw(ctx, W2, H2, p = 0) { ctx.shadowColor = C.cyan; ctx.shadowBlur = 20; ctx.fillStyle = C.cyan; ctx.fillRect(10, 12, 1300 * p, 14); } });
  const p4 = pill(H1.rightPill, C.cyan, C.cyanDeep);
  g4.add(l4.mesh, w4a.mesh, w4b.mesh, ul.mesh, p4.mesh);

  // local layout helpers: (plane, x, y) in group space, left-aligned
  const place = (pl, x, y, z = 0) => {
    const w = pl.mesh.geometry.parameters.width;
    pl.mesh.position.set(x + w / 2, y, z);
    pl.base = pl.mesh.position.clone();
  };
  const X0 = -0.82;
  place(l1, X0, 0.62); place(w1a, X0 - 0.05, 0.26); place(w1b, X0 - 0.05, -0.1);
  place(l2, X0, 0.42); place(timer, X0 - 0.04, 0.02);
  place(l3, X0, 0.62); place(w3a, X0 - 0.05, 0.26); place(w3b, X0 - 0.05, -0.1); place(p3, X0 + 0.25, -0.44, 0.04);
  place(l4, X0, 0.62); place(w4a, X0 - 0.05, 0.27); place(w4b, X0 - 0.05, -0.04); place(ul, X0, -0.24); place(p4, X0 + 0.3, -0.5, 0.04);

  // camera views per group
  // camera looks at the content centre (cx along the group's x axis), drift adds parallax
  const view = (g, dist, cx, drift = 0, dy = 0) => {
    const fwd = new THREE.Vector3(0, 0, 1).applyEuler(g.rotation);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(g.rotation);
    const look = g.position.clone().addScaledVector(right, cx).add(new THREE.Vector3(0, 0.1, 0));
    return { pos: look.clone().addScaledVector(fwd, dist).addScaledVector(right, drift).add(new THREE.Vector3(0, dy, 0)), look };
  };
  const SH = [
    { t: 0.0, a: view(g1, 3.2, -0.4, 0.3, 0.15), b: view(g1, 2.7, -0.4, -0.08, 0.03) },
    { t: 2.0, a: view(g2, 3.0, -0.36, 0.25, -0.08), b: view(g2, 2.65, -0.36, -0.1, 0.0) },
    { t: 3.6, a: view(g3, 3.5, -0.2, -0.25, 0.15), b: view(g3, 3.0, -0.2, 0.08, 0.03) },
    { t: 5.6, a: view(g4, 3.9, -0.1, 0.25, 0.1), b: view(g4, 3.35, -0.1, -0.05, 0.0) },
  ];
  const TR = 0.42; // transition length into each shot

  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  function camAt(t) {
    let i = 0;
    for (let k = 0; k < SH.length; k++) if (t >= SH[k].t) i = k;
    const s = SH[i];
    const end = i + 1 < SH.length ? SH[i + 1].t : 7.6;
    const hold = prog(t, s.t, end);
    v1.lerpVectors(s.a.pos, s.b.pos, outCubic(hold));
    v2.lerpVectors(s.a.look, s.b.look, outCubic(hold));
    if (i > 0) {
      const prev = SH[i - 1];
      const p = inOutExpo(prog(t, s.t - TR * 0.5, s.t + TR * 0.5));
      if (p < 1) {
        v1.lerpVectors(prev.b.pos, v1.clone(), p);
        v2.lerpVectors(prev.b.look, v2.clone(), p);
      }
    }
    // final fly-through
    const fly = inExpo(prog(t, 7.45, 8.0));
    if (fly > 0) {
      const dir = v2.clone().sub(v1).normalize();
      v1.addScaledVector(dir, fly * 4.5);
      v2.addScaledVector(dir, fly * 4.5);
    }
    cam.position.copy(v1);
    cam.up.set(Math.sin(t * 0.7) * 0.04 + (i % 2 ? -0.03 : 0.03), 1, 0).normalize();
    cam.lookAt(v2);
  }

  function animIn(pl, t, t0, from = [-2, 0, 1.2], dur = 0.5) {
    const p = outExpo(prog(t, t0, t0 + dur));
    pl.mesh.position.set(pl.base.x + from[0] * (1 - p), pl.base.y + from[1] * (1 - p), pl.base.z + from[2] * (1 - p));
    pl.mesh.rotation.y = (1 - p) * (from[0] > 0 ? -0.9 : 0.9);
    pl.mat.opacity = clamp(p * 1.4);
  }

  function marquee(t) {
    const g = bgx.createRadialGradient(270, 430, 30, 270, 480, 640);
    let tint = [18, 36, 94];
    if (t >= 3.6 && t < 5.6) tint = [64, 16, 40];
    if (t >= 5.6) tint = [10, 50, 96];
    g.addColorStop(0, `rgb(${tint[0]},${tint[1]},${tint[2]})`);
    g.addColorStop(1, C.navy0);
    bgx.fillStyle = g;
    bgx.fillRect(0, 0, 540, 960);
    const txt = t < 3.6 ? "HEART FAILURE · " : t < 5.6 ? "¿FALLO CARDÍACO? · " : "INSUFICIENCIA · ";
    bgx.font = sans(900, 120);
    bgx.fillStyle = "rgba(255,255,255,0.045)";
    bgx.textBaseline = "middle";
    for (let r = 0; r < 6; r++) {
      const dir = r % 2 ? 1 : -1;
      const off = ((t * 60 * dir) % 900) - 900;
      bgx.fillText(txt.repeat(4), off + r * 37, 120 + r * 150);
    }
    bgTex.needsUpdate = true;
  }

  return {
    render(renderer, t) {
      marquee(t);
      // G1
      animIn(l1, t, 0.2, [0, 0.12, 0.25], 0.4);
      animIn(w1a, t, 0.4, [-1.3, 0, 0.7]);
      animIn(w1b, t, 0.85, [1.3, 0, 0.7]);
      // G2
      animIn(l2, t, 2.05, [0, 0.12, 0.25], 0.4);
      animIn(timer, t, 2.1, [1.1, 0, 0.6], 0.45);
      const drain = prog(t, 2.35, 3.3);
      timer.redraw(0.38 * (1 - drain), drain);
      // G3
      animIn(l3, t, 3.65, [0, 0.12, 0.25], 0.4);
      animIn(w3a, t, 3.8, [-1.3, 0, 0.7]);
      animIn(w3b, t, 4.05, [1.3, 0, 0.7]);
      w3a.redraw(outExpo(prog(t, 4.55, 4.75)));
      w3b.redraw(outExpo(prog(t, 4.65, 4.85)));
      const pp = outBack(prog(t, 4.86, 5.15));
      p3.mesh.scale.setScalar(Math.max(0.001, pp));
      p3.mesh.rotation.z = -0.1;
      p3.mat.opacity = prog(t, 4.86, 4.95);
      // G4
      animIn(l4, t, 5.65, [0, 0.12, 0.25], 0.4);
      animIn(w4a, t, 5.99, [0, -0.5, 0.8], 0.5);
      animIn(w4b, t, 6.15, [0, -0.5, 0.8], 0.5);
      ul.redraw(outExpo(prog(t, 6.5, 6.9)));
      const qp = outBack(prog(t, 7.0, 7.3));
      p4.mesh.scale.setScalar(Math.max(0.001, qp));
      p4.mesh.rotation.z = 0.06;
      p4.mat.opacity = prog(t, 7.0, 7.08);

      camAt(t);
      renderer.autoClear = true;
      renderer.render(bgScene, bgCam);
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(scene, cam);
      renderer.autoClear = true;
    },
  };
}
