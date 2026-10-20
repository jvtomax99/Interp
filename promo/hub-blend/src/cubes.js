// Scene 3: rippling grid of extruded cubes with a glass sphere, rendered into the screen texture.
import * as THREE from "three";
import { clamp, lerp, prog, outCubic, inOutCubic, outBack, hex, mixRGB } from "./util.js";

const N = 34;
const SP = 0.105;

const STEEL = hex("#2b3f6b");
const STOPS = ["#0b1640", "#1a3a96", "#2f7fe0", "#3fc6ee", "#d8f6ff"].map(hex);

function gradient(h) {
  const x = clamp(h) * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(x));
  return mixRGB(STOPS[i], STOPS[i + 1], x - i);
}

export function createCubes(aspect) {
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, aspect, 0.05, 50);

  const geo = new THREE.BoxGeometry(0.092, 1, 0.092);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.05 });
  const mesh = new THREE.InstancedMesh(geo, mat, N * N);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * N * 3), 3);
  scene.add(mesh);

  const dir = new THREE.DirectionalLight(0xffffff, 2.4);
  dir.position.set(2.5, 5, 3);
  scene.add(dir);
  scene.add(new THREE.HemisphereLight(0xd6ecff, 0x0b1030, 1.3));
  const pl = new THREE.PointLight(0x3fc6ee, 0, 3, 1.5);
  pl.position.set(0, 0.7, 0);
  scene.add(pl);

  const orb = new THREE.Group();
  scene.add(orb);
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 48, 32),
    new THREE.MeshStandardMaterial({
      color: 0xcfeeff, emissive: 0x2a5a7a, emissiveIntensity: 0.7, roughness: 0.08, metalness: 0.1,
      transparent: true, opacity: 0.9,
    }),
  );
  orb.add(sphere);
  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.17, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.55 }),
  );
  orb.add(inner);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.006, 8, 160), ringMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.004, 8, 160), ringMat);
  orb.add(ring1, ring2);

  // early glowing core
  const gc = document.createElement("canvas");
  gc.width = gc.height = 128;
  const g = gc.getContext("2d");
  const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, "rgba(255,255,255,1)");
  rg.addColorStop(0.2, "rgba(170,230,255,0.8)");
  rg.addColorStop(1, "rgba(60,180,240,0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(gc);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(glow);

  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();

  function update(lt) {
    const amp = 0.55 * outCubic(prog(lt, 0.45, 1.3));
    const pc = prog(lt, 0.35, 0.95);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const x = (i - (N - 1) / 2) * SP;
        const z = (j - (N - 1) / 2) * SP;
        const d = Math.sqrt(x * x + z * z);
        const wave = 0.5 + 0.5 * Math.sin(d * 8.5 - lt * 7);
        let h = 0.05 + amp * (0.25 + 0.75 * wave) * Math.exp(-d * 0.5) - amp * 0.3 * Math.exp(-d * d * 9);
        h = Math.max(0.03, h);
        const k = i * N + j;
        m4.makeScale(1, h, 1);
        m4.setPosition(x, 0, z);
        mesh.setMatrixAt(k, m4);
        const hn = clamp(h / 0.6);
        const steel = [STEEL[0] * (0.75 + 0.5 * hn), STEEL[1] * (0.75 + 0.5 * hn), STEEL[2] * (0.75 + 0.5 * hn)];
        const c = mixRGB(steel, gradient(hn * 1.1), pc);
        col.setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace);
        mesh.setColorAt(k, col);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;

    const os = outBack(prog(lt, 0.5, 0.9));
    orb.visible = os > 0.001;
    orb.scale.setScalar(Math.max(0.001, os));
    orb.position.set(0, 0.6 + 0.04 * Math.sin(lt * 4), 0);
    ring1.rotation.set(1.2, 0.3, lt * 1.6);
    ring2.rotation.set(-0.9, 0.8, -lt * 2.1);
    inner.rotation.set(lt * 0.8, lt * 1.1, 0);
    pl.intensity = 3 * pc;

    const ga = (1 - prog(lt, 0.5, 0.75)) * prog(lt, 0, 0.1);
    glow.visible = ga > 0;
    glow.material.opacity = ga;
    glow.position.set(0, 0.08, 0);
    glow.scale.setScalar(0.35 + 0.08 * Math.sin(lt * 16));

    const th = lerp(-1.1, -0.45, outCubic(prog(lt, 0, 2.1)));
    const ph = lerp(1.2, 0.6, inOutCubic(prog(lt, 0, 1.2)));
    const r = lerp(4.7, 3.5, outCubic(prog(lt, 0, 2.1)));
    cam.position.set(r * Math.cos(ph) * Math.sin(th), r * Math.sin(ph), r * Math.cos(ph) * Math.cos(th));
    cam.lookAt(0, 0.15, 0);
  }

  return {
    render(renderer, lt) {
      update(lt);
      renderer.render(scene, cam);
    },
  };
}
