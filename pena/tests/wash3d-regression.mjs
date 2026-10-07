import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import { CARS, getOrder, createState, progress, saveState, loadState, finishOrder } from '../dist/engine.js';
import { createVehicle, createInteriorVehicle } from '../dist/vehicles3d.js';
import { createSurfaceDirt, applySurfaceTool, automateSurface, surfaceRadius } from '../dist/wash3d.js';

let passed = 0;
function check(name, test) { test(); passed++; console.log(`✓ ${name}`); }
const hitAt = point => ({ point: new THREE.Vector3(point.wx, point.wy, point.wz), normal: new THREE.Vector3(point.nx, point.ny, point.nz) });
const spot = (type = 'dust', values = {}) => ({ id: 0, surfaceId: 'front', x: 123, y: 222, wx: 0, wy: 0, wz: 0, nx: 0, ny: 0, nz: 1, zone: 'body', type, amount: 1, initial: 1, foam: 0, radius: 12, ...values });
function use(points, tool, seconds, hit = hitAt(points[0]), upgrades = {}) {
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) applySurfaceTool(points, tool, hit, 0.05, upgrades);
}
function parallelPanels() {
  const group = new THREE.Group(); group.position.x = 3;
  const surfaces = [];
  for (let i = 0; i < 3; i++) {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uv = geometry.attributes.uv;
    for (let j = 0; j < uv.count; j++) uv.setXY(j, (uv.getX(j) + i) / 3, uv.getY(j));
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    mesh.position.z = i === 1 ? -0.04 : i === 2 ? -0.14 : 0;
    if (i === 1) mesh.rotation.y = Math.PI;
    group.add(mesh);
    surfaces.push({ id: `p${i}`, mesh, zone: 'body', rect: { x: i * 1000 / 3, y: 0, w: 1000 / 3, h: 620 } });
  }
  return { group, surfaces };
}

const planes = parallelPanels();
const sampled = createSurfaceDirt(planes, getOrder(1));

