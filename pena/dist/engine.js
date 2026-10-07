// Shared, deterministic rules for the wash, shop and repeating order book.
export const SAVE_KEY = 'pena-save-v2';

export const CARS = [
  { id: 'compact', name: 'Компакт «Пикси»', short: 'Компакт', size: 0.84 },
  { id: 'sedan', name: 'Седан «Атлас»', short: 'Седан', size: 1 },
  { id: 'hatch', name: 'Хэтчбек «Искра»', short: 'Хэтчбек', size: 0.92 },
  { id: 'wagon', name: 'Универсал «Вояж»', short: 'Универсал', size: 1.08 },
  { id: 'coupe', name: 'Купе «Комета»', short: 'Купе', size: 0.96 },
  { id: 'suv', name: 'Внедорожник «Тропа»', short: 'Внедорожник', size: 1.12 },
  { id: 'pickup', name: 'Пикап «Ранчо»', short: 'Пикап', size: 1.14 },
  { id: 'van', name: 'Фургон «Облако»', short: 'Фургон', size: 1.18 },
];

export const TOOLS = [
  { id: 'water', name: 'Вода', label: 'Напор', icon: 'water', unlock: 1, tip: 'Ведите струёй по пыли. Пена помогает смыть засохшую грязь.', radius: 36, power: 1.45 },
  { id: 'foam', name: 'Пена', label: 'Пена', icon: 'foam', unlock: 6, tip: 'Покройте грязь пеной, затем смойте водой: размягчённые пятна уходят быстрее.', radius: 44, power: 2.1 },
  { id: 'sponge', name: 'Губка', label: 'Губка', icon: 'sponge', unlock: 9, tip: 'Средство в губке удаляет насекомых, липкие пятна и пятна на сиденьях.', radius: 30, power: 1.75 },
  { id: 'brush', name: 'Щётка', label: 'Диски', icon: 'brush', unlock: 6, tip: 'Тщательно очищает шины и диски. Ведите щёткой по колёсам.', radius: 34, power: 2.1 },
  { id: 'degreaser', name: 'Обезжириватель', label: 'Средство', icon: 'spray', unlock: 13, tip: 'Растворяет тёмные масляные пятна. Можно сразу вести по пятну.', radius: 32, power: 1.9 },
  { id: 'vacuum', name: 'Пылесос', label: 'Пылесос', icon: 'vacuum', unlock: 21, tip: 'Собирает пыль и крошки с ковриков, сидений и панели.', radius: 35, power: 1.8 },
  { id: 'hand', name: 'Сбор мусора', label: 'Мусор', icon: 'hand', unlock: 21, tip: 'Проведите по бумажкам и крупному мусору, чтобы собрать их.', radius: 40, power: 5 },
  { id: 'polish', name: 'Полировка', label: 'Полировка', icon: 'sparkles', unlock: 24, tip: 'Пройдитесь кругом по кузову: мелкие царапины сменятся мягким блеском.', radius: 44, power: 2.5 },
  { id: 'coat', name: 'Защитное покрытие', label: 'Защита', icon: 'shield', unlock: 28, tip: 'Распределите защитное покрытие по кузову — он станет сияющим.', radius: 48, power: 2.8 },
  { id: 'paint', name: 'Покраска', label: 'Цвет', icon: 'paint', unlock: 31, tip: 'Выберите оттенок и нанесите его на кузов плавными движениями.', radius: 50, power: 3.2 },
  { id: 'rims', name: 'Новые диски', label: 'Замена', icon: 'wheel', unlock: 34, tip: 'Проведите инструментом по каждому диску, чтобы установить новый комплект.', radius: 48, power: 4 },
];

