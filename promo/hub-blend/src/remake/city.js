// CoreCHI Practice's campus, flown into (Prompt 3, Jose 2026-10-21). The app's own pieces from
// city/ (re-rendered at twice the size from docs/mockups/cchi-city/entrance.html, so the close
// end stays sharp) drawn on a 2D canvas between the 3D stage and the captions. Every mover keeps
// the app's look, path and clock (campusLife and the cp* keyframes in index.html); only the
// helicopter and the ambulance run faster, so each finishes its trip inside the shot. A pure
// function of time like the rest of the reel.
import { clamp, lerp, prog, outCubic, inOutSine, inOutCubic } from "../util.js";

const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

// the app's keyframes (index.html, cp*): opacity steps and the windows' flicker
const smooth = (x) => x * x * (3 - 2 * x);
function flick(t, period) { // cpFlick: 0 1, 37% .9, 61% .97, 80% .88, 100% 1, ease-in-out each step
  const K = [[0, 1], [0.37, 0.9], [0.61, 0.97], [0.8, 0.88], [1, 1]], p = ((t / period) % 1 + 1) % 1;
  for (let i = 1; i < K.length; i++) if (p <= K[i][0]) return lerp(K[i - 1][1], K[i][1], smooth((p - K[i - 1][0]) / (K[i][0] - K[i - 1][0])));
  return 1;
}
const cyc = (t, dur, delay = 0) => ((((t - delay) / dur) % 1) + 1) % 1; // a Web Animation's progress, delay negative as in the app
const blink = (t, period, delay = 0) => cyc(t, period, delay) < 0.5; // cpBlink, steps(1)

// a mover's keyframes: [{o: offset, p: [x, y, s], a: opacity}], linear between them
function track(keys, p) {
  let i = 1; while (i < keys.length - 1 && p > keys[i].o) i++;
  const A = keys[i - 1], B = keys[i], k = B.o > A.o ? clamp((p - A.o) / (B.o - A.o)) : 1;
  return { x: lerp(A.p[0], B.p[0], k), y: lerp(A.p[1], B.p[1], k), s: lerp(A.p[2], B.p[2], k), a: lerp(A.a, B.a, k) };
}
const spread = (pts, o0, o1, a = 1) => pts.map((p, j) => ({ o: o0 + (o1 - o0) * j / (pts.length - 1), p, a }));