check('Sampling is deterministic and follows the world transform', () => {
  assert.equal(sampled.length, 1800);
  assert.deepEqual(createSurfaceDirt(planes, getOrder(1)), sampled);
  assert(sampled.every(p => p.wx >= 2 && p.wx <= 4 && p.wy >= -1 && p.wy <= 1));
});
check('Atlas UVs and transformed normals match their exact mesh', () => {
  assert(sampled.filter(p => p.surfaceId === 'p0').every(p => p.x >= 0 && p.x <= 1000 / 3));
  assert(sampled.filter(p => p.surfaceId === 'p1').every(p => p.nz < -0.99));
});
check('Contact cleans locally and never changes stored atlas coordinates', () => {
  const points = sampled.map(p => ({ ...p }));
  const target = points.find(p => p.surfaceId === 'p0' && Math.abs(p.wx - 3) < 0.2 && Math.abs(p.wy) < 0.2);
  const before = points.map(p => [p.x, p.y]);
  const hit = hitAt(target);
  assert(applySurfaceTool(points, 'water', hit, 0.2) > 0);
  assert(target.amount < target.initial);
  assert(points.every((p, i) => p.x === before[i][0] && p.y === before[i][1]));
  assert(points.every(p => Math.hypot(p.wx - hit.point.x, p.wy - hit.point.y, p.wz - hit.point.z) <= surfaceRadius('water') || p.amount === p.initial));
});
check('Opposite and deeper parallel panels cannot be washed through', () => {
  const front = spot(), back = spot('dust', { wz: -0.04, nz: -1 }), hidden = spot('dust', { wz: -0.14 });
  use([front, back, hidden], 'water', 1);
  assert.equal(front.amount, 0);
  assert.equal(back.amount, 1);
  assert.equal(hidden.amount, 1);
});
check('Foam softens world-space mud and accelerates rinsing', () => {
  const plain = [spot('mud')], softened = [spot('mud')];
  use(plain, 'water', 0.5);
  use(softened, 'foam', 0.5);
  assert(softened[0].foam > 0.8);
  use(softened, 'water', 0.5);
  assert(softened[0].amount < plain[0].amount - 0.6);
});
check('Rinsing clean 3D foam requests an atlas redraw without moving its UV', () => {
  const cleanFoam = spot('dust', { amount: 0, foam: 1 });
  const dirtyFoam = spot('dust', { wx: 0.1, foam: 1 });
  assert.equal(applySurfaceTool([cleanFoam, dirtyFoam], 'water', hitAt(cleanFoam), 0.1), 2);
  assert(cleanFoam.foam < 1);
  assert(dirtyFoam.amount < 1 && dirtyFoam.foam < 1);
  assert.equal(cleanFoam.x, 123); assert.equal(cleanFoam.y, 222);
  assert.equal(applySurfaceTool([cleanFoam], 'water', hitAt(cleanFoam), 0.1), 1);
});
check('Every specialty tool keeps its intended chemistry in 3D', () => {
  for (const [type, tool, zone] of [['bugs', 'sponge', 'body'], ['oil', 'degreaser', 'body'], ['wheel', 'brush', 'rims'], ['crumbs', 'vacuum', 'mats'], ['trash', 'hand', 'mats'], ['stain', 'sponge', 'seats']]) {
    const correct = [spot(type, { zone })], wrong = [spot(type, { zone })];
    use(correct, tool, 1); use(wrong, 'water', 1);
    assert.equal(correct[0].amount, 0, type);
    assert(wrong[0].amount > 0.7, type);
  }
});
check('Each cosmetic service requires its own local action', () => {
  for (const service of ['polish', 'coat', 'paint', 'rims']) {
    const points = [spot(service)];
    use(points, 'water', 1);
    assert.equal(points[0].amount, 1);
    use(points, service, 1);
    assert.equal(points[0].amount, 0);
  }
});
check('All eight vehicle and interior atlases contain valid 3D samples', () => {
  for (const car of CARS) for (const interior of [false, true]) {
    const vehicle = interior ? createInteriorVehicle(car.id) : createVehicle(car.id);
    const points = createSurfaceDirt(vehicle, getOrder(40), { interior });
    const surfaces = new Map(vehicle.surfaces.map(surface => [surface.id, surface]));
    assert(points.length >= (interior ? 700 : 1700));
    for (const p of points) {
      const rect = surfaces.get(p.surfaceId).rect;
      assert(p.x >= rect.x - 0.001 && p.x <= rect.x + rect.w + 0.001, `${car.id} atlas x`);
      assert(p.y >= rect.y - 0.001 && p.y <= rect.y + rect.h + 0.001, `${car.id} atlas y`);
      assert(Math.abs(Math.hypot(p.nx, p.ny, p.nz) - 1) < 0.001, `${car.id} normal`);
    }
  }
});
check('Every interior can finish from legal first-person camera positions', () => {
  const raycaster = new THREE.Raycaster();
  for (const car of CARS) {
    const vehicle = createInteriorVehicle(car.id);
    const points = createSurfaceDirt(vehicle, getOrder(1), { interior: true });
    vehicle.group.updateMatrixWorld(true);
    const meshes = vehicle.surfaces.map(surface => surface.mesh);
    const halfX = vehicle.dimensions.width / 2 - 0.12;
    const halfZ = vehicle.dimensions.length / 2 - 0.18;
    const cameras = [];
    for (let x = 0; x < 7; x++) for (let z = 0; z < 11; z++) {
      cameras.push(new THREE.Vector3(-halfX + x * halfX / 3, 1.48, -halfZ + z * halfZ / 5));
    }
    const visible = points.filter(point => {
      const target = new THREE.Vector3(point.wx, point.wy, point.wz);
      const normal = new THREE.Vector3(point.nx, point.ny, point.nz);
      return cameras.some(camera => {
        const direction = target.clone().sub(camera).normalize();
        if (direction.dot(normal) > -0.005) return false;
        const pitch = -Math.asin(direction.y);
        if (pitch > 1.35 || pitch < -1.45) return false;
        raycaster.set(camera, direction);
        const first = raycaster.intersectObjects(meshes, false)[0];
        return first && first.point.distanceTo(target) < 0.02;
      });
    });
    // Contact only points that can be aimed at. The real radius may clear nearby
    // edges; the normal 97% threshold must take care of genuinely tiny leftovers.
    for (const point of visible) {
      const tool = point.type === 'trash' ? 'hand' : point.type === 'stain' ? 'sponge' : 'vacuum';
      const hit = hitAt(point);
      for (let i = 0; i < 4; i++) applySurfaceTool(points, tool, hit, 0.25, {});
    }
    assert.equal(progress(points).total, 100, `${car.id}: inaccessible dirt blocks completion`);
  }
});
check('Automatic helpers have visible contacts, preserve difficult spots, and respect toggles', () => {
  const active = [spot(), spot('oil')], disabled = [spot()];
  let events = [];
  for (let time = 0; time < 3; time += 0.1) {
    events.push(...automateSurface(active, 0.1, { assistant: 1 }, { assistant: true }, time));
    automateSurface(disabled, 0.1, { assistant: 1 }, { assistant: false }, time);
  }
  assert(events.some(event => event.id === 'assistant' && Number.isFinite(event.x) && Number.isFinite(event.nz)));
  assert.equal(active[0].amount, 0); assert.equal(active[1].amount, 1); assert.equal(disabled[0].amount, 1);
  const mud = [spot('mud')];
  assert(automateSurface(mud, 0.25, { autoFoam: 1 }, {}, 0).some(event => event.id === 'autoFoam'));
  assert(mud[0].foam > 0);
  const wheel = [spot('wheel', { zone: 'rims' })];
  for (let time = 0; time < 2; time += 0.1) automateSurface(wheel, 0.1, { autoWheels: 1 }, {}, time);
  assert.equal(wheel[0].amount, 0);
  const arch = [spot('dust', { nz: 0, ny: 1 }), spot('oil', { nz: 0, ny: 1 })];
  events = automateSurface(arch, 0.25, { arch: 1 }, {}, 0);
  assert(events.some(event => event.id === 'arch'));
  assert(arch[0].amount < 1); assert.equal(arch[1].amount, 1);
});
check('The 97% finish threshold clears residual 3D spots', () => {
  const points = [spot('dust', { amount: 0.02 })];
  assert.equal(progress(points).total, 100);
  assert.equal(points[0].amount, 0);
});