export const UPGRADES = [
  { id: 'water', name: 'Мощная струя', description: 'Шире на 12% и мощнее на 35% за ступень.', desc: '+12% ширина · +35% мощность', cost: 160, costs: [160, 480, 1250, 2600], max: 4, unlock: 1, icon: 'water', category: 'tools' },
  { id: 'foam', name: 'Пенная насадка', description: 'Пена наносится на 55% быстрее и охватывает больше кузова.', desc: '+55% скорость пены · +10% ширина', cost: 240, costs: [240, 650, 1450], max: 3, unlock: 6, icon: 'foam', category: 'tools' },
  { id: 'detail', name: 'Набор детейлера', description: 'Губка, щётка и специальные средства на 45% эффективнее.', desc: '+45% эффективность средств', cost: 280, costs: [280, 800, 1900], max: 3, unlock: 6, icon: 'brush', category: 'tools' },
  { id: 'comfort', name: 'Удобные инструменты', description: 'Область действия +15%. На второй ступени струя смывает липкие пятна, на третьей — следы масла.', desc: '+15% ширина · меньше переключений', cost: 350, costs: [350, 1000, 2500], max: 3, unlock: 3, icon: 'sparkles', category: 'tools' },
  { id: 'interior', name: 'Уборка салона', description: 'Пылесос и губка в салоне работают на 60% быстрее. Крупный мусор пылесос собирает со второй ступени.', desc: '+60% скорость уборки салона', cost: 550, costs: [550, 1400, 3000], max: 3, unlock: 21, icon: 'vacuum', category: 'tools' },
  { id: 'autoFoam', name: 'Автопена', description: 'Подвижная форсунка сама наносит пену во время мойки.', desc: 'Пена наносится автоматически', cost: 1300, costs: [1300], max: 1, unlock: 13, icon: 'foam', category: 'automation' },
  { id: 'autoWheels', name: 'Уход за колёсами', description: 'Щётки по очереди моют колёса и диски.', desc: 'Колёса очищаются автоматически', cost: 1900, costs: [1900], max: 1, unlock: 16, icon: 'wheel', category: 'automation' },
  { id: 'assistant', name: 'Помощник', description: 'Помощник моет пыльные участки и размягчённую грязь.', desc: 'Самостоятельно моет простые участки', cost: 3300, costs: [3300], max: 1, unlock: 19, icon: 'hand', category: 'automation' },
  { id: 'arch', name: 'Моечная рамка', description: 'Широкая рамка постепенно смывает обычную грязь. Сложные пятна остаются вам.', desc: 'Широкие проходы воды по всей машине', cost: 7200, costs: [7200], max: 1, unlock: 30, icon: 'arch', category: 'automation' },
];

export const DECOR = [
  { id: 'original', name: 'Тихое утро', cost: 0, description: 'Светлые стены, тёплый пол и мятные детали.', wall: '#e8ede7', floor: '#d5ded7', accent: '#6c9e88', light: '#ffefc2', sign: 'ПЕНА', plants: 1 },
  { id: 'terracotta', name: 'Тёплая мастерская', cost: 1800, description: 'Терракотовые стены, глиняные кашпо и медовая подсветка.', wall: '#ead7cb', floor: '#c9b7a8', accent: '#b56d50', light: '#ffd69b', sign: 'ПЕНА · С ЛЮБОВЬЮ', plants: 2 },
  { id: 'botanical', name: 'Зелёный двор', cost: 4200, description: 'Шалфейные стены, зелёный пол и большая коллекция растений.', wall: '#d8e3d3', floor: '#aebbab', accent: '#587d54', light: '#f5ecc7', sign: 'ПЕНА · ЗЕЛЁНЫЙ ДВОР', plants: 5 },
  { id: 'midnight', name: 'Лунная мойка', cost: 7500, description: 'Синие стены, графитовый пол и лавандовое вечернее свечение.', wall: '#344657', floor: '#566575', accent: '#a6a6d2', light: '#cab9ff', sign: 'ПЕНА · ПОСЛЕ ЗАКАТА', plants: 2 },
  { id: 'riviera', name: 'Ривьера', cost: 11000, description: 'Кремовая плитка, коралловая вывеска и пальмы под тёплым светом.', wall: '#f0e5d1', floor: '#d2c8b4', accent: '#df8d75', light: '#fff0be', sign: 'ПЕНА · РИВЬЕРА', plants: 4 },
];

export const PALETTE = [
  { name: 'Шалфей', color: '#84aea2' }, { name: 'Коралл', color: '#dd8c76' },
  { name: 'Небо', color: '#86abc8' }, { name: 'Ваниль', color: '#d6bd75' },
  { name: 'Сирень', color: '#a49cbd' }, { name: 'Вишня', color: '#a9646c' },
  { name: 'Молоко', color: '#d7d8d0' }, { name: 'Океан', color: '#5d8d9f' },
];