export async function createCity(root, stage, W, H) {
  const M = await (await fetch("assets/city/entrance.json")).json();
  const K = M.w / 960; // the map is in the render's pixels; everything here is in the app's 960 x 760
  const n = (b) => b.map((v, i) => (i < 4 ? v / K : v)); // a box or point in 960 space (a point's scale stays)
  const img = {};
  const want = ["sky", "far", "near", "clouds", "flag0", "flag1", "flag2", "spray0", "spray1", "spray2", "spray3", "amb0", "amb1", "bay0", "bay1", "bay2",
    "lot0", "lot1", "car-in", "car-out", "car-in2", "birds0", "birds1", "heli0", "heli1", "street0", "street1", "street2", "street3",
    ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) => [`walk${i}-0`, `walk${i}-1`]), ...[0, 1, 2].flatMap((i) => [`sit${i}-0`, `sit${i}-1`]),
    ...["e", "t", "s", "n", "c"].flatMap((b) => Array.from({ length: 10 }, (_, j) => `${b}-lit${j + 1}`))];
  await Promise.all(want.map(async (k) => { img[k] = await loadImg(`assets/city/${k}.webp`); }));
  const L = M.live;

  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0";
  stage.after(cv); // over the 3D, under the scrim, the captions, the dip and Dr. Smiley
  const g = cv.getContext("2d");
  g.imageSmoothingQuality = "high";

  // the movers, each on the app's own clock
  const P = (pts) => pts.map((p) => [p[0] / K, p[1] / K, p[2]]);
  const ref = (r) => [r[0] / K, r[1] / K];
  const cars = [[L.carIn, "car-in"], [L.carOut, "car-out"], [L.carIn2, "car-in2"]].map(([c, im], i) => {
    const f = P(c.pts), m = f.length;
    return { im, box: n(c.img), ref: ref(c.ref), dur: 9 + i * 2.5, delay: -i * 4.3,
      keys: [{ o: 0, p: f[0], a: 0 }, { o: 0.06, p: f[0], a: 1 }, ...f.slice(1, -1).map((p, j) => ({ o: 0.06 + 0.88 * (j + 1) / (m - 1), p, a: 1 })), { o: 0.94, p: f[m - 1], a: 1 }, { o: 1, p: f[m - 1], a: 0 }] };
  });
  const mv = (o, i, step) => { const f = P(o.pts), m = f.length;
    return { box: n(o.img[0] ? (Array.isArray(o.img[0]) ? o.img[0] : o.img) : o.img), ref: ref(o.ref), dur: (o.dur || 20000) / 1000, delay: -i * step,
      keys: [{ o: 0, p: f[0], a: 0 }, { o: 0.03, p: f[0], a: 1 }, ...f.slice(1, -1).map((p, j) => ({ o: 0.03 + 0.94 * (j + 1) / (m - 1), p, a: 1 })), { o: 0.97, p: f[m - 1], a: 1 }, { o: 1, p: f[m - 1], a: 0 }] }; };
  const street = L.street.map((o, i) => ({ ...mv(o, i, 3.7), im: `street${i}` }));
  const walkers = L.walkers.map((o, i) => ({ ...mv(o, i, 5.3), i }));
  const birds = (() => { const f = P(L.birds.pts), m = f.length;
    return { ref: ref(L.birds.ref), keys: [{ o: 0, p: f[0], a: 0 }, { o: 0.02, p: f[0], a: 1 }, ...f.slice(1, -1).map((p, j) => ({ o: 0.02 + 0.4 * (j + 1) / (m - 1), p, a: 1 })), { o: 0.42, p: f[m - 1], a: 1 }, { o: 0.44, p: f[m - 1], a: 0 }, { o: 1, p: f[m - 1], a: 0 }] }; })();
  const heli = (() => { const f = P(L.heli.pts), m = f.length;
    return { ref: ref(L.heli.ref), keys: [{ o: 0, p: f[0], a: 0 }, { o: 0.02, p: f[0], a: 1 }, ...f.slice(1).map((p, j) => ({ o: 0.02 + 0.26 * (j + 1) / (m - 1), p, a: 1 })), { o: 1, p: f[m - 1], a: 1 }] }; })();
  const amb = (() => { const f = P(L.amb.pts), m = f.length;
    return { ref: ref(L.amb.ref), keys: [{ o: 0, p: f[0], a: 0 }, { o: 0.02, p: f[0], a: 1 }, ...f.slice(1).map((p, j) => ({ o: 0.02 + 0.3 * (j + 1) / (m - 1), p, a: 1 })), { o: 1, p: f[m - 1], a: 1 }] }; })();
  const lot = (() => { const f1 = P(L.lot.pts), f2 = P(L.lot.pts2);
    return { ref: ref(L.lot.ref), keys: [{ o: 0, p: f1[0], a: 0 }, { o: 0.03, p: f1[0], a: 1 }, { o: 0.34, p: f1[0], a: 1 }, ...f1.slice(1).map((p, j) => ({ o: 0.34 + 0.1 * (j + 1) / (f1.length - 1), p, a: 1 })),
      ...f2.slice(1).map((p, j) => ({ o: 0.44 + 0.26 * (j + 1) / (f2.length - 1), p, a: 1 })),
      { o: 0.7, p: f2.at(-1), a: 1 }, { o: 0.72, p: f2.at(-1), a: 0 }, { o: 1, p: f2.at(-1), a: 0 }] }; })();
  // the lit windows: one tenth per building at a time, in the app's order (e t s n c) and flicker periods
  const LIT = ["e", "t", "s", "n", "c"].map((b, i) => ({ b, i, boxes: M.b[b].lv.map(n), fl: 3.2 + i * 0.7 }));

  // draw one picture box through the camera: screen = D centre + (p - c) * s
  let V = null;
  const put = (im, box, x = box[0], y = box[1], w = box[2], h = box[3]) => {
    g.drawImage(img[im] || im, V.dx + (x - V.cx) * V.s, V.dy + (y - V.cy) * V.s, w * V.s, h * V.s);
  };
  // a mover: its box moved so the ref point lands on the track's point, scaled about it
  const putMover = (im, box, r, at, a = at.a) => {
    if (a <= 0.005) return;
    g.globalAlpha = a;
    const w = box[2] * at.s, h = box[3] * at.s, x = at.x - (r[0] - box[0]) * at.s, y = at.y - (r[1] - box[1]) * at.s;
    put(im, box, x, y, w, h);
    g.globalAlpha = 1;
  };

  /* the camera, in the app's picture (960 x 760). In the phone the whole campus fills the card's
     window R (projected from the 3D phone each frame); the window opens to the full frame while the
     view sinks toward the main hospital and the white tower's helipad. */
  const C0 = [480, 380], C2 = [458, 352], VIEW_H2 = 400;
  function camera(u, R) {
    const k = outCubic(prog(u, 0.98, 1.4)); // the window opens once the picture sits exactly on the phone's
    const D = { x: lerp(R.x, 0, k), y: lerp(R.y, 0, k), w: lerp(R.w, W, k), h: lerp(R.h, H, k) };
    const s0 = R.w / 960, s2 = H / VIEW_H2;
    const e = inOutSine(prog(u, 0.98, 3.0)) * 0.55 + inOutCubic(prog(u, 0.98, 3.0)) * 0.45;
    const s = Math.max(s0 * Math.pow(s2 / s0, e), D.h / 760, D.w / 960); // never smaller than the window
    let cx = lerp(C0[0], C2[0], e), cy = lerp(C0[1], C2[1], e);
    // keep the picture over the whole window
    const hw = D.w / 2 / s, hh = D.h / 2 / s;
    cx = clamp(cx, Math.min(480, hw), Math.max(480, 960 - hw)); cy = clamp(cy, Math.min(380, hh), Math.max(380, 760 - hh));
    return { D, s, cx, cy, e, k };
  }

  let box = null;
  function draw(u, t, R, opacity) {
    cv.style.opacity = String(opacity);
    box = null;
    if (opacity <= 0.001 || !R) return;
    const cam = camera(u, R), { D } = cam;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    g.save();
    g.beginPath(); g.rect(D.x, D.y, D.w, D.h); g.clip();
    g.fillStyle = "#d9cfd6"; g.fillRect(D.x, D.y, D.w, D.h);
    const at = (d, ds) => { // a layer at depth d (1 = the campus): drifts less and grows less as we sink
      const m = lerp(1, ds, cam.e);
      V = { s: cam.s * m, cx: lerp(C0[0], cam.cx, d), cy: lerp(C0[1], cam.cy, d) - (1 - d) * 70 * cam.e, dx: D.x + D.w / 2, dy: D.y + D.h / 2 };
    };
    at(0.35, 0.72); put("sky", [0, 0, 960, 760]);
    // the app's clouds: screen blend at half strength, drifting on their 70 s swing
    at(0.45, 0.78);
    const cx = Math.sin(Math.PI * (cyc(t, 140) * 2 - 0.5)) * 11.5;
    g.globalCompositeOperation = "screen"; g.globalAlpha = 0.5; put("clouds", n(L.clouds), n(L.clouds)[0] + cx); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    at(0.7, 0.88); put("far", [0, 0, 960, 760]);
    at(1, 1); put("near", [0, 0, 960, 760]);

    // the windows light up, building by building, as the questions are answered
    g.globalCompositeOperation = "screen";
    for (const w of LIT) {
      const lv = 10 * prog(u, 1.15 + w.i * 0.13, 2.25 + w.i * 0.13), whole = Math.floor(lv), part = lv - whole;
      const f = flick(t, w.fl);
      if (whole >= 1) { g.globalAlpha = f; put(`${w.b}-lit${whole}`, w.boxes[whole - 1]); }
      if (whole < 10 && part > 0.02) { g.globalAlpha = f * part; put(`${w.b}-lit${whole + 1}`, w.boxes[whole]); }
    }
    g.globalAlpha = 1;
    // the fountain's spray, 4 frames at .16 s, in the order the app's negative delays give
    const sp = [0, 3, 2, 1][Math.floor(cyc(t, 0.64) * 4)];
    put(`spray${sp}`, n(L.spray[sp]));
    g.globalCompositeOperation = "source-over";
    const fl = [0, 2, 1][Math.floor(cyc(t, 0.84) * 3)];
    put(`flag${fl}`, n(L.flags[fl]));

    // the bay doors and the ambulance: in the app a 34 s trip, here pulled into the shot
    const ap = lerp(0.0, 0.34, prog(u, 0.7, 2.55));
    const bayF = ap < 0.26 ? 0 : ap < 0.29 ? 1 : 2;
    put(`bay${bayF}`, n(L.bay[bayF]));
    const A = track(amb.keys, ap), ab = n(L.amb.img[0]);
    putMover(blink(t, 0.36, -0.18) ? "amb0" : "amb1", ab, amb.ref, A);
    // cars up and down the drive, Second Street, the lot car: the app's clocks
    for (const c of cars) putMover(c.im, c.box, c.ref, track(c.keys, cyc(t, c.dur, c.delay)));
    for (const c of street) putMover(c.im, c.box, c.ref, track(c.keys, cyc(t, c.dur, c.delay)));
    const lp = cyc(t, 46, -9), LT = track(lot.keys, lp);
    if (lp < 0.441) putMover("lot0", n(L.lot.img[0]), lot.ref, LT);
    else putMover("lot1", n(L.lot.img[1]), lot.ref, LT); // its driving look, nosed east
    // walkers (two leg frames at .6 s) and the bench sitters (a head turn every 7 s)
    for (const w of walkers) {
      const legs = blink(t, 0.6) ? 1 : 0; // walk-1 on the first half, walk-0 (delay -.3 s) the second
      putMover(`walk${w.i}-${legs}`, n(L.walkers[w.i].img[legs]), w.ref, track(w.keys, cyc(t, w.dur, w.delay)));
    }
    L.sitters.forEach((o, i) => { const turned = cyc(t, 7, -2.3 * i) >= 0.78 ? 1 : 0; put(`sit${i}-${turned}`, n(o.img[turned])); });
    // the helicopter comes in over the towers and settles on the white tower's pad (app: 13 s, here 1.7 s)
    const hp = lerp(0, 0.3, inOutSine(prog(u, 1.0, 2.75)));
    putMover(blink(t, 0.36) ? "heli1" : "heli0", n(L.heli.img[0]), heli.ref, track(heli.keys, hp));
    // the flock crosses the sky (wings at .34 s), a little nearer than the clouds
    at(0.8, 0.9);
    const bp = lerp(0.04, 0.4, prog(u, 0.6, 3.0)), Bt = track(birds.keys, bp), bw = blink(t, 0.34, -0.17) ? 0 : 1;
    putMover(`birds${bw}`, n(L.birds.img[bw]), birds.ref, Bt);
    at(1, 1);

    // the haze we sink through, and a cloud passing close to the lens
    const haze = 0.42 * (1 - prog(u, 0.95, 2.0)) * cam.k;
    if (haze > 0.005) { g.fillStyle = `rgba(244,226,222,${haze})`; g.fillRect(D.x, D.y, D.w, D.h); }
    const cp = prog(u, 0.9, 1.9);
    if (cp > 0 && cp < 1) {
      const cl = img.clouds, cw = W * lerp(1.6, 4.2, cp), ch = cw * cl.height / cl.width;
      g.globalCompositeOperation = "screen"; g.globalAlpha = 0.55 * Math.sin(Math.PI * cp);
      g.drawImage(cl, W / 2 - cw * lerp(0.35, 0.62, cp), lerp(H * 0.55, H * 0.1, cp) - ch / 2, cw, ch);
      g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    }
    // a soft navy edge so the captions and Dr. Smiley sit on it the way they sit on the desk
    const vg = g.createRadialGradient(W / 2, H * 0.5, H * 0.25, W / 2, H * 0.5, H * 0.75);
    vg.addColorStop(0, "rgba(3,6,26,0)"); vg.addColorStop(1, `rgba(3,6,26,${0.55 * cam.k})`);
    g.fillStyle = vg; g.fillRect(D.x, D.y, D.w, D.h);
    g.restore();

    // "145 Questions": counts up as the campus lights, a glass pill under the hospital
    const ca = prog(u, 1.2, 1.5) * (1 - prog(u, 2.45, 2.6)); // gone before he hops out
    if (ca > 0.001) {
      const q = u >= 2.15 ? 145 : Math.round(145 * outCubic(prog(u, 1.25, 2.15)));
      const label = `${q} Questions`, fs = Math.round(H * 0.05);
      g.font = `800 ${fs}px "Inter Tight"`;
      const tw = g.measureText("145 Questions").width, pw = tw + fs * 1.1, ph = fs * 1.55;
      const px = W / 2 - pw / 2, py = H * 0.6 + (1 - outCubic(ca)) * H * 0.02;
      g.globalAlpha = ca;
      g.fillStyle = "rgba(10,18,52,0.62)"; g.beginPath(); g.roundRect(px, py, pw, ph, ph / 2); g.fill();
      g.strokeStyle = "rgba(63,198,238,0.9)"; g.lineWidth = Math.max(2, H * 0.0028); g.stroke();
      g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
      g.shadowColor = "rgba(63,198,238,0.55)"; g.shadowBlur = fs * 0.5;
      g.fillText(label, W / 2, py + ph / 2 + fs * 0.04);
      g.shadowBlur = 0; g.globalAlpha = 1;
      box = { x: px, y: py, w: pw, h: ph };
    }
  }
  // where the counter is on screen (for Dr. Smiley's check): null until it shows
  return { draw, box: () => box, canvas: cv };
}
