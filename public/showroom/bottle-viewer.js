// Small live 3D bottle views for cards, the scent finder, the layering lab and the bag.
// One shared WebGL renderer draws every visible view and copies the frame into that view's
// own 2D canvas, so the page can show many bottles without opening many WebGL contexts.
// Shares the three.js bundle and glass/liquid shader with the main showroom engine.
import {addLiquidRefraction, bindLiquidCamera} from './glass-volume.js?v=white-studio-1';
import {
  ACESFilmicToneMapping, AmbientLight, Box3, Color, DoubleSide, GLTFLoader, Group, Mesh, MeshBasicMaterial,
  PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, SpotLight, SRGBColorSpace, Vector3, WebGLRenderer
} from './three-showroom.js?v=2';

const PRODUCTS = {
  galet: {key:'galet', file:'galet-crystal.glb', glass:'#d8f8e1', absorption:'#56ba78', liquid:'#079c41', distance:1.18, thickness:.012, level:.88661, rest:-.35},
  rose:  {key:'rose',  file:'rose-lune-smoked.glb', glass:'#ffe0ed', absorption:'#d45b8a', liquid:'#c91862', distance:1.16, thickness:.016, level:.94172, rest:.3},
  iris:  {key:'iris',  file:'iris.glb', glass:'#efe4ff', absorption:'#9962ce', liquid:'#813eca', distance:1.2, thickness:.035, level:.90881, rest:-.3},
  terre: {key:'terre', file:'grenat.glb', glass:'#ffe7b9', absorption:'#985c2b', liquid:'#a36521', distance:1.2, thickness:.035, level:.92150, rest:.3},
  nacre: {key:'nacre', file:'nacre.glb', glass:'#e1faf6', absorption:'#56b8ad', liquid:'#21b6a5', distance:1.2, thickness:.035, level:.84475, rest:-.3}
};
const FOV = 26;
const base = new URL('.', import.meta.url);
const views = new Set();
const bottles = new Map();
let renderer, environment, loader, running = false, failed = false, last = 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function boot() {
  if (renderer || failed) return !failed;
  try {
    renderer = new WebGLRenderer({alpha: true, antialias: true, premultipliedAlpha: true});
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.addEventListener('webglcontextlost', () => { failed = true; for (const v of views) v.onFail?.(); });
    const studio = new Scene();
    studio.background = new Color(.09, .085, .1);
    const panels = [
      {size: [2.2, 5.1], position: [-3.3, 2.4, 2.9], color: '#fff4e9', energy: 5.4},
      {size: [.9, 4.1], position: [4.2, .65, 2.35], color: '#f2f4ff', energy: 2.6},
      {size: [3.2, 1.0], position: [.25, 4.25, .6], color: '#fff5ec', energy: 2.75},
      {size: [1.4, 3.4], position: [1.6, 1.2, -3.6], color: '#ffffff', energy: 2.2}
    ];
    for (const {size, position, color, energy} of panels) {
      const light = new Mesh(new PlaneGeometry(...size), new MeshBasicMaterial({color: new Color(color).multiplyScalar(energy), toneMapped: false, side: DoubleSide}));
      light.position.set(...position);
      light.lookAt(0, 0, 0);
      studio.add(light);
    }
    const pmrem = new PMREMGenerator(renderer);
    environment = pmrem.fromScene(studio, .035).texture;
    pmrem.dispose();
    loader = new GLTFLoader();
    return true;
  } catch (error) {
    failed = true;
    return false;
  }
}

function loadBottle(key) {
  if (bottles.has(key)) return bottles.get(key);
  const product = {...PRODUCTS[key], fluidMotion: new Vector3(), fluidLight: {value: 5.2}};
  const url = new URL(product.file, base);
  url.searchParams.set('v', key === 'terre' ? 'bronze-4' : 'spirits-1');
  const promise = loader.loadAsync(url.href).then(({scene: model}) => {
    const bottle = new Group();
    bottle.add(model);
    const bounds = new Box3().setFromObject(bottle);
    const liquidBounds = new Box3();
    const size = bounds.getSize(new Vector3());
    const scale = 1 / size.y;
    const center = bounds.getCenter(new Vector3());
    bottle.traverse(mesh => {
      if (mesh.isMesh && /eau de parfum/i.test(mesh.material.name)) liquidBounds.expandByObject(mesh);
    });
    bottle.traverse(mesh => {
      if (!mesh.isMesh) return;
      const material = mesh.material;
      if (/eau de parfum/i.test(material.name)) {
        mesh.visible = false;
      } else if (/clear.*cap crystal/i.test(material.name)) {
        material.color.set('#fff8e8');
        material.attenuationColor = new Color('#fff0d5');
        material.attenuationDistance = 2.2;
        material.transmission = .96;
        material.thickness = .022;
        material.ior = 1.49;
        material.roughness = .03;
        material.envMapIntensity = 1.6;
      } else if (/crystal/i.test(material.name)) {
        material.color.set(product.glass).lerp(new Color(product.liquid), .35);
        material.attenuationColor = new Color(product.absorption);
        material.attenuationDistance = product.distance * 1.7;
        material.transmission = .97;
        material.thickness = product.thickness * 1.45;
        material.ior = 1.512;
        material.roughness = .02;
        material.clearcoat = .35;
        material.clearcoatRoughness = .025;
        material.envMapIntensity = 1.7;
        material.side = DoubleSide;
        if (!liquidBounds.isEmpty()) {
          const cavity = liquidBounds.clone();
          cavity.max.y = new Box3().setFromObject(mesh).max.y;
          addLiquidRefraction(mesh, cavity, product, product.level);
        }
      } else if (/satin bronze plaque|champagne raised type/i.test(material.name)) {
        material.envMapIntensity = 2.2;
      } else if (/(print|label)/i.test(material.name) && material.map) {
        material.map.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
        material.map.colorSpace = SRGBColorSpace;
        mesh.material = new MeshBasicMaterial({
          name: material.name, map: material.map, alphaTest: material.alphaTest, color: '#fffef9', toneMapped: false,
          polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
        });
      } else if (/brushed champagne/i.test(material.name) && (key === 'terre' || key === 'iris')) {
        material.roughness = key === 'iris' ? .22 : .39;
        material.metalness = .98;
        material.envMapIntensity = 1.5;
      } else if (/atomizer tube/i.test(material.name)) {
        material.transmission = 0;
        material.color.set('#64605d');
        material.roughness = .31;
      } else if (/pearl|lacquer|cap/i.test(material.name)) {
        material.envMapIntensity = .9;
        if (key === 'galet') { material.color.set('#f4f1e9'); material.roughness = .26; material.metalness = .14; }
      }
    });
    bottle.position.copy(center).multiplyScalar(-scale);
    bottle.scale.setScalar(scale);
    bottle.updateMatrixWorld(true);
    bindLiquidCamera(bottle);
    const pivot = new Group();
    pivot.add(bottle);
    const scene = new Scene();
    scene.environment = environment;
    scene.environmentIntensity = .62;
    scene.add(new AmbientLight('#e6e4f5', .08));
    const key1 = new SpotLight('#fff3e4', 26, 0, .6, .9);
    key1.position.set(-2.4, 2.6, 3.2);
    scene.add(key1, key1.target);
    const rim = new SpotLight(product.liquid, 60, 0, .7, 1);
    rim.position.set(2.2, .4, -2.6);
    scene.add(rim, rim.target);
    scene.add(pivot);
    return {scene, pivot, radius: Math.max(size.x, size.z) * scale, rest: product.rest};
  });
  bottles.set(key, promise);
  return promise;
}

