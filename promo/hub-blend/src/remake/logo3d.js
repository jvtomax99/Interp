// The logo shot, rebuilt after Jose's 3D logo picture (assets/ref/hub-logo-3d.webp, 2026-10-22):
// "Interpreter" in deep navy over a big bright blue "Hub", glossy extruded letters with a soft
// light edge, two chat bubbles (clear glass and blue) left of "Hub", the app icon's diamond tiles
// streaming in an arc over the word and gathering right of "Hub", on a soft white-blue set with
// a glossy floor, so the navy never sits dark on dark. 2 s (u 0..2, the design clock): the tiles
// fly in and settle on the first beat, "Interpreter" lands letter by letter, "Hub" lands with a
// bounce on the second beat, the bubbles pop, the line under it fades up, a shine sweeps "Hub".
import * as THREE from "three";
import { TextGeometry } from "../../vendor/addons/TextGeometry.js";
import { RoundedBoxGeometry } from "../../vendor/RoundedBoxGeometry.js";
import { RoomEnvironment } from "../../vendor/RoomEnvironment.js";
import { Reflector } from "../../vendor/Reflector.js";
import { clamp, lerp, prog, outBack, outExpo, outCubic, inOutSine, rng } from "../util.js";

const NAVY = 0x0a1f5c, BLUE = 0x1560e0, TILE_COLORS = [0x13306e, 0x1f5fd6, 0x2f86f0, 0x7cc0ff, 0xcfe6ff];

