// Dr. Smiley as a cutout puppet for the 3D scenes (BRIEF.md step 3).
// His real art from the app (drsmiley/: base, the 30-frame face strip, the two
// brows) is composited on a canvas the way drSmileyArt() lays it out, so every
// expression is Jose's drawing. The picture is a card with thickness standing
// on a small glass disc (his art ends at the shoulders, so he is a token, not
// a cut-off torso). Everything is a pure function of the pose you pass, so
// any frame renders the same.
import * as THREE from "three";

// drSmileyArt() geometry (index.html), in base-picture pixels (480 x 600).
const FACE = { x: 80, y: 212, w: 302, h: 222 };
const BROW_L = { x: 90, y: 175, w: 130, h: 65 };
const BROW_R = { x: 270, y: 190, w: 125, h: 90 };
const SVG_TO_PX = 480 / 106; // drSmileyArt draws the 480 px base 106 units wide
export const FRAMES = ["rest", "blink1", "blink2", "shut", "wink1", "wink2", "wink", "smile1", "smile2", "smile", "laugh1", "laugh2", "laugh", "laughB", "lookL", "lookR", "love", "sleep",
  "halfL", "halfR", "lookU", "lookD", "lookUL", "lookUR", "lookDL", "lookDR", "surprised", "sad", "worried", "doubt"];
// DR_BROWS (index.html): [left lift, left tilt, right lift, right tilt]; lift in SVG units, tilt in degrees.
export const BROWS = {
  rest: [0, 0, 0, 0], relax: [0.8, 0, 0.8, 0], lift: [-1.2, 0, -1.2, 0], glad: [-2, 0, -2, 0], laugh: [-2.8, 0, -2.8, 0],
  up: [-4.2, 0, -4.2, 0], quizL: [0.4, -7, -3.6, -5], quizR: [-3.6, 5, 0.4, 7], down: [0.8, 0, 0.8, 0], love: [-2, -6, -2, 6],
  wink: [-1, 0, 1.2, -4], caring: [-1, -11, -1, 11], worried: [-1.4, -15, -1.4, 15], focused: [1.2, 10, 1.2, -10], doubt: [-3, -4, 1, 2],
};

const H = 1.0, W = H * 480 / 600; // world size of the card
const DISC_R = 0.36, DISC_H = 0.05;

const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

// His art from the app, for createSmiley and for anything that draws him flat (the end card).
export async function loadSmileyArt(root = "../../drsmiley/") {
  const [base, face, bl, br] = await Promise.all(["base", "face", "brow-l", "brow-r"].map((n) => load(root + n + ".webp")));
  return { base, face, bl, br };
}
// Draws him whole (base, one face frame, both brows) into a 480 x 600 area of g, as drSmileyArt lays him out.
export function composeSmiley(g, { base, face, bl, br }, frame = "rest", brows = BROWS.rest) {
  const fi = Math.max(0, FRAMES.indexOf(frame));
  g.drawImage(base, 0, 0);
  g.drawImage(face, fi * FACE.w, 0, FACE.w, FACE.h, FACE.x, FACE.y, FACE.w, FACE.h);
  const brow = (img, b, lift, tilt) => {
    g.save();
    g.translate(b.x + b.w / 2, b.y + b.h / 2 + lift * SVG_TO_PX);
    g.rotate((tilt * Math.PI) / 180);
    g.drawImage(img, -b.w / 2, -b.h / 2);
    g.restore();
  };
  brow(bl, BROW_L, brows[0], brows[1]);
  brow(br, BROW_R, brows[2], brows[3]);
}