export const COLLECTION = [
  { id: 'pixie', carId: 'compact', name: 'Пикси · 1967', color: '#d6bd75', cost: 2300, description: 'Маленький любимец большого города.' },
  { id: 'comet', carId: 'coupe', name: 'Комета · GT', color: '#a9646c', cost: 5400, description: 'Плавные линии и настроение выходного дня.' },
  { id: 'voyage', carId: 'wagon', name: 'Вояж · Лесной', color: '#84aea2', cost: 7400, description: 'Для самых уютных путешествий.' },
  { id: 'atlas', carId: 'sedan', name: 'Атлас · Классик', color: '#86abc8', cost: 9500, description: 'Спокойная элегантность вне времени.' },
  { id: 'cloud', carId: 'van', name: 'Облако · Кемпер', color: '#dd8c76', cost: 13500, description: 'Маленький дом для больших приключений.' },
  { id: 'trail', carId: 'suv', name: 'Тропа · Экспедиция', color: '#5d8d9f', cost: 17500, description: 'Готов к дороге, которой ещё нет на карте.' },
  { id: 'ranch', carId: 'pickup', name: 'Ранчо · Наследие', color: '#d7d8d0', cost: 22000, description: 'Проверенная классика с открытым кузовом.' },
  { id: 'spark', carId: 'hatch', name: 'Искра · Лимитед', color: '#a49cbd', cost: 29000, description: 'Особенный оттенок для особенной коллекции.' },
];