export function buildLogo3D(renderer, font, { W, H }) {
  const group = new THREE.Group();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // ---------- the set: a soft white-blue wall, brightest behind the word, and a glossy floor ----------
  const wc = document.createElement("canvas"); wc.width = 512; wc.height = 1024;
  const wg = wc.getContext("2d");
  const gr = wg.createRadialGradient(256, 470, 30, 256, 520, 620);
  gr.addColorStop(0, "#f4f8fe"); gr.addColorStop(0.45, "#dce9f9"); gr.addColorStop(1, "#a9c6ec");
  wg.fillStyle = gr; wg.fillRect(0, 0, 512, 1024);
  const wallTex = new THREE.CanvasTexture(wc); wallTex.colorSpace = THREE.SRGBColorSpace;
  // under the bloom threshold: a white wall would glow over everything
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(18, 30), new THREE.MeshBasicMaterial({ map: wallTex, toneMapped: false, color: 0xf4f6fa, fog: false })); // its middle just over the bloom threshold: a soft glow behind the word
  wall.position.set(0, 4, -3.2);
  group.add(wall);
  const FLOOR_Y = 0.9;
  const mirror = new Reflector(new THREE.PlaneGeometry(30, 30), { textureWidth: W / 2, textureHeight: H / 2, color: 0xb9c9e2, clipBias: 0.003 });
  mirror.rotation.x = -Math.PI / 2; mirror.position.y = FLOOR_Y;
  group.add(mirror);
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0xdfe9f7, transparent: true, opacity: 0.72, toneMapped: false, fog: false }));
  sheen.rotation.x = -Math.PI / 2; sheen.position.y = FLOOR_Y + 0.002;
  group.add(sheen);

  // ---------- light: soft and even, a cool rim from behind for the letters' edges ----------
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(-2, 6, 6); group.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x9fd8ff, 2.2); rim.position.set(1.5, 3, -4); group.add(rim, rim.target);
  group.add(new THREE.HemisphereLight(0xf2f7ff, 0x8ea6cc, 0.35));

  // ---------- the letters ----------
  const glossy = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08, envMap: env, envMapIntensity: 0.4, fog: false, ...extra });
  const shine = { value: -10 };
  const hubMat = glossy(BLUE, { emissive: 0x0b3a9a, emissiveIntensity: 0.18 });
  hubMat.onBeforeCompile = (sh) => { // a band of light that sweeps across "Hub"
    sh.uniforms.uShine = shine;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying float vShineX;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvShineX = (modelMatrix * vec4(transformed, 1.0)).x - (modelMatrix * vec4(transformed, 1.0)).y * 0.45;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vShineX; uniform float uShine;")
      .replace("#include <dithering_fragment>", "#include <dithering_fragment>\ngl_FragColor.rgb += vec3(0.55, 0.75, 1.0) * smoothstep(0.16, 0.0, abs(vShineX - uShine));");
  };
  const letters = (text, size, mat, depth, bevel = 1) => {
    const g = new THREE.Group(), list = [];
    let x = 0;
    for (const ch of text) {
      const geo = new TextGeometry(ch, { font, size, depth, curveSegments: 10, bevelEnabled: true, bevelThickness: size * 0.07 * bevel, bevelSize: size * 0.045 * bevel, bevelSegments: 5 });
      geo.computeBoundingBox();
      const adv = (font.data.glyphs[ch]?.ha || 600) / font.data.resolution * size;
      const pivot = new THREE.Group(); pivot.position.x = x + adv / 2;
      const m = new THREE.Mesh(geo, mat); m.position.x = -adv / 2; m.castShadow = true;
      pivot.add(m); g.add(pivot); list.push(pivot);
      x += adv;
    }
    g.userData.width = x; g.userData.list = list;
    return g;
  };
  const top = letters("Interpreter", 1, glossy(NAVY), 0.3, 0.45); // a thinner bevel: its strokes are thinner than Hub's
  const hub = letters("Hub", 1, hubMat, 0.42);
  // sizes: "Interpreter" across the frame, "Hub" about 2.2 times taller, as in the picture
  const TOPW = 3.3, sTop = TOPW / top.userData.width, sHub = sTop * 1.95;
  top.scale.setScalar(sTop); hub.scale.setScalar(sHub);
  const capH = hub.userData.list[0].children[0].geometry.boundingBox.max.y; // the H's height, per em
  top.position.set(-TOPW / 2, FLOOR_Y + capH * sHub + 0.3, 0);
  const hubW = hub.userData.width * sHub;
  hub.position.set(1.62 - hubW, FLOOR_Y + 0.03, 0.08);
  group.add(top, hub);

  // ---------- the two bubbles, left of "Hub" ----------
  const bubbleShape = (w, h, r, tailLeft) => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    if (tailLeft) { s.lineTo(-w / 2 + r + 0.05, -h / 2); s.lineTo(-w / 2 + r - 0.02, -h / 2 - 0.22); s.lineTo(-w / 2 + r + 0.2, -h / 2); }
    else { s.lineTo(w / 2 - r - 0.2, -h / 2); s.lineTo(w / 2 - r + 0.02, -h / 2 - 0.22); s.lineTo(w / 2 - r - 0.05, -h / 2); }
    s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 5, curveSegments: 12 });
  };
  const blueBubble = new THREE.Mesh(bubbleShape(0.95, 0.72, 0.16, false), glossy(0x1a62e0, { emissive: 0x0c3a9c, emissiveIntensity: 0.15 }));
  const glassBubble = new THREE.Mesh(bubbleShape(0.9, 0.66, 0.15, true), new THREE.MeshPhysicalMaterial({ color: 0x9fd0ff, roughness: 0.04, metalness: 0, clearcoat: 1, envMap: env, envMapIntensity: 0.55, fog: false, transparent: true, opacity: 0.38, depthWrite: false }));
  const bubbles = new THREE.Group();
  blueBubble.position.set(0.18, 0.22, -0.05); glassBubble.position.set(-0.22, -0.18, 0.12);
  bubbles.add(blueBubble, glassBubble);
  bubbles.position.set(hub.position.x - 0.62, FLOOR_Y + capH * sHub * 0.66, 0.25); bubbles.userData.s = 0.72;
  group.add(bubbles);

  // ---------- the diamond tiles: an arc over "Interpreter", a cluster right of "Hub" ----------
  const r = rng(5), tiles = [];
  const tileGeo = new RoundedBoxGeometry(1, 1, 0.22, 3, 0.08);
  const tileMats = TILE_COLORS.map((c, i) => i === 4
    ? new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.05, clearcoat: 1, envMap: env, envMapIntensity: 0.8, fog: false, transparent: true, opacity: 0.6, depthWrite: false })
    : glossy(c, { emissive: c, emissiveIntensity: 0.12 }));
  const topY = top.position.y + 0.75;
  for (let i = 0; i < 30; i++) { // the arc: big at its left end, a trail of smaller ones to the right
    const a = i / 29, x = lerp(-1.75, 1.15, a), y = topY + 0.25 + Math.sin(Math.PI * Math.min(1, a * 1.25)) * 0.55 - a * 0.25 + (r() - 0.5) * 0.14;
    tiles.push({ x, y, z: (r() - 0.5) * 0.4, s: lerp(0.24, 0.035, a) * (0.7 + r() * 0.5), mat: tileMats[Math.floor(r() * 5)], order: a, set: 0 });
  }
  for (let i = 0; i < 14; i++) { // the cluster right of "Hub"
    const a = i / 13;
    tiles.push({ x: 1.65 + 0.08 + r() * 0.45, y: FLOOR_Y + 0.45 + a * 1.3 + (r() - 0.5) * 0.2, z: (r() - 0.5) * 0.5, s: lerp(0.2, 0.05, r()), mat: tileMats[Math.floor(r() * 5)], order: a, set: 1 });
  }
  const tileMeshes = tiles.map((t) => { const m = new THREE.Mesh(tileGeo, t.mat); m.userData.t = t; group.add(m); return m; });

  // ---------- the line under it ----------
  const lc = document.createElement("canvas"); lc.width = 1400; lc.height = 120;
  const lg = lc.getContext("2d");
  lg.font = '600 64px "Inter Tight"'; lg.fillStyle = "#13306e"; lg.textAlign = "center"; lg.textBaseline = "middle";
  if ("letterSpacing" in lg) lg.letterSpacing = "6px";
  lg.fillText("For The HUMC Interpreter Team", 700, 62);
  const lineTex = new THREE.CanvasTexture(lc); lineTex.colorSpace = THREE.SRGBColorSpace;
  const line = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2 * 120 / 1400), new THREE.MeshBasicMaterial({ map: lineTex, transparent: true, toneMapped: false, depthWrite: false, fog: false }));
  line.position.set(0.05, FLOOR_Y + 0.13, 2.3); line.rotation.x = -0.12; // standing on the floor in front of "Hub", so it reads under it
  group.add(line);

  // ---------- each moment of the 2 s ----------
  function update(u) {
    // tiles: in from the upper left along the arc, settling by the first beat (u 0.47); the
    // cluster by the third (u 1.47)
    for (const m of tileMeshes) {
      const t = m.userData.t, t0 = t.set ? 0.95 + t.order * 0.3 : 0.05 + t.order * 0.3, a = outExpo(prog(u, t0, t0 + 0.32));
      const fromX = t.set ? 3.2 : -3.4, fromY = t.set ? t.y - 1.2 : t.y + 1.4;
      m.position.set(lerp(fromX, t.x, a), lerp(fromY, t.y, a), t.z + (1 - a) * 1.5);
      m.scale.setScalar(Math.max(0.001, t.s * (0.4 + 0.6 * a)));
      m.rotation.set(0.25 * Math.sin(u * 1.3 + t.order * 9), 0.3 * Math.sin(u * 1.1 + t.order * 7) + (1 - a) * 2.5, Math.PI / 4 + (1 - a) * 2);
      m.visible = u >= t0;
    }
    // "Interpreter": each letter drops in with a small bounce
    top.userData.list.forEach((p, i) => {
      const t0 = 0.22 + i * 0.028, a = prog(u, t0, t0 + 0.3);
      p.position.y = (1 - outBack(a, 2.2)) * 1.1; p.visible = a > 0;
      p.rotation.x = (1 - outCubic(a)) * -0.6;
    });
    // "Hub": lands on the second beat (u 0.97) with a bigger bounce
    hub.userData.list.forEach((p, i) => {
      const t0 = 0.62 + i * 0.05, a = prog(u, t0, t0 + 0.36);
      p.position.y = (1 - outBack(a, 2.6)) * 1.4; p.visible = a > 0;
      const sq = Math.sin(Math.PI * prog(u, t0 + 0.26, t0 + 0.44)) * 0.06; // a squash as it lands
      p.scale.set(1 + sq, 1 - sq, 1);
    });
    // the bubbles pop in after "Hub"
    const b = outBack(prog(u, 0.95, 1.25), 2.0);
    bubbles.scale.setScalar(Math.max(0.001, b * bubbles.userData.s)); bubbles.rotation.z = (1 - b) * 0.4; bubbles.visible = b > 0.001;
    blueBubble.position.y = 0.22 + Math.sin(u * 3) * 0.02; glassBubble.position.y = -0.18 + Math.sin(u * 3 + 1) * 0.02;
    // the line fades up, the shine sweeps "Hub" at the end
    line.material.opacity = outCubic(prog(u, 1.15, 1.5));
    shine.value = lerp(-1.8, 2.6, inOutSine(prog(u, 1.45, 1.9)));
  }
  // the camera: square on, a slow push, a slight drift; the word fills the frame's width
  function view(u, at) {
    const e = inOutSine(clamp(u / 2));
    return {
      pos: new THREE.Vector3(at.x + lerp(-0.2, 0.15, e), lerp(3.15, 3.05, e), at.z + lerp(8.9, 8.3, e)),
      look: new THREE.Vector3(at.x + 0.0, 2.75, at.z),
      focus: new THREE.Vector3(at.x, 2.6, at.z),
    };
  }
  return { group, update, view };
}