export async function createSmiley({ root = "../../drsmiley/", glow = 0x3fc6ee } = {}) {
  const art = await loadSmileyArt(root);
  const cv = document.createElement("canvas");
  cv.width = 480; cv.height = 600;
  const g = cv.getContext("2d");
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  let drawn = "";
  function paint(frame, brows) {
    const key = frame + "|" + brows.join(",");
    if (key === drawn) return;
    drawn = key;
    g.clearRect(0, 0, 480, 600);
    composeSmiley(g, art, frame, brows);
    tex.needsUpdate = true;
  }
  paint("rest", BROWS.rest);

  // The card: lit front, a stack of dark slices behind it for its edge.
  const geo = new THREE.PlaneGeometry(W, H);
  geo.translate(0, H / 2, 0); // pivot at his base, for squash and stretch
  const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness: 0.62, metalness: 0, side: THREE.FrontSide }));
  front.castShadow = true;
  front.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  const card = new THREE.Group();
  card.add(front);
  const edgeMat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, color: 0x9aa6c8, roughness: 0.8, side: THREE.DoubleSide });
  const SLICES = 7, DEPTH = 0.028;
  for (let i = 1; i <= SLICES; i++) {
    const s = new THREE.Mesh(geo, i === SLICES ? new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, color: 0xe8ecf6, roughness: 0.7, side: THREE.BackSide }) : edgeMat);
    s.position.z = -(DEPTH * i) / SLICES;
    card.add(s);
  }
  card.position.y = DISC_H;

  // The glass disc he stands on, with a cyan rim that lights up.
  const disc = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(DISC_R, DISC_R * 1.04, DISC_H, 64),
    new THREE.MeshPhysicalMaterial({ color: 0xdfeefa, roughness: 0.12, metalness: 0, transmission: 0, transparent: true, opacity: 0.55, clearcoat: 1, clearcoatRoughness: 0.08 }));
  glass.position.y = DISC_H / 2;
  glass.castShadow = true;
  const rimMat = new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.9, toneMapped: false });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(DISC_R * 1.02, 0.008, 8, 96), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = DISC_H * 0.55;
  disc.add(glass, rim);

  // Soft contact shadow: a blurred dark ellipse that shrinks as he rises.
  const sc = document.createElement("canvas");
  sc.width = sc.height = 128;
  const sg = sc.getContext("2d");
  const rg = sg.createRadialGradient(64, 64, 4, 64, 64, 62);
  rg.addColorStop(0, "rgba(10,20,50,0.55)"); rg.addColorStop(0.55, "rgba(10,20,50,0.22)"); rg.addColorStop(1, "rgba(10,20,50,0)");
  sg.fillStyle = rg; sg.fillRect(0, 0, 128, 128);
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(DISC_R * 3, DISC_R * 3),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, toneMapped: false }));
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.002;

  const body = new THREE.Group(); // moves (hop height, lean, turn)
  body.add(disc, card);
  const group = new THREE.Group(); // placed in the scene by the shot
  group.add(contact, body);

  // A cyan light under his chin when the screen glows at him.
  const screenLight = new THREE.PointLight(glow, 0, 2.2, 1.6);
  screenLight.position.set(0, 0.25, 0.55);
  group.add(screenLight);

  /* pose: { y: height above the ground, squash: 1 = drawn shape (<1 squashed,
     >1 stretched, volume kept), lean: degrees (+ leans to his left), turn:
     degrees about the vertical, face, brows (a BROWS key or array),
     glow: 0..1 screen light on him, rim: 0..1, clipBelow: true while he
     rises out of a screen (nothing under the ground shows) } */
  function pose(p) {
    const s = p.squash ?? 1;
    card.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
    body.position.y = p.y ?? 0;
    body.rotation.z = THREE.MathUtils.degToRad(p.lean ?? 0);
    body.rotation.y = THREE.MathUtils.degToRad(p.turn ?? 0);
    const air = Math.min(1, (p.y ?? 0) / 0.8);
    contact.scale.setScalar(1 - air * 0.45);
    contact.material.opacity = 1 - air * 0.6;
    screenLight.intensity = (p.glow ?? 0.6) * 1.4;
    rimMat.opacity = 0.35 + 0.65 * (p.rim ?? 0.6);
    paint(p.face || "rest", Array.isArray(p.brows) ? p.brows : BROWS[p.brows || "rest"]);
  }
  pose({});
  return { group, body, card, disc, contact, pose, size: { w: W, h: H, disc: DISC_R } };
}

// ---------- the six moves, each a pose over phase u in [0, 1] ----------
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const spring = (x) => 1 - Math.exp(-6 * x) * Math.cos(11 * x); // overshoot, then settle

export const MOVES = {
  // Crouch, spring up stretched, hang, come down.
  hop(u) {
    const crouch = clamp01(u / 0.18), air = clamp01((u - 0.18) / 0.82);
    const y = Math.sin(Math.PI * air) * 0.62;
    const squash = u < 0.18 ? 1 - 0.14 * Math.sin(Math.PI * crouch) : 1 + 0.12 * Math.sin(Math.PI * Math.min(1, air * 1.6)) * (1 - air);
    return { y, squash, lean: -4 * Math.sin(Math.PI * air), turn: 14, face: air > 0.15 && air < 0.85 ? "smile" : "smile1", brows: "glad", glow: 0.5, rim: 0.4 + 0.6 * air };
  },
  // Touch down squashed, spring back to his drawn shape.
  land(u) {
    const k = spring(u);
    return { y: 0, squash: 0.8 + 0.2 * k, lean: 3 * (1 - k), face: u < 0.3 ? "laugh" : "smile", brows: u < 0.3 ? "laugh" : "glad", glow: 0.6, rim: 1 - 0.5 * u };
  },
  // Little bobs, eyes down at the keys.
  type(u) {
    const tap = Math.abs(Math.sin(u * Math.PI * 6));
    return { y: 0.02 * tap, squash: 1 - 0.03 * tap, lean: 2 * Math.sin(u * Math.PI * 3), face: "lookD", brows: "down", glow: 0.9, rim: 0.5 + 0.5 * tap };
  },
  // Lean toward what he is showing, eyes on it, one brow up.
  point(u) {
    const k = easeOut(clamp01(u / 0.4));
    return { y: 0, squash: 1 + 0.03 * k, lean: -11 * k, turn: -18 * k, face: k > 0.5 ? "halfR" : "rest", brows: k > 0.5 ? "quizR" : "rest", glow: 0.7, rim: 0.8 };
  },
  // Rise out of the screen through a ring of light, surprised, then pleased.
  stepOut(u) {
    const r = easeOut(clamp01(u / 0.7));
    return { y: -1.1 * (1 - r), squash: 1 + 0.1 * Math.sin(Math.PI * clamp01(u / 0.7)), face: u < 0.55 ? "surprised" : "smile", brows: u < 0.55 ? "up" : "glad", glow: 1, rim: 1, clipBelow: true };
  },
  // Rock side to side with a wink.
  wave(u) {
    const rock = Math.sin(u * Math.PI * 4);
    return { y: 0.03 * Math.abs(rock), squash: 1 + 0.02 * Math.abs(rock), lean: 9 * rock, turn: -16, face: rock > 0 ? "wink" : "laugh", brows: rock > 0 ? "wink" : "laugh", glow: 0.6, rim: 0.7 };
  },
};
