import assert from 'node:assert/strict';
import * as engine from '../dist/engine.js';

let passed = 0;
function check(name, fn) { fn(); passed++; console.log(`✓ ${name}`); }
const spot = (type = 'dust', x = 100, zone = 'body') => ({ type, x, y: 100, zone, amount: 1, initial: 1, foam: 0 });
function use(points, tool, seconds, upgrades = {}) {
  for (let time = 0; time < seconds; time += 0.05) engine.applyTool(points, tool, 100, 100, 0.05, upgrades);
}

check('Tools clean only their local area', () => {
  const points = [spot(), spot('dust', 300)];
  use(points, 'water', 1);
  assert.equal(points[0].amount, 0);
  assert.equal(points[1].amount, 1);
});
check('Foam visibly softens mud and substantially accelerates rinsing', () => {
  const plain = [spot('mud')], softened = [spot('mud')];
  use(plain, 'water', 0.5);
  use(softened, 'foam', 0.5);
  assert(softened[0].foam > 0.8);
  use(softened, 'water', 0.5);
  assert(softened[0].amount < plain[0].amount - 0.6);
});
check('Rinsing clean foam reports a change and counts each point once', () => {
  const cleanFoam = { ...spot(), amount: 0, foam: 1 };
  const dirtyFoam = { ...spot('dust', 110), foam: 1 };
  const clean = { ...spot('dust', 120), amount: 0 };
  const distant = spot('dust', 300);
  const affected = engine.applyTool([cleanFoam, dirtyFoam, clean, distant], 'water', 100, 100, 0.1);
  assert.equal(affected, 2);
  assert(cleanFoam.foam < 1);
  assert(dirtyFoam.amount < 1 && dirtyFoam.foam < 1);
  assert.equal(clean.amount, 0); assert.equal(clean.foam, 0);
  assert.equal(distant.amount, 1);
});
check('Special tools remove their dirt and wrong tools preserve it', () => {
  for (const [type, tool, zone] of [['bugs','sponge','body'],['oil','degreaser','body'],['wheel','brush','rims'],['stain','sponge','seats'],['crumbs','vacuum','mats'],['trash','hand','mats']]) {
    const correct = [spot(type, 100, zone)], wrong = [spot(type, 100, zone)];
    use(correct, tool, 1);
    use(wrong, 'water', 1);
    assert.equal(correct[0].amount, 0, type);
    assert(wrong[0].amount > 0.7, type);
  }
});
check('97% threshold removes small remaining spots', () => {
  const points = [spot(), spot('dust', 130)];
  points[0].amount = 0; points[1].amount = 0.04;
  assert.equal(engine.progress(points).total, 100);
  assert(points.every(p => p.amount === 0));
});
check('Upgrades are affordable after first order and affect width and power', () => {
  const state = engine.createState();
  assert.equal(engine.purchaseUpgrade(state, 'water').ok, false);
  engine.finishOrder(state);
  const original = engine.toolStats('water');
  assert(engine.purchaseUpgrade(state, 'water').ok);
  const upgraded = engine.toolStats('water', state.upgrades);
  assert(upgraded.radius > original.radius && upgraded.power > original.power);
  assert(state.money >= 0);
  assert.equal(engine.purchaseUpgrade(state, 'arch').ok, false);
});
check('Automation is visible, respects toggles, and leaves difficult spots', () => {
  const enabled = [spot(), spot('oil', 100)];
  const disabled = [spot()];
  let events = [];
  for (let t = 0; t < 3; t += 0.1) {
    events.push(...engine.automate(enabled, 0.1, { assistant: 1 }, { assistant: true }, t));
    engine.automate(disabled, 0.1, { assistant: 1 }, { assistant: false }, t);
  }
  assert(events.some(event => event.id === 'assistant'));
  assert.equal(enabled[0].amount, 0);
  assert.equal(enabled[1].amount, 1);
  assert.equal(disabled[0].amount, 1);
  const wheels = [spot('wheel', 100, 'rims')];
  for (let t = 0; t < 2; t += 0.1) engine.automate(wheels, 0.1, {autoWheels:1}, {}, t);
  assert.equal(wheels[0].amount, 0);
  const mud = [spot('mud')];
  engine.automate(mud, 0.25, {autoFoam:1}, {}, 0);
  assert(mud[0].foam > 0);
});
check('Full level cycle preserves money, upgrades, decor and collection', () => {
  const state = engine.createState();
  state.money = 50000;
  assert(engine.purchaseUpgrade(state, 'water').ok);
  assert(engine.purchaseDecor(state, 'botanical').ok);
  assert(engine.purchaseCar(state, 'pixie').ok);
  assert(engine.recolorCar(state, 'pixie', '#123456').ok);
  const money = state.money;
  const models = new Set();
  for (let i = 1; i <= 40; i++) {
    const order = engine.getOrder(state.level, state.cycle);
    assert.equal(order.level, i);
    models.add(order.carId);
    engine.finishOrder(state);
  }
  assert.equal(models.size, 8);
  assert.equal(state.level, 1);
  assert.equal(state.cycle, 2);
  assert.equal(state.upgrades.water, 1);
  assert.equal(state.decor, 'botanical');
  assert.deepEqual(state.garage, ['pixie']);
  assert.equal(state.garageColors.pixie, '#123456');
  assert(state.money > money);
  assert(engine.getOrder(1, 2).reward > engine.getOrder(1, 1).reward);
});
check('Save roundtrip preserves current spatial work and progression', () => {
  const state = engine.createState();
  state.level = 26; state.cycle = 3; state.money = 4321;
  state.upgrades.water = 2;
  state.order = { exterior: [spot('mud')], service: 'polish', view: 'exterior' };
  use(state.order.exterior, 'foam', 0.1);
  let value = '';
  const storage = { setItem(key, data) { value = data; }, getItem() { return value; } };
  assert(engine.saveState(state, storage));
  assert.deepEqual(engine.loadState(storage), state);
});
check('All services require their own local action', () => {
  for (const type of ['polish', 'coat', 'paint', 'rims']) {
    const points = [spot(type)];
    use(points, 'water', 1);
    assert.equal(points[0].amount, 1);
    use(points, type, 1);
    assert.equal(points[0].amount, 0);
  }
});
console.log(`${passed} mechanic checks passed`);