// Add entries here to extend the sequence: screens and rules stay shared.
export const ORDER_BLUEPRINTS = [
  ['compact', 1, 'dust', false, [], 'Первое знакомство', 'Лёгкая пыль после дороги домой.'],
  ['sedan', 2, 'dust', false, [], 'Городское утро', 'Освежите кузов и прозрачные стёкла.'],
  ['hatch', 1, 'dust', false, [], 'Кофе навынос', 'Небольшой автомобиль — приятный быстрый заказ.'],
  ['coupe', 4, 'dust', false, [], 'Поездка к морю', 'Пыльная дорога скрыла красивый цвет.'],
  ['wagon', 3, 'dust', false, [], 'Семейный маршрут', 'Чуть больше кузова, столько же удовольствия.'],
  ['sedan', 6, 'dust,mud,wheel', false, [], 'После дождя', 'Пена размягчит грязь, щётка очистит диски.'],
  ['suv', 0, 'dust,mud', false, [], 'Лесная прогулка', 'Нанесите пену на тёмные следы грунтовки.'],
  ['compact', 7, 'dust,wheel', false, [], 'Чистые колёса', 'Немного пыли и отдельное внимание колёсам.'],
  ['coupe', 1, 'dust,bugs', false, [], 'Летняя трасса', 'Липкие следы насекомых легко уходят с губкой.'],
  ['pickup', 3, 'dust,mud,wheel', false, [], 'Выходной на даче', 'Грунтовка оставила следы по низу кузова.'],
  ['hatch', 4, 'dust,bugs,wheel', false, [], 'Солнечный день', 'Точечная работа губкой и уход за дисками.'],
  ['van', 2, 'dust,mud', false, [], 'Добрая доставка', 'Большой фургон возвращается с маршрута.'],
  ['sedan', 5, 'dust,oil', false, [], 'Из мастерской', 'Обезжириватель быстро растворит масляные пятна.'],
  ['wagon', 0, 'dust,mud,bugs', false, [], 'Загородные истории', 'Разные пятна требуют разных инструментов.'],
  ['compact', 6, 'dust,wheel', false, [], 'Лёгкая передышка', 'Простой заказ между большими приключениями.'],
  ['suv', 7, 'dust,mud,wheel,oil', false, [], 'За поворотом', 'Первый серьёзный уход после бездорожья.'],
  ['coupe', 4, 'dust,bugs,oil', false, [], 'Блеск набережной', 'Удалите отдельные сложные пятна.'],
  ['van', 3, 'dust,mud,wheel', false, [], 'Хлеб к завтраку', 'Фургон пекарни снова будет сиять.'],
  ['pickup', 1, 'dust,mud,oil', false, [], 'Верный помощник', 'Простые участки можно доверить помощнику.'],
  ['hatch', 2, 'dust,bugs', false, [], 'Навстречу выходным', 'Быстрая забота о любимом хэтчбеке.'],
  ['sedan', 0, 'dust,wheel', true, [], 'Чистота внутри', 'Загляните в салон: мусор, крошки и пара пятен.'],
  ['wagon', 3, 'dust,mud', true, [], 'После пикника', 'Коврики помнят прогулку по парку.'],
  ['compact', 4, 'dust,bugs', false, [], 'Город в цвету', 'Сегодня только кузов — небольшой приятный заказ.'],
  ['coupe', 5, 'dust,bugs', false, ['polish'], 'Особенный блеск', 'После мойки отполируйте чистый кузов.'],
  ['van', 6, 'dust,mud,wheel', true, [], 'Большая компания', 'Уютный салон для следующего путешествия.'],
  ['suv', 7, 'dust,oil,wheel', false, ['polish'], 'Снова как новый', 'Тщательная мойка и мягкая полировка.'],
  ['hatch', 1, 'dust,wheel', true, [], 'Маленькие радости', 'Свежий салон и чистые колёса.'],
  ['sedan', 2, 'dust,bugs', false, ['coat'], 'Капли как жемчуг', 'Защитите чистую краску прозрачным покрытием.'],
  ['pickup', 0, 'dust,mud,oil', true, [], 'Работа с заботой', 'Пикап заслужил чистый кузов и салон.'],
  ['wagon', 3, 'dust,mud,wheel', false, ['polish'], 'Семейная классика', 'Моечная рамка поможет с обычной грязью.'],
  ['coupe', 4, 'dust,bugs', false, ['paint'], 'Новый характер', 'Подберите оттенок и освежите цвет кузова.'],
  ['van', 7, 'dust,mud,wheel', true, ['coat'], 'Дорога к горизонту', 'Уборка салона и защита для долгой поездки.'],
  ['compact', 1, 'dust,oil', false, ['paint'], 'Смена настроения', 'Маленькому автомобилю — новый любимый цвет.'],
  ['suv', 5, 'dust,mud,wheel', false, ['rims'], 'Красивые детали', 'Чистый внедорожник и свежий комплект дисков.'],
  ['sedan', 6, 'dust,bugs,oil', true, ['polish'], 'Пятница без забот', 'Полный уход перед особенной встречей.'],
  ['pickup', 3, 'dust,mud,wheel,oil', false, ['coat'], 'Надёжная защита', 'После глубокой мойки нанесите защитное покрытие.'],
  ['wagon', 0, 'dust,bugs,wheel', true, ['rims'], 'Дальние планы', 'Салон и колёса готовы к новому маршруту.'],
  ['coupe', 7, 'dust,oil', false, ['paint', 'polish'], 'Личная коллекция', 'Новый оттенок и финишная полировка.'],
  ['suv', 4, 'dust,mud,bugs,wheel', true, ['coat'], 'Большое путешествие', 'Комплексный уход после долгой дороги.'],
  ['van', 1, 'dust,mud,oil,wheel', true, ['polish', 'rims'], 'Идеальное завершение', 'Большой заказ, красивый результат и новый круг впереди.'],
];
export const ORDER_COUNT = ORDER_BLUEPRINTS.length;

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const levelOf = (upgrades, id) => Math.max(0, Number(upgrades?.[id]) || 0);
function rng(seed) {
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function getOrder(level = 1, cycle = 1) {
  level = clamp(Math.floor(Number(level) || 1), 1, ORDER_COUNT);
  cycle = Math.max(1, Math.floor(Number(cycle) || 1));
  const blueprint = ORDER_BLUEPRINTS[(level - 1) % ORDER_BLUEPRINTS.length];
  let [carId, colorIndex, dirt, interior, services, title, subtitle] = blueprint;
  const random = rng(level * 7919 + cycle * 104729);
  const dirtTypes = dirt.split(',');
  services = [...services];
  if (cycle > 1) {
    colorIndex = (colorIndex + cycle - 1) % PALETTE.length;
    if (level % 4 === 0) carId = CARS[Math.floor(random() * CARS.length)].id;
    if (level % 3 === 0 && !dirtTypes.includes('bugs')) dirtTypes.push('bugs');
    if (level % 7 === 0 && !dirtTypes.includes('oil')) dirtTypes.push('oil');
    if (level % 6 === 0) interior = true;
    if (level % 10 === 0 && !services.includes('coat')) services.push('coat');
    subtitle = `${subtitle} Постоянный клиент · оплата выше.`;
  }
  const car = CARS.find(c => c.id === carId);
  const baseReward = 190 + level * 35 + Math.floor(level / 5) * 45 + (interior ? 230 : 0) + services.length * 190;
  const reward = Math.round(baseReward * (1 + Math.min(9, cycle - 1) * 0.3) / 5) * 5;
  return {
    level, cycle, carId, name: car.name, title, color: PALETTE[colorIndex].color,
    colorName: PALETTE[colorIndex].name, reward, subtitle, dirtTypes, interior, services,
    seed: level * 7919 + cycle * 104729,
  };
}

export function createState() {
  return {
    version: 2, money: 0, level: 1, cycle: 1, completed: 0,
    upgrades: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
    autoEnabled: { autoFoam: true, autoWheels: true, assistant: true, arch: true },
    decor: 'original', ownedDecor: ['original'], garage: [], garageColors: {},
    muted: false, order: null, stats: { earned: 0, washed: 0 },
  };
}

export function loadState(storage) {
  const fallback = createState();
  try {
    storage ??= globalThis.localStorage;
    const parsed = JSON.parse(storage?.getItem(SAVE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 2) return fallback;
    const state = { ...fallback, ...parsed };
    state.money = Math.max(0, Number(state.money) || 0);
    state.level = clamp(Math.floor(Number(state.level) || 1), 1, ORDER_COUNT);
    state.cycle = Math.max(1, Math.floor(Number(state.cycle) || 1));
    state.completed = Math.max(0, Math.floor(Number(state.completed) || 0));
    state.upgrades = Object.fromEntries(UPGRADES.map(u => [u.id, clamp(Math.floor(Number(parsed.upgrades?.[u.id]) || 0), 0, u.max)]));
    state.autoEnabled = { ...fallback.autoEnabled, ...(parsed.autoEnabled || {}) };
    state.ownedDecor = Array.isArray(parsed.ownedDecor) ? parsed.ownedDecor.filter(id => DECOR.some(d => d.id === id)) : ['original'];
    if (!state.ownedDecor.includes('original')) state.ownedDecor.unshift('original');
    state.decor = state.ownedDecor.includes(parsed.decor) ? parsed.decor : 'original';
    state.garage = Array.isArray(parsed.garage) ? [...new Set(parsed.garage.filter(id => COLLECTION.some(c => c.id === id)))] : [];
    state.garageColors = parsed.garageColors && typeof parsed.garageColors === 'object' ? parsed.garageColors : {};
    state.stats = { ...fallback.stats, ...(parsed.stats || {}) };
    state.muted = Boolean(parsed.muted);
    return state;
  } catch { return fallback; }
}

export function saveState(state, storage) {
  try { storage ??= globalThis.localStorage; storage?.setItem(SAVE_KEY, JSON.stringify(state)); return Boolean(storage); }
  catch { return false; }
}

export function toolStats(tool, upgrades = {}) {
  const def = TOOLS.find(t => t.id === tool) || TOOLS[0];
  const comfort = levelOf(upgrades, 'comfort');
  let radius = def.radius * (1 + comfort * 0.15);
  let power = def.power;
  if (tool === 'water') { radius *= 1 + levelOf(upgrades, 'water') * 0.12; power *= 1 + levelOf(upgrades, 'water') * 0.35; }
  if (tool === 'foam') { radius *= 1 + levelOf(upgrades, 'foam') * 0.1; power *= 1 + levelOf(upgrades, 'foam') * 0.55; }
  if (['sponge', 'brush', 'degreaser', 'polish', 'coat'].includes(tool)) power *= 1 + levelOf(upgrades, 'detail') * 0.45;
  if (['vacuum', 'hand'].includes(tool)) { radius *= 1 + levelOf(upgrades, 'interior') * 0.1; power *= 1 + levelOf(upgrades, 'interior') * 0.6; }
  return { radius, power };
}

const isInterior = zone => ['seats', 'mats', 'dash'].includes(zone);
const isWheel = zone => zone === 'wheels' || zone === 'rims';
const serviceType = type => ['polish', 'coat', 'paint', 'rims'].includes(type);

/** Generate actual spatial spots; the renderer owns the silhouette hit test. */
export function createDirt(order, sampleZone, options = {}) {
  if (typeof options === 'boolean') options = { interior: options };
  const interior = Boolean(options.interior);
  const service = options.service || null;
  const random = rng(order.seed + (interior ? 60013 : 0) + (service ? service.charCodeAt(0) * 127 : 0));
  const candidates = [];
  const step = interior ? 10 : 9;
  for (let y = 16; y < 610; y += step) {
    for (let x = 10; x < 991; x += step) {
      const px = x + (random() - 0.5) * step * 0.9;
      const py = y + (random() - 0.5) * step * 0.9;
      const zone = sampleZone(px, py);
      if (!zone || (interior ? !isInterior(zone) : isInterior(zone))) continue;
      if (service === 'rims' && !isWheel(zone)) continue;
      if (service && service !== 'rims' && zone !== 'body') continue;
      candidates.push({ x: px, y: py, zone });
    }
  }
  if (!candidates.length) return [];
  // A shuffled stratified distribution keeps every panel represented.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const wanted = service ? (service === 'rims' ? 100 : 540) : interior ? 550 : 1250;
  const chosen = candidates.slice(0, Math.min(wanted, candidates.length));
  const bodies = candidates.filter(p => !isWheel(p.zone));
  const centers = {};
  for (const type of ['mud', 'bugs', 'oil']) {
    centers[type] = Array.from({ length: type === 'mud' ? 5 : 3 }, () => bodies[Math.floor(random() * bodies.length)] || candidates[0]);
  }
  const types = order.dirtTypes || ['dust'];
  return chosen.map((p, index) => {
    let type = 'dust';
    if (service) type = service;
    else if (interior) {
      const roll = random();
      type = p.zone === 'dash' ? 'crumbs' : roll < 0.08 ? 'trash' : roll < 0.27 && p.zone === 'seats' ? 'stain' : 'crumbs';
    } else if (isWheel(p.zone) && types.includes('wheel')) type = 'wheel';
    else if (!isWheel(p.zone)) {
      if (types.includes('mud')) {
        const near = centers.mud.some(c => Math.hypot(p.x - c.x, (p.y - c.y) * 0.8) < 60);
        if (near || (p.y > 330 && random() < 0.47)) type = 'mud';
      }
      if (types.includes('bugs') && centers.bugs.some(c => Math.hypot(p.x - c.x, (p.y - c.y) * 1.25) < 32)) type = 'bugs';
      if (types.includes('oil') && centers.oil.some(c => Math.hypot(p.x - c.x, p.y - c.y) < 40)) type = 'oil';
    }
    const amount = service || interior ? 1 : 0.72 + random() * 0.28;
    return { ...p, type, amount, initial: amount, foam: 0, radius: type === 'trash' ? 7 + random() * 4 : service ? 12 + random() * 4 : 9 + random() * 8, id: index };
  });
}

function efficiency(point, tool, upgrades) {
  const type = point.type;
  const comfort = levelOf(upgrades, 'comfort');
  if (serviceType(type)) return type === tool ? 1 : 0;
  if (tool === 'water') {
    if (isInterior(point.zone)) return 0;
    if (type === 'dust') return 1;
    if (type === 'mud') return point.foam >= 0.18 ? 0.4 + point.foam * 2.8 : 0.065;
    if (type === 'bugs') return comfort >= 2 ? 0.52 : 0.025;
    if (type === 'oil') return comfort >= 3 ? 0.35 : 0;
    if (type === 'wheel') return comfort >= 2 ? 0.5 : 0.14;
  }
  if (tool === 'sponge') {
    if (type === 'bugs') return 1.7;
    if (type === 'stain') return 1.3 * (1 + levelOf(upgrades, 'interior') * 0.6);
    if (type === 'mud') return 0.55 + point.foam * 1.6;
    if (type === 'dust') return 0.6;
    if (type === 'oil') return 0.13;
    if (type === 'wheel') return 0.25;
  }
  if (tool === 'brush') {
    if (type === 'wheel') return 1.75;
    if (isWheel(point.zone)) return 1.3;
    if (type === 'mud') return 0.22 + point.foam * 0.4;
  }
  if (tool === 'degreaser') {
    if (type === 'oil') return 1.8;
    if (type === 'wheel') return 0.85;
    if (type === 'bugs') return 0.9;
    if (type === 'dust') return 0.18;
  }
  if (tool === 'vacuum') {
    if (type === 'crumbs') return 1.5;
    if (type === 'trash') return levelOf(upgrades, 'interior') >= 2 ? 1.5 : 0;
  }
  if (tool === 'hand' && type === 'trash') return 2;
  return 0;
}

/** dt is seconds. Only points touched by the tool are changed. */
export function applyTool(points, tool, x, y, dt, upgrades = {}) {
  if (!Array.isArray(points) || !Number.isFinite(x) || !Number.isFinite(y)) return 0;
  dt = clamp(Number(dt) || 0, 0, 0.25);
  if (!dt) return 0;
  const { radius, power } = toolStats(tool, upgrades);
  const radiusSquared = radius * radius;
  let affected = 0;
  for (const point of points) {
    if (point.amount <= 0 && !(tool === 'water' && point.foam > 0)) continue;
    const dx = point.x - x, dy = point.y - y;
    const d2 = dx * dx + dy * dy;
    if (d2 > radiusSquared) continue;
    const falloff = 0.38 + 0.62 * (1 - Math.sqrt(d2) / radius);
    if (tool === 'foam') {
      if (isInterior(point.zone) || serviceType(point.type)) continue;
      const before = point.foam;
      point.foam = clamp(point.foam + dt * power * falloff, 0, 1);
      if (point.foam > before) affected++;
      continue;
    }
    const beforeAmount = point.amount;
    const beforeFoam = point.foam;
    const rate = efficiency(point, tool, upgrades);
    if (rate > 0) {
      point.amount = Math.max(0, point.amount - dt * power * falloff * rate);
      if (point.amount < 0.008) point.amount = 0;
    }
    if (tool === 'water') point.foam = Math.max(0, point.foam - dt * power * falloff * (point.amount > 0 ? 0.15 : 2.5));
    if (point.amount < beforeAmount || point.foam < beforeFoam) affected++;
  }
  return affected;
}

/** Percent clean. At 97%, tiny leftovers disappear automatically. */
export function progress(points, requestedZones) {
  const totals = {}, remaining = {};
  const names = requestedZones || ['body', 'glass', 'wheels', 'rims', 'seats', 'mats', 'dash'];
  for (const name of names) { totals[name] = 0; remaining[name] = 0; }
  let initial = 0, dirty = 0;
  for (const p of points || []) {
    const start = Math.max(0.001, Number(p.initial) || 1);
    const amount = clamp(Number(p.amount) || 0, 0, start);
    initial += start; dirty += amount;
    totals[p.zone] = (totals[p.zone] || 0) + start;
    remaining[p.zone] = (remaining[p.zone] || 0) + amount;
  }
  const zoneValues = {};
  let normalized = false;
  for (const zone of Object.keys(totals)) {
    let value = totals[zone] ? (1 - remaining[zone] / totals[zone]) * 100 : 100;
    if (value >= 97) {
      if (remaining[zone] > 0) {
        dirty -= remaining[zone]; normalized = true;
        for (const p of points || []) if (p.zone === zone) { p.amount = 0; p.foam = 0; }
      }
      value = 100;
    }
    zoneValues[zone] = clamp(value, 0, 100);
  }
  let total = initial ? (1 - dirty / initial) * 100 : 100;
  if (total >= 97) {
    for (const p of points || []) { p.amount = 0; p.foam = 0; }
    for (const zone of Object.keys(zoneValues)) zoneValues[zone] = 100;
    total = 100; normalized = true;
  }
  return { total: clamp(total, 0, 100), zones: zoneValues, normalized };
}

/** Automation uses moving local tools, and returns their visible positions. */
export function automate(points, dt, upgrades = {}, enabled = {}, time = 0) {
  const active = [];
  if (!points?.length) return active;
  dt = clamp(Number(dt) || 0, 0, 0.25);
  const eligible = points.filter(p => p.amount > 0.001 && !isInterior(p.zone) && !serviceType(p.type));
  if (!eligible.length) return active;
  const use = id => levelOf(upgrades, id) > 0 && enabled[id] !== false;
  // A stable sorted traversal prevents targets jumping when earlier spots vanish.
  const all = points.filter(p => !isInterior(p.zone) && !serviceType(p.type));
  const bounds = all.reduce((b, p) => ({ minX: Math.min(b.minX, p.x), maxX: Math.max(b.maxX, p.x), minY: Math.min(b.minY, p.y), maxY: Math.max(b.maxY, p.y) }), { minX: 1000, maxX: 0, minY: 620, maxY: 0 });
  const targetAt = (list, speed) => list[Math.floor(time * speed) % list.length];
  if (use('autoFoam')) {
    const targets = eligible.filter(p => p.type === 'mud' && p.foam < 0.8);
    const target = targets.length ? targetAt(targets, 0.5) : null;
    if (target) {
      applyTool(points, 'foam', target.x, target.y, dt * 0.55, upgrades);
      active.push({ id: 'autoFoam', tool: 'foam', x: target.x, y: target.y, radius: toolStats('foam', upgrades).radius, label: 'Автопена' });
    }
  }
  if (use('autoWheels')) {
    const targets = eligible.filter(p => isWheel(p.zone));
    const target = targets.length ? targetAt(targets, 0.35) : null;
    if (target) {
      applyTool(points, 'brush', target.x, target.y, dt * 0.6, upgrades);
      active.push({ id: 'autoWheels', tool: 'brush', x: target.x, y: target.y, radius: toolStats('brush', upgrades).radius, label: 'Уход за колёсами' });
    }
  }
  if (use('assistant')) {
    const targets = eligible.filter(p => p.type === 'dust' || (p.type === 'mud' && p.foam > 0.2));
    const target = targets.length ? targetAt(targets, 0.18) : null;
    if (target) {
      // Assistant doesn't dissolve advanced spots even if manual tools are upgraded.
      const simple = points.filter(p => p.type === 'dust' || p.type === 'mud');
      applyTool(simple, 'water', target.x, target.y, dt * 0.48, upgrades);
      active.push({ id: 'assistant', tool: 'water', x: target.x, y: target.y, radius: toolStats('water', upgrades).radius, label: 'Помощник' });
    }
  }
  if (use('arch')) {
    const width = bounds.maxX - bounds.minX || 1;
    const t = ((time * 47) % (width * 2));
    const x = bounds.minX + (t > width ? width * 2 - t : t);
    const simple = points.filter(p => p.type === 'dust' || p.type === 'mud');
    for (let y = bounds.minY; y <= bounds.maxY; y += 45) {
      // The arch includes a mild pre-soak, leaving oil and insect marks untouched.
      for (const p of simple) if (p.type === 'mud' && Math.abs(p.x - x) < 50 && Math.abs(p.y - y) < 24) p.foam = Math.min(1, p.foam + dt * 0.35);
      applyTool(simple, 'water', x, y, dt * 0.16, upgrades);
    }
    active.push({ id: 'arch', tool: 'water', x, y: bounds.minY, bottom: bounds.maxY, radius: 40, label: 'Моечная рамка' });
  }
  return active;
}

export function isUnlocked(state, unlock) { return state.cycle > 1 || state.level >= unlock; }
export function upgradeCost(state, id) {
  const item = UPGRADES.find(u => u.id === id);
  if (!item) return Infinity;
  const current = levelOf(state.upgrades, id);
  return current >= item.max ? 0 : item.costs[current];
}

export function purchaseUpgrade(state, id) {
  const item = UPGRADES.find(u => u.id === id);
  if (!item) return { ok: false, reason: 'Такого улучшения нет.' };
  const current = levelOf(state.upgrades, id);
  if (current >= item.max) return { ok: false, reason: 'Уже улучшено до максимума.' };
  if (!isUnlocked(state, item.unlock)) return { ok: false, reason: `Доступно с заказа ${item.unlock}.` };
  const cost = item.costs[current];
  if (state.money < cost) return { ok: false, reason: 'Пока не хватает монет.', cost };
  state.money -= cost;
  state.upgrades[id] = current + 1;
  return { ok: true, cost, level: current + 1 };
}

export function purchaseDecor(state, id) {
  const item = DECOR.find(d => d.id === id);
  if (!item) return { ok: false, reason: 'Такого оформления нет.' };
  state.ownedDecor ||= ['original'];
  if (state.ownedDecor.includes(id)) { state.decor = id; return { ok: true, cost: 0, equipped: true }; }
  if (state.money < item.cost) return { ok: false, reason: 'Пока не хватает монет.', cost: item.cost };
  state.money -= item.cost;
  state.ownedDecor.push(id); state.decor = id;
  return { ok: true, cost: item.cost, equipped: true };
}

export function purchaseCar(state, id) {
  const item = COLLECTION.find(c => c.id === id);
  if (!item) return { ok: false, reason: 'Такого автомобиля нет.' };
  state.garage ||= [];
  if (state.garage.includes(id)) return { ok: false, reason: 'Уже в вашей коллекции.' };
  if (state.money < item.cost) return { ok: false, reason: 'Пока не хватает монет.', cost: item.cost };
  state.money -= item.cost;
  state.garage.push(id);
  state.garageColors ||= {};
  state.garageColors[id] = item.color;
  return { ok: true, cost: item.cost };
}

export function recolorCar(state, id, color) {
  if (!state.garage?.includes(id) || !/^#[0-9a-f]{6}$/i.test(color)) return { ok: false, reason: 'Сначала добавьте автомобиль в коллекцию.' };
  state.garageColors ||= {};
  state.garageColors[id] = color;
  return { ok: true };
}

/** Caller verifies all requested areas/services are complete before paying. */
export function finishOrder(state, reward) {
  const order = getOrder(state.level, state.cycle);
  const earned = Math.max(0, Math.round(Number.isFinite(reward) ? reward : order.reward));
  state.money += earned;
  state.completed += 1;
  state.stats ||= { earned: 0, washed: 0 };
  state.stats.earned = (Number(state.stats.earned) || 0) + earned;
  state.stats.washed = (Number(state.stats.washed) || 0) + 1;
  const newCycle = state.level >= ORDER_COUNT;
  if (newCycle) { state.level = 1; state.cycle += 1; }
  else state.level += 1;
  state.order = null;
  return { earned, newCycle, level: state.level, cycle: state.cycle };
}