function draw(view, time) {
  const {canvas} = view;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; view.dirty = true; }
  const gl = renderer.domElement;
  if (gl.width !== w || gl.height !== h) renderer.setSize(w, h, false);
  const camera = view.camera;
  camera.aspect = w / h;
  const half = Math.tan(FOV * Math.PI / 360);
  const fitH = .6 / half;
  const fitW = (view.bottle.radius * .6) / (half * camera.aspect);
  camera.position.set(0, .04, Math.max(fitH, fitW));
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  view.bottle.pivot.rotation.set(view.tilt, view.angle, 0);
  view.bottle.pivot.position.y = view.spin ? Math.sin(time / 1400 + view.phase) * .012 : 0;
  renderer.render(view.bottle.scene, camera);
  const ctx = view.ctx;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(gl, 0, 0);
  view.dirty = false;
  if (!view.shown) { view.shown = true; view.onReady?.(); }
}

function frame(time) {
  const dt = Math.min(.05, (time - last) / 1000 || 0);
  last = time;
  let active = false;
  for (const view of views) {
    if (!view.bottle || !view.visible) continue;
    const moving = view.spin && !reduced.matches;
    if (moving && !view.dragging) view.angle += dt * .42;
    if (Math.abs(view.velocity) > .0005) { view.angle += view.velocity; view.velocity *= .93; view.dirty = true; }
    if (moving || view.dirty || view.dragging) { draw(view, time); active = active || moving || Math.abs(view.velocity) > .0005 || view.dragging; }
  }
  if (active) requestAnimationFrame(frame); else running = false;
}
function wake() { if (!running && !failed) { running = true; requestAnimationFrame(frame); } }

const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    const view = entry.target.__bottleView;
    if (!view) continue;
    view.visible = entry.isIntersecting;
    if (view.visible) { view.dirty = true; wake(); }
  }
}, {rootMargin: '120px'}) : null;
const resizer = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
  for (const entry of entries) { const view = entry.target.__bottleView; if (view) view.dirty = true; }
  wake();
}) : null;

/** Mount a live bottle into a <canvas>. Returns an unmount function. */
export function mountBottle(canvas, key, options = {}) {
  if (!PRODUCTS[key] || !boot()) { options.onFail?.(); return () => {}; }
  const view = {
    canvas, ctx: canvas.getContext('2d'), camera: new PerspectiveCamera(FOV, 1, .05, 30), bottle: null,
    spin: options.spin !== false, angle: 0, tilt: .05, velocity: 0, phase: Math.random() * 6, dragging: false,
    visible: !observer, dirty: true, shown: false, onReady: options.onReady, onFail: options.onFail
  };
  canvas.__bottleView = view;
  views.add(view);
  observer?.observe(canvas);
  resizer?.observe(canvas);
  loadBottle(key).then(bottle => {
    view.bottle = bottle;
    view.angle = bottle.rest;
    view.dirty = true;
    wake();
  }).catch(() => options.onFail?.());

  let lastX = 0;
  const down = event => { view.dragging = true; lastX = event.clientX; view.velocity = 0; canvas.setPointerCapture?.(event.pointerId); wake(); };
  const move = event => {
    if (!view.dragging) return;
    const dx = event.clientX - lastX; lastX = event.clientX;
    view.angle += dx * .012; view.velocity = dx * .012; view.dirty = true;
  };
  const up = () => { view.dragging = false; wake(); };
  if (options.drag) {
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
  }
  return () => {
    views.delete(view);
    observer?.unobserve(canvas);
    resizer?.unobserve(canvas);
    delete canvas.__bottleView;
    if (options.drag) {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
    }
  };
}
