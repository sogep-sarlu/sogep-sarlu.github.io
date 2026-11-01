/* Globe 3D de l'ouverture (three.js) : la Terre en fils dorés, Conakry en point lumineux,
   et des arcs d'approvisionnement qui convergent vers Conakry (importation sur demande). */
import * as THREE from '../vendor/three.module.min.js';

const canvas = document.getElementById('globe');
const hero = canvas && canvas.closest('.hero');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && hero) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch (e) { renderer = null; }
  if (renderer) init(renderer);
}

function init(renderer) {
  const GOLD = new THREE.Color('#D4AE3A');
  const GOLD2 = new THREE.Color('#F3D77A');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

  const world = new THREE.Group();
  scene.add(world);
  const globe = new THREE.Group();
  world.add(globe);
  const R = 1.6;

  // conversion latitude / longitude -> position sur la sphère
  const toV = (lat, lon, r = R) => {
    const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  };

  // sphère sombre qui masque l'arrière du globe
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 48, 48), new THREE.MeshBasicMaterial({ color: 0x0b1528, transparent: true, opacity: 0.85 })));

  // méridiens et parallèles
  const gridMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.22 });
  for (let lat = -75; lat <= 75; lat += 15) {
    const pts = []; for (let lon = -180; lon <= 180; lon += 4) pts.push(toV(lat, lon));
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }
  for (let lon = -180; lon < 180; lon += 15) {
    const pts = []; for (let lat = -90; lat <= 90; lat += 4) pts.push(toV(lat, lon));
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }
  // équateur plus marqué
  { const pts = []; for (let lon = -180; lon <= 180; lon += 2) pts.push(toV(0, lon, R * 1.001));
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.45 }))); }

  // semis de points
  const N = 1400, dots = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = Math.PI * (3 - Math.sqrt(5)) * i;
    dots.set([Math.cos(th) * r * R * 1.002, y * R * 1.002, Math.sin(th) * r * R * 1.002], i * 3);
  }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dots, 3));
  globe.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: GOLD2, size: 0.018, transparent: true, opacity: 0.55 })));

  // Conakry
  const CKY = toV(9.64, -13.58, R * 1.01);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 20), new THREE.MeshBasicMaterial({ color: GOLD2 }));
  pin.position.copy(CKY); globe.add(pin);
  const ringGeo = new THREE.RingGeometry(0.06, 0.075, 48);
  const rings = [0, 1, 2].map(i => {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: GOLD2, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    m.position.copy(CKY); m.lookAt(CKY.clone().multiplyScalar(2)); m.userData.off = i / 3; globe.add(m); return m;
  });

  // arcs d'approvisionnement vers Conakry
  const origins = [[23.13, 113.26], [25.2, 55.27], [51.22, 4.4], [43.3, 5.37], [14.69, -17.44], [6.45, 3.39], [40.71, -74.0]];
  const arcs = origins.map(([la, lo], i) => {
    const a = toV(la, lo, R * 1.005), b = CKY.clone();
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const h = 1 + a.distanceTo(b) * 0.32;
    mid.normalize().multiplyScalar(R * h);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(80)), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.5 }));
    globe.add(line);
    const start = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), new THREE.MeshBasicMaterial({ color: GOLD }));
    start.position.copy(a); globe.add(start);
    const runner = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    globe.add(runner);
    return { curve, runner, off: i / origins.length, speed: 0.16 + (i % 3) * 0.03 };
  });

  // deux anneaux fléchés en orbite, comme le logo
  function orbit(radius, tilt, color) {
    const g = new THREE.Group();
    const arcGeo = new THREE.TorusGeometry(radius, 0.012, 8, 120, Math.PI * 1.35);
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    g.add(new THREE.Mesh(arcGeo, m));
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 16), m);
    const ang = Math.PI * 1.35;
    head.position.set(Math.cos(ang) * radius, Math.sin(ang) * radius, 0);
    head.rotation.z = ang; // pointe dans le sens de la rotation
    g.add(head);
    g.rotation.x = tilt;
    world.add(g);
    return g;
  }
  const o1 = orbit(R * 1.28, 1.15, GOLD2);
  const o2 = orbit(R * 1.4, 1.95, GOLD);
  o2.rotation.y = Math.PI;

  // Conakry tournée vers le visiteur
  const FACE = 1.0; // décalage : Conakry un peu à gauche du centre, hors de la photo
  globe.rotation.y = Math.atan2(-CKY.x, CKY.z) - FACE;
  globe.rotation.x = 0.12;
  const baseY = globe.rotation.y;

  // placement : à droite derrière la photo sur grand écran, centré en haut sur mobile
  let maxOpacity = 1;
  function layout() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const wide = w > 940;
    const vh = 2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.z, vw = vh * camera.aspect;
    world.position.x = wide ? vw * 0.24 : 0;
    world.position.y = wide ? 0 : -vh * 0.3; // sur mobile : derrière la photo, pas derrière le texte
    maxOpacity = wide ? 1 : 0.6;
    const s = wide ? Math.min(1.25, vh / 4.6) : Math.min(1, vw / 4.2);
    world.scale.setScalar(s);
  }
  layout();
  new ResizeObserver(layout).observe(hero);

  // parallaxe à la souris
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 0.35;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 0.2;
  });

  let visible = true, raf = 0, t0 = performance.now(), intro = 0;
  const startAt = performance.now();
  let delay = 0;
  window.addEventListener('sogep:hero', e => { delay = (e.detail && e.detail.delay) || 0; }, { once: true });

  function frame(now) {
    raf = 0;
    const t = (now - t0) / 1000;
    intro = Math.min(1, Math.max(0, (now - startAt - delay) / 1600));
    const ease = 1 - Math.pow(1 - intro, 3);
    globe.rotation.y = baseY + t * 0.05 + (1 - ease) * -1.2;
    cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
    world.rotation.y = cur.x; world.rotation.x = cur.y;
    canvas.style.opacity = String(ease * maxOpacity);
    o1.rotation.z = t * 0.35; o2.rotation.z = -t * 0.28;
    rings.forEach(r => { const k = (t * 0.6 + r.userData.off) % 1; r.scale.setScalar(1 + k * 3.2); r.material.opacity = 0.85 * (1 - k); });
    arcs.forEach(a => { const k = (t * a.speed + a.off) % 1; a.runner.position.copy(a.curve.getPoint(k)); });
    renderer.render(scene, camera);
    if (visible && !reduce) raf = requestAnimationFrame(frame);
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf && !reduce) raf = requestAnimationFrame(frame); }).observe(hero);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible && !raf && !reduce) raf = requestAnimationFrame(frame); });
  if (reduce) { intro = 1; t0 = performance.now(); frame(performance.now() + 5000); }
  else raf = requestAnimationFrame(frame);
}