let largestSave = 0;
check('Late 3D orders persist below the common 5 MiB storage quota', () => {
  for (let level = 31; level <= 40; level++) {
    const order = getOrder(level), vehicle = createVehicle(order.carId), state = createState();
    state.level = level;
    state.order = { key: `3d:${level}:1`, exterior: createSurfaceDirt(vehicle, order), interior: order.interior ? createSurfaceDirt(createInteriorVehicle(order.carId), order, { interior: true }) : [], services: {} };
    for (const service of order.services) state.order.services[service] = createSurfaceDirt(vehicle, order, { service });
    use(state.order.exterior, 'foam', 0.1);
    let value = '';
    const storage = { setItem(key, data) { value = data; }, getItem() { return value; } };
    assert(saveState(state, storage));
    assert.deepEqual(loadState(storage), state);
    largestSave = Math.max(largestSave, value.length * 2);
    assert(value.length * 2 < 5 * 1024 * 1024, `Order ${level} exceeded the conservative UTF-16 quota`);
  }
});
check('Completing the final 3D order retains all business purchases', () => {
  const state = createState(); state.level = 40; state.money = 3000; state.upgrades.water = 3;
  state.decor = 'botanical'; state.ownedDecor.push('botanical'); state.garage = ['pixie']; state.garageColors.pixie = '#123456';
  state.order = { exterior: [spot('dust', { amount: 0 })] };
  const result = finishOrder(state);
  assert.equal(result.newCycle, true); assert.equal(state.level, 1); assert.equal(state.cycle, 2); assert.equal(state.order, null);
  assert.equal(state.upgrades.water, 3); assert.equal(state.decor, 'botanical'); assert.deepEqual(state.garage, ['pixie']);
  assert.equal(state.garageColors.pixie, '#123456'); assert(state.money > 3000);
});
console.log(`${passed} 3D mechanic checks passed; largest late-order save: ${(largestSave / 1024 / 1024).toFixed(2)} MiB (UTF-16).`);
