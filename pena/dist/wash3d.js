import * as THREE from './vendor/three.module.js';
import { applyTool, toolStats } from './engine.js';

const ATLAS_WIDTH = 1000;
const ATLAS_HEIGHT = 620;
const INTERIOR_ZONES = new Set(['seats', 'mats', 'dash']);
const SERVICES = new Set(['polish', 'coat', 'paint', 'rims']);
const automationStates = new WeakMap();
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
const wheelZone = zone => zone === 'wheels' || zone === 'rims';

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let n = value;
    n = Math.imul(n ^ n >>> 15, n | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

export function surfaceRadius(tool, upgrades = {}) {
  return toolStats(tool, upgrades).radius * 0.01;
}

function eligibleSurface(surface, interior, service) {
  if (!surface?.mesh?.geometry || !surface.zone) return false;
  if (interior !== INTERIOR_ZONES.has(surface.zone)) return false;
  if (service === 'rims') return surface.zone === 'rims';
  if (service) return surface.zone === 'body';
  return true;
}

function trianglesForSurface(surface) {
  const mesh = surface.mesh;
  const geometry = mesh.geometry;
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  if (!position || !uv) return [];
  const normal = geometry.getAttribute('normal');
  const index = geometry.getIndex();
  const count = index ? index.count : position.count;
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  const triangles = [];
  for (let i = 0; i + 2 < count; i += 3) {
    const indices = [0, 1, 2].map(offset => index ? index.getX(i + offset) : i + offset);
    const world = indices.map(j => new THREE.Vector3().fromBufferAttribute(position, j).applyMatrix4(mesh.matrixWorld));
    const sideA = new THREE.Vector3().subVectors(world[1], world[0]);
    const sideB = new THREE.Vector3().subVectors(world[2], world[0]);
    const faceNormal = new THREE.Vector3().crossVectors(sideA, sideB);
    const area = faceNormal.length() * 0.5;
    if (area < 0.000001) continue;
    faceNormal.normalize();
    const normals = normal ? indices.map(j => new THREE.Vector3().fromBufferAttribute(normal, j).applyNormalMatrix(normalMatrix)) : [faceNormal, faceNormal, faceNormal];
    const uvs = indices.map(j => new THREE.Vector2().fromBufferAttribute(uv, j));
    const uvArea = Math.abs((uvs[1].x - uvs[0].x) * (uvs[2].y - uvs[0].y) - (uvs[1].y - uvs[0].y) * (uvs[2].x - uvs[0].x)) * ATLAS_WIDTH * ATLAS_HEIGHT * 0.5;
    triangles.push({ world, normals, uvs, area, uvArea });
  }
  return triangles;
}

function pickTriangle(triangles, area, random) {
  let remaining = random() * area;
  for (const triangle of triangles) {
    remaining -= triangle.area;
    if (remaining <= 0) return triangle;
  }
  return triangles[triangles.length - 1];
}

function squaredDistance(a, b) {
  const dx = a.wx - b.wx, dy = a.wy - b.wy, dz = a.wz - b.wz;
  return dx * dx + dy * dy + dz * dz;
}

/** Surface atlas UVs and world samples refer to the same actual mesh triangles. */
export function createSurfaceDirt(vehicle, order, options = {}) {
  const interior = Boolean(options.interior);
  const service = options.service || null;
  const random = seededRandom((order.seed || 112648) + (interior ? 60013 : 0) + (service ? service.charCodeAt(0) * 127 : 0));
  vehicle.group?.updateWorldMatrix(true, true);
  const surfaces = (vehicle.surfaces || []).filter(surface => eligibleSurface(surface, interior, service));
  const prepared = surfaces.map(surface => {
    surface.mesh.updateWorldMatrix(true, false);
    const triangles = trianglesForSurface(surface);
    return { surface, triangles, area: triangles.reduce((total, triangle) => total + triangle.area, 0), uvArea: triangles.reduce((total, triangle) => total + triangle.uvArea, 0) };
  }).filter(surface => surface.area > 0);
  const totalArea = prepared.reduce((sum, surface) => sum + surface.area, 0);
  if (!totalArea) return [];
  const targetCount = service ? (service === 'rims' ? 100 : 900) : interior ? 750 : 1800;
  const points = [];
  for (const { surface, triangles, area, uvArea } of prepared) {
    // At least six samples keep small mirrors, wheel faces and narrow pillars washable.
    const count = Math.max(service === 'rims' ? 14 : 6, Math.round(targetCount * area / totalArea));
    const baseRadius = Math.sqrt(Math.max(1, uvArea) / count / Math.PI) * 1.55;
    for (let i = 0; i < count; i++) {
      const triangle = pickTriangle(triangles, area, random);
      const root = Math.sqrt(random());
      const weights = [1 - root, root * (1 - random()), 0];
      weights[2] = 1 - weights[0] - weights[1];
      const world = new THREE.Vector3();
      const normal = new THREE.Vector3();
      const uv = new THREE.Vector2();
      for (let corner = 0; corner < 3; corner++) {
        world.addScaledVector(triangle.world[corner], weights[corner]);
        normal.addScaledVector(triangle.normals[corner], weights[corner]);
        uv.addScaledVector(triangle.uvs[corner], weights[corner]);
      }
      normal.normalize();
      const amount = service || interior ? 1 : 0.72 + random() * 0.28;
      points.push({
        id: points.length, surfaceId: surface.id ?? surface.mesh.userData.surfaceId ?? surface.mesh.uuid,
        x: uv.x * ATLAS_WIDTH, y: (1 - uv.y) * ATLAS_HEIGHT,
        wx: world.x, wy: world.y, wz: world.z,
        nx: normal.x, ny: normal.y, nz: normal.z,
        zone: surface.zone, type: service || 'dust', amount, initial: amount, foam: 0,
        radius: clamp(baseRadius * (0.7 + random() * 0.6), 3, 35),
      });
    }
  }
  if (service) return points;
  if (interior) {
    for (const point of points) {
      const roll = random();
      point.type = point.zone === 'dash' ? 'crumbs' : roll < 0.07 ? 'trash' : point.zone === 'seats' && roll < 0.27 ? 'stain' : 'crumbs';
      if (point.type === 'trash') point.radius *= 0.62;
    }
    return points;
  }
  const dirtTypes = order.dirtTypes || ['dust'];
  const body = points.filter(point => !wheelZone(point.zone));
  const front = body.filter(point => point.nz > 0.3 || (point.ny > 0.5 && point.zone === 'body'));
  const lower = body.filter(point => point.wy < 0.95 && Math.abs(point.ny) < 0.7);
  const centers = {};
  for (const type of ['mud', 'bugs', 'oil']) {
    const source = type === 'bugs' && front.length ? front : type === 'mud' && lower.length ? lower : body;
    centers[type] = source.length ? Array.from({ length: type === 'mud' ? 7 : type === 'oil' ? 4 : 5 }, () => source[Math.floor(random() * source.length)]) : [];
  }
  for (const point of points) {
    if (wheelZone(point.zone)) { if (dirtTypes.includes('wheel')) point.type = 'wheel'; continue; }
    if (dirtTypes.includes('mud')) {
      const clustered = centers.mud.some(center => squaredDistance(center, point) < 0.28);
      if (clustered || (point.wy < 0.72 && random() < 0.42)) point.type = 'mud';
    }
    if (dirtTypes.includes('bugs') && centers.bugs.some(center => squaredDistance(center, point) < 0.075)) point.type = 'bugs';
    if (dirtTypes.includes('oil') && centers.oil.some(center => squaredDistance(center, point) < 0.11)) point.type = 'oil';
  }
  return points;
}

function insideBrush(point, hit, radius) {
  const dx = point.wx - hit.point.x, dy = point.wy - hit.point.y, dz = point.wz - hit.point.z;
  const distanceSquared = dx * dx + dy * dy + dz * dz;
  if (distanceSquared > radius * radius) return -1;
  const alignment = point.nx * hit.normal.x + point.ny * hit.normal.y + point.nz * hit.normal.z;
  if (alignment < 0.45) return -1;
  // Parallel panels behind the clicked surface must not be washed through the car.
  const normalDepth = Math.abs(dx * hit.normal.x + dy * hit.normal.y + dz * hit.normal.z);
  if (normalDepth > Math.max(0.035, radius * 0.18)) return -1;
  return Math.sqrt(distanceSquared);
}

/** Reuse the same tool chemistry, with a world-space, front-facing footprint. */
export function applySurfaceTool(points, tool, hit, dt, upgrades = {}) {
  if (!points?.length || !hit?.point || !hit?.normal || !Number.isFinite(hit.point.x) || !Number.isFinite(hit.normal.x)) return 0;
  const normalLength = Math.hypot(hit.normal.x, hit.normal.y, hit.normal.z);
  if (normalLength < 0.001) return 0;
  const normalizedHit = { point: hit.point, normal: { x: hit.normal.x / normalLength, y: hit.normal.y / normalLength, z: hit.normal.z / normalLength } };
  const radius = surfaceRadius(tool, upgrades);
  const candidates = [], original = [];
  for (const point of points) {
    if (point.amount <= 0 && !(tool === 'water' && point.foam > 0)) continue;
    const distance = insideBrush(point, normalizedHit, radius);
    if (distance < 0) continue;
    original.push([point.x, point.y]);
    candidates.push(point);
    point.x = distance * 100;
    point.y = 0;
  }
  try { return applyTool(candidates, tool, 0, 0, dt, upgrades); }
  finally {
    for (let i = 0; i < candidates.length; i++) {
      candidates[i].x = original[i][0]; candidates[i].y = original[i][1];
    }
  }
}

function pointHit(point) {
  return { point: new THREE.Vector3(point.wx, point.wy, point.wz), normal: new THREE.Vector3(point.nx, point.ny, point.nz) };
}

function nearestTarget(candidates, previous) {
  if (!candidates.length) return null;
  if (!previous) return candidates[0];
  let nearest = candidates[0], distance = Infinity;
  for (const point of candidates) {
    const delta = squaredDistance(previous, point);
    if (delta < distance) { nearest = point; distance = delta; }
  }
  return nearest;
}

/** Each automatic device has a real contact location on the vehicle. */
export function automateSurface(points, dt, upgrades = {}, enabled = {}, time = 0) {
  if (!points?.length || !Number.isFinite(dt) || dt <= 0) return [];
  dt = Math.min(dt, 0.25);
  const use = id => Number(upgrades[id]) > 0 && enabled[id] !== false;
  const exterior = points.filter(point => !INTERIOR_ZONES.has(point.zone) && !SERVICES.has(point.type));
  const dirty = exterior.filter(point => point.amount > 0.001);
  if (!dirty.length) return [];
  let states = automationStates.get(points);
  if (!states) { states = {}; automationStates.set(points, states); }
  const events = [];
  const contact = (id, tool, targets, rate, label, applyPoints = exterior) => {
    if (!use(id) || !targets.length) return;
    const state = states[id] || (states[id] = {});
    if (!state.target || !targets.includes(state.target)) state.target = nearestTarget(targets, state.target);
    const target = state.target;
    const hit = pointHit(target);
    applySurfaceTool(applyPoints, tool, hit, dt * rate, upgrades);
    events.push({ id, tool, x: target.wx, y: target.wy, z: target.wz, nx: target.nx, ny: target.ny, nz: target.nz, radius: surfaceRadius(tool, upgrades), label });
  };
  contact('autoFoam', 'foam', dirty.filter(point => point.type === 'mud' && point.foam < 0.85), 0.6, 'Автопена');
  contact('autoWheels', 'brush', dirty.filter(point => wheelZone(point.zone)), 0.6, 'Уход за колёсами');
  const simple = exterior.filter(point => point.type === 'dust' || point.type === 'mud');
  contact('assistant', 'water', dirty.filter(point => point.type === 'dust' || (point.type === 'mud' && point.foam > 0.2)), 0.48, 'Помощник', simple);
  if (use('arch') && simple.some(point => point.amount > 0.001)) {
    let minZ = Infinity, maxZ = -Infinity, minX = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const point of exterior) {
      minZ = Math.min(minZ, point.wz); maxZ = Math.max(maxZ, point.wz);
      minX = Math.min(minX, point.wx); maxX = Math.max(maxX, point.wx); maxY = Math.max(maxY, point.wy);
    }
    const length = Math.max(0.1, maxZ - minZ);
    const travelled = (Math.max(0, time) * 0.62) % (length * 2);
    const z = minZ + (travelled > length ? length * 2 - travelled : travelled);
    const buckets = new Map();
    const radius = surfaceRadius('water', upgrades);
    for (const point of simple) {
      if (point.amount <= 0.001 || Math.abs(point.wz - z) > radius * 0.85) continue;
      const axis = Math.abs(point.nx) > 0.5 ? `x${Math.sign(point.nx)}` : Math.abs(point.nz) > 0.5 ? `z${Math.sign(point.nz)}` : 'top';
      const cross = axis === 'top' ? point.wx : point.wy;
      const key = `${axis}:${Math.floor(cross / (radius * 1.5))}`;
      const previous = buckets.get(key);
      if (!previous || Math.abs(point.wz - z) < Math.abs(previous.wz - z)) buckets.set(key, point);
    }
    const mud = simple.filter(point => point.type === 'mud');
    for (const target of buckets.values()) {
      const hit = pointHit(target);
      applySurfaceTool(mud, 'foam', hit, dt * 0.17, upgrades);
      applySurfaceTool(simple, 'water', hit, dt * 0.28, upgrades);
    }
    events.push({ id: 'arch', tool: 'water', x: (minX + maxX) * 0.5, y: maxY + 0.22, z, nx: 0, ny: -1, nz: 0, radius: (maxX - minX) * 0.5 + 0.22, label: 'Моечная рамка' });
  }
  return events;
}
