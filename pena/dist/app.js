import * as THREE from './vendor/three.module.js';
import {CARS,TOOLS,UPGRADES,DECOR,COLLECTION,PALETTE,ORDER_COUNT,getOrder,loadState,saveState,progress,purchaseUpgrade,purchaseDecor,purchaseCar,recolorCar,finishOrder,upgradeCost,isUnlocked} from './engine.js';
import {createVehicle,createInteriorVehicle} from './vehicles3d.js';
import {createWorld} from './world3d.js';
import {createSurfaceDirt,applySurfaceTool,automateSurface,surfaceRadius} from './wash3d.js';
import {createPainter} from './paint3d.js';
import {createEffects} from './effects3d.js';
import {GameAudio} from './sound.js';
import {icon,initIcons} from './icons.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],fmt=n=>Math.round(n).toLocaleString('ru-RU'),pad=n=>String(n).padStart(2,'0');
const ZONES={body:'Кузов',glass:'Стёкла',wheels:'Колёса',rims:'Диски',seats:'Сиденья',mats:'Коврики',dash:'Панель'},DIRT={dust:'Пыль',mud:'Засохшая грязь',bugs:'Прилипшие пятна',oil:'Масло',wheel:'Грязь на дисках'},SERVICE={polish:'Полировка',coat:'Защита',paint:'Новый цвет',rims:'Новые диски'};
const mobile=matchMedia('(pointer:coarse)').matches;document.body.classList.toggle('mobile',mobile);initIcons();
const state=loadState(),audio=new GameAudio(state.muted),scene=new THREE.Scene();
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){$('#loading').innerHTML='<b>Пена</b><span>Для 3D-мойки включи WebGL или открой игру в другом браузере.</span>';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.90;
$('#world').appendChild(renderer.domElement);const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','3D-автомойка. WASD — движение, мышь — обзор, удерживайте кнопку для мойки.');
const camera=new THREE.PerspectiveCamera(mobile?69:64,innerWidth/innerHeight,.055,100);camera.rotation.order='YXZ';scene.add(camera);
const world=createWorld(scene,state.decor),effects=createEffects(scene,camera);
const brushRing=new THREE.Mesh(new THREE.RingGeometry(.985,1,48),new THREE.MeshBasicMaterial({color:'#e9fff4',transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}));brushRing.visible=false;scene.add(brushRing);
const raycaster=new THREE.Raycaster(),normalMatrix=new THREE.Matrix3(),mouse=new THREE.Vector2(0,0);
const keys=new Set(),joystick={x:0,y:0};let yaw=0,pitch=0,started=false,lookMode=false,stepUp=false,looking=false,spraying=false,locked=false,mouseInside=false;
let order,work,vehicle,interiorVehicle,painter,interiorPainter,view='exterior',tool='water',activeService=null,shopTab='tools',beforeImage='',dirty=true,saveNeeded=false,overall=0,exteriorProgress,interiorProgress,serviceProgress={},automations=[],lastHit=null,interaction=null;
let elapsed=0,lastTime=0,lastUi=0,lastPaint=0,toastTimer,tipTimer,orderGeneration=0,thumbnailRenderer=null,thumbnailCache=new Map();
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function disposeVehicle(v){if(!v)return;scene.remove(v.group);const mats=new Set();v.group.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const list=Array.isArray(o.material)?o.material:[o.material];list.forEach(m=>mats.add(m));}});mats.forEach(m=>{if(m.map&&m.map!==painter?.texture&&m.map!==interiorPainter?.texture)m.map.dispose();m.dispose();});}
function save(){if(!work)return;work.view=view;work.tool=tool;work.activeService=activeService;work.camera={position:camera.position.toArray(),yaw,pitch,stepUp};work.started=started;const ok=saveState(state);$('#save-dot').style.background=ok?'#e5f6c0a0':'#d99478';$('#save-dot').title=ok?'Прогресс сохранён':'Не удалось сохранить прогресс';saveNeeded=false;}
function pose(position,target){camera.position.fromArray(position);camera.lookAt(new THREE.Vector3(...target));yaw=camera.rotation.y;pitch=camera.rotation.x;}
function applyCarColor(){
 if(!vehicle)return;for(const s of vehicle.surfaces){if(s.zone==='body'&&work.paintComplete)s.mesh.material.color.set(work.paintColor);if(work.polishComplete&&s.zone==='body'){s.mesh.material.roughness=.19;s.mesh.material.metalness=.16;}if(work.coatComplete&&s.zone==='body'){s.mesh.material.roughness=.23;s.mesh.material.metalness=.12;}}
}
function initializeOrder(){
 stopSpray();orderGeneration++;if(painter)painter.dispose();if(interiorPainter)interiorPainter.dispose();disposeVehicle(vehicle);disposeVehicle(interiorVehicle);interiorPainter=null;interiorVehicle=null;
 order=getOrder(state.level,state.cycle);vehicle=createVehicle(order.carId,order.color,0);scene.add(vehicle.group);vehicle.group.updateMatrixWorld(true);
 if(order.interior){interiorVehicle=createInteriorVehicle(order.carId);scene.add(interiorVehicle.group);interiorVehicle.group.updateMatrixWorld(true);interiorVehicle.group.visible=false;}
 const key=`3d:${state.level}:${state.cycle}`,prior=state.order;
 if(prior?.key===key&&Array.isArray(prior.exterior)&&prior.exterior.length&&prior.services&&prior.exterior[0].wx!==undefined){work=prior;}
 else{work={key,format:3,exterior:createSurfaceDirt(vehicle,order),interior:order.interior?createSurfaceDirt(interiorVehicle,order,{interior:true}):[],services:{},startedServices:{},paintColor:PALETTE[(state.level+2)%PALETTE.length].color,rimsStyle:1,paintComplete:false,rimsComplete:false,polishComplete:false,coatComplete:false,view:'exterior',tool:'water',activeService:null};for(const id of order.services)work.services[id]=createSurfaceDirt(vehicle,order,{service:id});state.order=work;}
 work.startedServices ||= {};if(interiorVehicle){const reachable=new Set(interiorVehicle.surfaces.map(s=>s.id));work.interior=work.interior.filter(p=>reachable.has(p.surfaceId));}view=work.view==='interior'&&order.interior?'interior':'exterior';activeService=order.services.includes(work.activeService)?work.activeService:null;
 tool=TOOLS.some(t=>t.id===work.tool&&isUnlocked(state,t.unlock))?work.tool:'water';if(view==='interior'&&!['vacuum','hand','sponge'].includes(tool))tool='vacuum';
 if(work.rimsComplete){disposeVehicle(vehicle);vehicle=createVehicle(order.carId,work.paintComplete?work.paintColor:order.color,work.rimsStyle);scene.add(vehicle.group);}
 painter=createPainter(vehicle);interiorPainter=interiorVehicle?createPainter(interiorVehicle):null;applyCarColor();
 if(work.camera?.position?.length===3){camera.position.fromArray(work.camera.position);yaw=work.camera.yaw||0;pitch=work.camera.pitch||0;stepUp=!!work.camera.stepUp;camera.rotation.set(pitch,yaw,0,'YXZ');}
 else{pose(world.spawn.position,world.spawn.target);stepUp=false;}
 vehicle.group.visible=view==='exterior';if(interiorVehicle)interiorVehicle.group.visible=view==='interior';
 started=started||!!work.started;$('#start-prompt').hidden=started;$('#view-toggle').hidden=!order.interior;updateViewButton();
 world.setDecor(state.decor);renderer.shadowMap.needsUpdate=true;dirty=true;elapsed=0;effects.clear();effects.setTool(tool);renderTools();updateProgress();renderServiceActions();updateHeader();
 // The comparison uses the actual 3D vehicle and original dirt, without changing the playing scene.
 const initial=createSurfaceDirt(vehicle,order);beforeImage=thumbnail(order.carId,order.color,0,initial,'before-'+work.key);
 refreshPaint();save();
}
function refreshPaint(){
 const extras={};for(const id of order.services)if(work.startedServices[id]&&!({paint:work.paintComplete,polish:work.polishComplete,coat:work.coatComplete,rims:work.rimsComplete}[id]))extras[id]=work.services[id];
 painter.draw(work.exterior,extras,{paintColor:work.paintColor});if(interiorPainter)interiorPainter.draw(work.interior);dirty=false;
}
function updateHeader(){
 $('#money').textContent=fmt(state.money);$('#cycle').textContent=`Круг ${state.cycle}`;const short=order.name.split('«')[1]?.replace('»','')||order.name;
 $('#order-label').textContent=`${pad(state.level)} / ${ORDER_COUNT} · ${short}`;$('#order-pay').textContent=`${fmt(order.reward)} ₽`;
 $('#sound').innerHTML=icon(state.muted?'muted':'sound');$('#sound').setAttribute('aria-label',state.muted?'Включить звук':'Выключить звук');$$('.dialog-money').forEach(e=>e.textContent=fmt(state.money)+' ₽');
}
function points(){return activeService?work.services[activeService]:view==='interior'?work.interior:work.exterior;}
function activeVehicle(){return view==='interior'?interiorVehicle:vehicle;}
function renderTools(){
 const list=TOOLS.filter(t=>view==='interior'?['hand','vacuum','sponge'].includes(t.id):['water','foam','sponge','brush','degreaser'].includes(t.id));if(activeService)list.push(TOOLS.find(t=>t.id===activeService));
 $('#tools').innerHTML=list.map((t,i)=>{const unlocked=isUnlocked(state,t.unlock);return `<button class="tool-button ${tool===t.id?'selected':''} ${unlocked?'':'locked'}" data-tool="${t.id}" aria-label="${t.name}${unlocked?'':`, заказ ${t.unlock}`}" aria-pressed="${tool===t.id}" title="${unlocked?t.tip:`Откроется на заказе ${t.unlock}`}"><span class="tool-number">${i+1}</span>${!unlocked?`<span class="tool-lock">${icon('lock')}</span>`:''}${icon(t.icon)}<span class="tool-label">${t.label||t.name}</span></button>`;}).join('');
 $('#tools').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>selectTool(b.dataset.tool)));
 const t=TOOLS.find(t=>t.id===tool);$('#tool-tip').textContent=t?.tip||'';$('#tool-tip').classList.remove('faded');clearTimeout(tipTimer);tipTimer=setTimeout(()=>$('#tool-tip').classList.add('faded'),5500);
 effects.setTool(tool);
}
function selectTool(id){const t=TOOLS.find(t=>t.id===id);if(!t)return;if(!isUnlocked(state,t.unlock)){toast(`${t.name} — с заказа ${t.unlock}`);return;}if(activeService&&id!==activeService)activeService=null;tool=id;renderTools();renderServiceActions();dirty=true;saveNeeded=true;if(spraying)audio.start(tool);}
function updateProgress(){
 exteriorProgress=progress(work.exterior,['body','glass','wheels','rims']);interiorProgress=order.interior?progress(work.interior,['seats','mats','dash']):{total:100,zones:{}};serviceProgress=Object.fromEntries(order.services.map(id=>[id,progress(work.services[id]).total]));
 const all=[exteriorProgress.total,...(order.interior?[interiorProgress.total]:[]),...Object.values(serviceProgress)];overall=all.reduce((a,b)=>a+b,0)/all.length;
 $('#overall-bar').style.width=overall+'%';$('#order-open').title=`Заказ ${state.level} · ${Math.floor(overall)}% готово`;
 const zones=view==='interior'?interiorProgress.zones:exteriorProgress.zones;
 $('#zone-hud').innerHTML=Object.entries(zones).map(([id,v])=>`<span class="${v===100?'done':''}" title="${ZONES[id]}: ${Math.floor(v)}%">${ZONES[id]}<i><b style="width:${v}%"></b></i>${v===100?'✓':''}</span>`).join('');
 $('#finish').hidden=overall<99.99;$('#finish-pay').textContent=`+${fmt(order.reward)} ₽`;
 if(exteriorProgress.normalized||interiorProgress.normalized)dirty=true;
 let completed=false;
 for(const id of order.services){const key=id+'Complete';if(serviceProgress[id]>=100&&!work[key]){work[key]=true;completed=true;if(id==='rims')rebuildRims();else applyCarColor();if(activeService===id){activeService=null;tool='water';renderTools();}toast(`${SERVICE[id]} — готово`);audio.chime('complete');saveNeeded=true;dirty=true;}}
 if(completed)renderServiceActions();
 const servicesReady=exteriorProgress.total>=100;
 if($('#service-actions').dataset.ready!==String(servicesReady)){renderServiceActions();$('#service-actions').dataset.ready=String(servicesReady);}
 $$('.service-progress').forEach(el=>el.textContent=Math.floor(serviceProgress[el.dataset.service]||0)+'%');
 if($('#order-dialog').open)renderOrderDetails();
}
function rebuildRims(){painter.dispose();disposeVehicle(vehicle);vehicle=createVehicle(order.carId,work.paintComplete?work.paintColor:order.color,work.rimsStyle);scene.add(vehicle.group);vehicle.group.visible=view==='exterior';painter=createPainter(vehicle);applyCarColor();renderer.shadowMap.needsUpdate=true;dirty=true;}
function renderServiceActions(){
 const root=$('#service-actions');root.innerHTML='';if(view!=='exterior'||exteriorProgress.total<100)return;
 root.innerHTML=order.services.filter(id=>serviceProgress[id]<100).map(id=>`<button data-service="${id}"><span>${SERVICE[id]}</span><span class="service-progress" data-service="${id}">${Math.floor(serviceProgress[id]||0)}%</span></button>${activeService===id&&id==='paint'?`<div class="service-options">${PALETTE.map(c=>`<button data-paint="${c.color}" class="${work.paintColor===c.color?'selected':''}" style="background:${c.color}" title="${c.name}" aria-label="${c.name}"></button>`).join('')}</div>`:''}${activeService===id&&id==='rims'?`<div class="service-options">${[0,1,2].map(n=>`<button data-rims="${n}" class="${work.rimsStyle===n?'selected':''}" title="Комплект ${n+1}">${n+1}</button>`).join('')}</div>`:''}`).join('');
 root.querySelectorAll('[data-service]').forEach(b=>{if(b.tagName==='BUTTON')b.addEventListener('click',()=>startService(b.dataset.service));});
 root.querySelectorAll('[data-paint]').forEach(b=>b.addEventListener('click',()=>{work.paintColor=b.dataset.paint;dirty=true;saveNeeded=true;renderServiceActions();}));
 root.querySelectorAll('[data-rims]').forEach(b=>b.addEventListener('click',()=>{work.rimsStyle=Number(b.dataset.rims);saveNeeded=true;renderServiceActions();}));
}
function startService(id){if(exteriorProgress.total<100||serviceProgress[id]>=100)return;if(view==='interior')switchView('exterior');activeService=id;tool=id;work.startedServices[id]=true;dirty=true;saveNeeded=true;renderTools();renderServiceActions();}
function updateViewButton(){if($('#step-up'))$('#step-up').hidden=view==='interior';$('#view-toggle').innerHTML=icon(view==='interior'?'wash':'seats')+`<span>${view==='interior'?'Выйти из салона':'В салон'}</span>`;}
function switchView(next){
 stopSpray();activeService=null;
 if(next==='interior'){work.outsideCamera={position:camera.position.toArray(),yaw,pitch};stepUp=false;pose([0,1.52,-.70],[0,.66,.65]);tool='vacuum';}
 else{if(work.outsideCamera){camera.position.fromArray(work.outsideCamera.position);yaw=work.outsideCamera.yaw;pitch=work.outsideCamera.pitch;camera.rotation.set(pitch,yaw,0,'YXZ');}else pose(world.spawn.position,world.spawn.target);tool='water';}
 view=next;vehicle.group.visible=next==='exterior';if(interiorVehicle)interiorVehicle.group.visible=next==='interior';updateViewButton();renderer.shadowMap.needsUpdate=true;effects.clear();renderTools();updateProgress();renderServiceActions();dirty=true;saveNeeded=true;
}
function renderOrderDetails(){
 $('#order-number').textContent=`ЗАКАЗ ${pad(state.level)} / ${ORDER_COUNT} · КРУГ ${state.cycle}`;$('#order-title').textContent=order.name;$('#order-description').textContent=order.subtitle;$('#dirt-tags').innerHTML=order.dirtTypes.map(t=>`<span>${DIRT[t]}</span>`).join('');
 const zones={...exteriorProgress.zones,...(order.interior?interiorProgress.zones:{})};$('#order-zones').innerHTML=Object.entries(zones).map(([id,p])=>`<div class="order-zone">${icon(id)}<span>${ZONES[id]}</span><strong>${Math.floor(p)}%</strong><i><b style="width:${p}%"></b></i></div>`).join('');
 $('#order-services').innerHTML=order.services.map(id=>`<div class="order-zone">${icon(id)}<span>${SERVICE[id]}</span><strong>${Math.floor(serviceProgress[id]||0)}%</strong></div>`).join('');$('#reward').textContent=fmt(order.reward)+' ₽';$('#order-cta').textContent=overall>=99.99?'Сдать заказ · +'+fmt(order.reward)+' ₽':'За работу →';
}
function renderShop(){
 updateHeader();$$('[data-shop]').forEach(b=>b.classList.toggle('selected',b.dataset.shop===shopTab));const grid=$('#shop-grid');
 if(shopTab==='decor'){
  grid.innerHTML=DECOR.map(d=>{const owned=state.ownedDecor.includes(d.id);return `<article class="shop-card"><div class="decor-preview" style="--wall:${d.wall};--floor:${d.floor};--accent:${d.accent}"><div class="decor-floor"></div></div><h3>${d.name}</h3><p>${d.description}</p><button class="buy-button" data-decor="${d.id}" ${state.decor===d.id||!owned&&state.money<d.cost?'disabled':''}><span>${state.decor===d.id?'✓ В твоём боксе':owned?'Выбрать':'Купить комплект'}</span><span>${owned?'':fmt(d.cost)+' ₽'}</span></button></article>`;}).join('');
  grid.querySelectorAll('[data-decor]').forEach(b=>b.addEventListener('click',()=>{const r=purchaseDecor(state,b.dataset.decor);if(!r.ok){toast(r.reason);return;}world.setDecor(state.decor);renderer.shadowMap.needsUpdate=true;save();renderShop();audio.chime('purchase');toast('У бокса новое настроение');}));return;
 }
 const items=UPGRADES.filter(u=>u.category===shopTab);grid.innerHTML=items.map(u=>{const level=state.upgrades[u.id]||0,max=level>=u.max,locked=!isUnlocked(state,u.unlock),cost=upgradeCost(state,u.id);return `<article class="shop-card"><div class="upgrade-illustration">${icon(u.icon)}<span class="level-tag">${u.max===1?(level?'КУПЛЕНО':`ЗАКАЗ ${u.unlock}`):`${level} / ${u.max}`}</span></div><h3>${u.name}</h3><p>${u.description}</p><div class="effect">${u.desc}</div>${u.category==='automation'&&max?`<label class="auto-toggle"><span>${state.autoEnabled[u.id]!==false?'Помогает на мойке':'Выключен'}</span><input type="checkbox" data-auto="${u.id}" ${state.autoEnabled[u.id]!==false?'checked':''} aria-label="${u.name}"></label>`:`<button class="buy-button" data-upgrade="${u.id}" ${max||locked||state.money<cost?'disabled':''}><span>${max?'✓ Максимум':locked?`С заказа ${u.unlock}`:level?'Улучшить':'Купить'}</span><span>${max||locked?'':fmt(cost)+' ₽'}</span></button>`}</article>`;}).join('');
 grid.querySelectorAll('[data-upgrade]').forEach(b=>b.addEventListener('click',()=>{const r=purchaseUpgrade(state,b.dataset.upgrade);if(!r.ok){toast(r.reason);return;}save();renderShop();audio.chime('purchase');toast('Можно опробовать в боксе');}));
 grid.querySelectorAll('[data-auto]').forEach(c=>c.addEventListener('change',()=>{state.autoEnabled[c.dataset.auto]=c.checked;save();renderShop();}));
}
function thumbnail(carId,color,rims=0,dirt=null,key=null){
 const cacheKey=key||`${carId}:${color}:${rims}`;if(thumbnailCache.has(cacheKey))return thumbnailCache.get(cacheKey);
 if(!thumbnailRenderer){thumbnailRenderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});thumbnailRenderer.setSize(800,496);thumbnailRenderer.outputColorSpace=THREE.SRGBColorSpace;thumbnailRenderer.toneMapping=THREE.ACESFilmicToneMapping;thumbnailRenderer.toneMappingExposure=1;}
 const s=new THREE.Scene();s.background=new THREE.Color('#e4eddb');s.add(new THREE.HemisphereLight('#fff6de','#819c7b',2.5));const light=new THREE.DirectionalLight('#fff4d9',3.2);light.position.set(4,7,5);s.add(light);
 const v=createVehicle(carId,color,rims);s.add(v.group);let p=null;if(dirt){p=createPainter(v);p.draw(dirt);}
 const floor=new THREE.Mesh(new THREE.CircleGeometry(5,48),new THREE.MeshStandardMaterial({color:'#d4dfc9',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;s.add(floor);
 const c=new THREE.PerspectiveCamera(37,800/496,.1,40);c.position.set(5.2,2.85,6.2);c.lookAt(0,.7,0);thumbnailRenderer.render(s,c);const url=thumbnailRenderer.domElement.toDataURL('image/webp',.88);thumbnailCache.set(cacheKey,url);if(thumbnailCache.size>80)thumbnailCache.delete(thumbnailCache.keys().next().value);
 p?.dispose();const maps=new Set();s.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of(Array.isArray(o.material)?o.material:[o.material])){if(m.map)maps.add(m.map);m.dispose();}}});maps.forEach(t=>t.dispose());return url;
}
function renderGarage(){
 updateHeader();const grid=$('#garage-grid');grid.innerHTML=COLLECTION.map(c=>{const owned=state.garage.includes(c.id);return `<article class="garage-card"><img data-car-preview="${c.id}" alt="${c.name}"><div class="garage-info"><h3>${c.name}</h3><p>${c.description}</p>${owned?`<span class="owned-label">✓ В твоей коллекции</span><div class="color-options">${PALETTE.map(p=>`<button data-garage-color="${p.color}" data-id="${c.id}" class="${state.garageColors[c.id]===p.color?'selected':''}" style="background:${p.color}" title="${p.name}" aria-label="${p.name}"></button>`).join('')}</div>`:`<button class="buy-button" data-buy-car="${c.id}" ${state.money<c.cost?'disabled':''}><span>В коллекцию</span><span>${fmt(c.cost)} ₽</span></button>`}</div></article>`;}).join('');
 grid.querySelectorAll('[data-car-preview]').forEach(img=>{const c=COLLECTION.find(x=>x.id===img.dataset.carPreview);img.src=thumbnail(c.carId,state.garageColors[c.id]||c.color,c.id==='comet'?1:0);});
 grid.querySelectorAll('[data-buy-car]').forEach(b=>b.addEventListener('click',()=>{const r=purchaseCar(state,b.dataset.buyCar);if(!r.ok){toast(r.reason);return;}save();renderGarage();audio.chime('purchase');toast('Новый любимец в твоём гараже');}));
 grid.querySelectorAll('[data-garage-color]').forEach(b=>b.addEventListener('click',()=>{recolorCar(state,b.dataset.id,b.dataset.garageColor);save();renderGarage();}));
}
function releasePointer(){stopSpray();looking=false;keys.clear();joystick.x=joystick.y=0;if(document.pointerLockElement)document.exitPointerLock();}
function openPanel(id){releasePointer();$$('dialog[open]').forEach(d=>d.close());if(id==='orders'){renderOrderDetails();id='order';}if(id==='shop')renderShop();if(id==='garage')renderGarage();$('#'+id+'-dialog').showModal();save();}
function closeDialogs(){$$('dialog[open]').forEach(d=>d.close());}
function beginPlay(withLock=true){started=true;work.started=true;$('#start-prompt').hidden=true;closeDialogs();canvas.focus();if(withLock&&!mobile&&canvas.requestPointerLock){try{const p=canvas.requestPointerLock();p?.catch(()=>{});}catch{}}saveNeeded=true;}
function stopSpray(){spraying=false;audio.stop();$('#reticle').classList.remove('working');if(saveNeeded)save();}
function ray(){raycaster.setFromCamera(locked?new THREE.Vector2(0,0):mouse,camera);const v=activeVehicle();const hits=raycaster.intersectObjects(v?.surfaces.map(s=>s.mesh)||[],false);const h=hits[0];let hit=null;if(h&&h.distance<7){normalMatrix.getNormalMatrix(h.object.matrixWorld);const normal=h.face.normal.clone().applyNormalMatrix(normalMatrix);if(normal.dot(raycaster.ray.direction)>0)normal.negate();hit={point:h.point,normal,surfaceId:h.object.userData.surfaceId,object:h.object,distance:h.distance};}
 let nearest=null;for(const item of world.interactables){const hs=raycaster.intersectObject(item.mesh,true);if(hs.length&&hs[0].distance<6.4&&(!nearest||hs[0].distance<nearest.distance))nearest={...item,distance:hs[0].distance};}
 if(hit&&nearest&&hit.distance<nearest.distance)nearest=null;return{hit,interaction:nearest};}
function contextAction(){if(interaction)return{id:interaction.id,label:interaction.label};if(view==='interior')return{id:'exitInterior',label:'Выйти из салона'};if(Math.abs(camera.position.x)<3.5&&Math.abs(camera.position.z)<3.5){if(overall>=99.99)return{id:'finish',label:'Сдать заказ'};if(order.interior&&interiorProgress.total<100)return{id:'interior',label:'Сесть в салон'};const service=order.services.find(id=>serviceProgress[id]<100);if(exteriorProgress.total>=100&&service&&activeService!==service)return{id:'service',service,label:SERVICE[service]};}return null;}
function executeAction(action){if(!action)return;if(action.id==='interior')switchView('interior');else if(action.id==='exitInterior')switchView('exterior');else if(action.id==='service')startService(action.service);else if(action.id==='finish')$('#finish').click();else openPanel(action.id);}
function movePlayer(dt){
 let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joystick.y;
 let side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joystick.x;
 const len=Math.hypot(forward,side);if(len>1){forward/=len;side/=len;}if(len>.01){const speed=view==='interior'?1.2:keys.has('ShiftLeft')?3.3:2.3;const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed*dt,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed*dt;
 const inside=(x,z)=>Math.abs(x)<vehicle.dimensions.width/2+.32&&Math.abs(z)<vehicle.dimensions.length/2+.30;
 if(view==='interior'){camera.position.x=THREE.MathUtils.clamp(camera.position.x+dx,-interiorVehicle.dimensions.width/2+.12,interiorVehicle.dimensions.width/2-.12);camera.position.z=THREE.MathUtils.clamp(camera.position.z+dz,-interiorVehicle.dimensions.length/2+.18,interiorVehicle.dimensions.length/2-.18);}
 else{const nx=THREE.MathUtils.clamp(camera.position.x+dx,world.bounds.minX,world.bounds.maxX),nz=THREE.MathUtils.clamp(camera.position.z+dz,world.bounds.minZ,world.bounds.maxZ);if(!inside(nx,camera.position.z))camera.position.x=nx;if(!inside(camera.position.x,nz))camera.position.z=nz;}
 saveNeeded=true;}
 const eye=view==='interior'?1.48:stepUp?2.65:1.75;camera.position.y=THREE.MathUtils.lerp(camera.position.y,eye,Math.min(1,dt*6));camera.rotation.set(pitch,yaw,0,'YXZ');
}
function toggleStep(){if(view==='interior')return;stepUp=!stepUp;saveNeeded=true;toast(stepUp?'На подставке — крыша под рукой':'Снова на полу');}
const stepButton=document.createElement('button');stepButton.id='step-up';stepButton.innerHTML=icon('arch')+'<span>Подставка</span>';stepButton.title='Подставка · Пробел';$('#task-actions').prepend(stepButton);stepButton.addEventListener('click',toggleStep);
function frame(now){
 const dt=Math.min((now-lastTime)/1000||.016,.1);lastTime=now;const playing=!$('dialog[open]')&&!document.hidden;
 if(playing){elapsed+=dt;movePlayer(dt);camera.updateMatrixWorld();const target=ray();lastHit=target.hit;interaction=target.interaction;
  const action=contextAction();const prompt=$('#interact-prompt');prompt.hidden=!action;prompt.querySelector('span').textContent=action?.label||'';
  brushRing.visible=!!lastHit&&(spraying||locked||mouseInside);if(lastHit){brushRing.position.copy(lastHit.point).addScaledVector(lastHit.normal,.014);brushRing.lookAt(lastHit.point.clone().add(lastHit.normal));brushRing.scale.setScalar(surfaceRadius(tool,state.upgrades));brushRing.material.opacity=spraying?.48:.22;}
  if(spraying&&lastHit){const changed=applySurfaceTool(points(),tool,lastHit,dt,state.upgrades);if(changed){dirty=true;saveNeeded=true;}$('#reticle').classList.add('working');}
  else $('#reticle').classList.remove('working');
  if(view==='exterior'&&!activeService){automations=automateSurface(work.exterior,dt,state.upgrades,state.autoEnabled,elapsed);if(automations.length){dirty=true;saveNeeded=true;}}else automations=[];
  if(now-lastUi>230){updateProgress();lastUi=now;$('#auto-hud').textContent=automations.map(a=>a.label).join(' · ');}
  if(dirty&&now-lastPaint>45){refreshPaint();lastPaint=now;}
 }else{$('#interact-prompt').hidden=true;brushRing.visible=false;}
 const visualHit=lastHit||(spraying?{point:raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction,3.5),normal:raycaster.ray.direction.clone().negate()}:null);
 effects.update(dt,{spraying:playing&&spraying,hit:visualHit,tool,time:now/1000,automations:playing?automations:[],upgrades:state.upgrades,visible:playing});
 world.update(dt,now/1000);renderer.render(scene,camera);requestAnimationFrame(frame);
}
function updateMouse(e){const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));if(!locked){$('#reticle').style.left=e.clientX+'px';$('#reticle').style.top=e.clientY+'px';}}
let lastPointer={x:0,y:0};canvas.addEventListener('pointerdown',e=>{
 if($('dialog[open]'))return;e.preventDefault();started=true;$('#start-prompt').hidden=true;canvas.focus();lastPointer={x:e.clientX,y:e.clientY};mouseInside=true;
 if(e.button===2||mobile&&lookMode){looking=true;canvas.setPointerCapture(e.pointerId);return;}
 if(e.button!==0&&e.pointerType!=='touch')return;updateMouse(e);const target=ray();if(target.interaction){openPanel(target.interaction.id);return;}
 spraying=true;audio.start(tool);canvas.setPointerCapture(e.pointerId);saveNeeded=true;
});
canvas.addEventListener('pointermove',e=>{
 mouseInside=true;if(locked||looking){const dx=locked?e.movementX:e.clientX-lastPointer.x,dy=locked?e.movementY:e.clientY-lastPointer.y;yaw-=dx*.0027;pitch=THREE.MathUtils.clamp(pitch-dy*.0025,-1.45,1.35);saveNeeded=true;}
 if(!locked&&!looking)updateMouse(e);lastPointer={x:e.clientX,y:e.clientY};
});
canvas.addEventListener('pointerup',()=>{looking=false;stopSpray();});canvas.addEventListener('pointercancel',()=>{looking=false;stopSpray();});canvas.addEventListener('lostpointercapture',()=>{looking=false;stopSpray();});canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerleave',()=>{mouseInside=false;if(!locked&&!looking)stopSpray();});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;document.body.classList.toggle('immersed',locked);if(locked){mouse.set(0,0);$('#reticle').style.left='50%';$('#reticle').style.top='50%';}else stopSpray();});
window.addEventListener('keydown',e=>{
 if(e.code==='Escape'){stopSpray();return;}if($('dialog[open]')||e.target.matches('input'))return;
 if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft'].includes(e.code)){e.preventDefault();keys.add(e.code);}
 if(e.code==='Space'&&!e.repeat){e.preventDefault();toggleStep();}
 if(e.code==='KeyE'&&!e.repeat){e.preventDefault();executeAction(contextAction());}
 if(e.code==='KeyF'&&overall>=99.99&&!e.repeat){e.preventDefault();$('#finish').click();}
 if(e.code==='KeyR'&&!e.repeat&&activeService==='paint'){const index=PALETTE.findIndex(c=>c.color===work.paintColor);work.paintColor=PALETTE[(index+1)%PALETTE.length].color;dirty=true;saveNeeded=true;renderServiceActions();}
 if(e.code==='KeyR'&&!e.repeat&&activeService==='rims'){work.rimsStyle=(work.rimsStyle+1)%3;saveNeeded=true;renderServiceActions();}
 const n=Number(e.key);if(n>=1&&n<=9){const b=$$('#tools .tool-button')[n-1];if(b){e.preventDefault();selectTool(b.dataset.tool);}}
 if(e.code==='Tab'){e.preventDefault();openPanel('menu');}
});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();stopSpray();looking=false;});
const stick=$('#touch-joystick');let stickCenter={x:0,y:0};stick.addEventListener('pointerdown',e=>{e.preventDefault();const r=stick.getBoundingClientRect();stickCenter={x:r.left+r.width/2,y:r.top+r.height/2};stick.setPointerCapture(e.pointerId);moveStick(e);started=true;$('#start-prompt').hidden=true;});
function moveStick(e){if(!stick.hasPointerCapture(e.pointerId))return;let x=(e.clientX-stickCenter.x)/28,y=(e.clientY-stickCenter.y)/28;const d=Math.max(1,Math.hypot(x,y));x/=d;y/=d;joystick.x=x;joystick.y=y;stick.firstElementChild.style.transform=`translate(${x*24}px,${y*24}px)`;}
stick.addEventListener('pointermove',moveStick);function resetStick(){joystick.x=joystick.y=0;stick.firstElementChild.style.transform='';}stick.addEventListener('pointerup',resetStick);stick.addEventListener('pointercancel',resetStick);stick.addEventListener('lostpointercapture',resetStick);
$('#look-mode').addEventListener('click',()=>{if(mobile){lookMode=!lookMode;$('#look-mode').classList.toggle('selected',lookMode);toast(lookMode?'Веди по экрану, чтобы осмотреться':'Веди по машине, чтобы мыть');}else beginPlay(true);});
$('#enter').addEventListener('click',()=>beginPlay(true));$('#menu').addEventListener('click',()=>openPanel('menu'));$('#order-open').addEventListener('click',()=>openPanel('orders'));$('#resume').addEventListener('click',()=>beginPlay(true));$('#help').addEventListener('click',()=>openPanel('help'));
$('#view-toggle').addEventListener('click',()=>switchView(view==='interior'?'exterior':'interior'));
$$('[data-open]').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.open)));$$('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$$('[data-shop]').forEach(b=>b.addEventListener('click',()=>{shopTab=b.dataset.shop;renderShop();}));
$('#sound').addEventListener('click',()=>{state.muted=!state.muted;audio.setMuted(state.muted);updateHeader();save();if(!state.muted)audio.chime('purchase');});
// A sound control remains available in the compact mobile menu.
const soundMenu=document.createElement('button');soundMenu.className='text-button';soundMenu.textContent='Включить / выключить звук';soundMenu.addEventListener('click',()=>{$('#sound').click();toast(state.muted?'Звук выключен':'Звук включён');});$('#menu-dialog').insertBefore(soundMenu,$('.save-note'));
function updateComparison(){const p=Number($('#compare-slider').value);$('#result-before-wrap').style.clipPath=`inset(0 ${100-p}% 0 0)`;$('#compare-line').style.left=p+'%';}
$('#compare-slider').addEventListener('input',updateComparison);
$('#order-cta').addEventListener('click',()=>{if(overall>=99.99)$('#finish').click();else $('#order-dialog').close();});
$('#finish').addEventListener('click',()=>{
 updateProgress();if(overall<99.99)return;releasePointer();closeDialogs();const before=beforeImage,after=thumbnail(order.carId,work.paintComplete?work.paintColor:order.color,work.rimsComplete?work.rimsStyle:0,null,'after-'+work.key);const earned=order.reward;const result=finishOrder(state,earned);
 $('#result-before').src=before;$('#result-after').src=after;$('#result-money').textContent=`+${fmt(earned)} ₽`;$('#result-kicker').textContent=result.newCycle?`КРУГ ${state.cycle-1} ЗАВЕРШЁН`:'ЕЩЁ ОДНА СЧАСТЛИВАЯ МАШИНА';
 const unlock=TOOLS.filter(t=>t.unlock===state.level&&state.cycle===1);const message=result.newCycle?`Круг ${state.cycle}: все покупки с тобой, оплата выросла.`:unlock.length?`Открыто: ${unlock.map(t=>t.name.toLowerCase()).join(', ')}.`:state.completed===1?'Первая покупка уже по карману. Мощная струя — 160 ₽.':'';
 $('#result-unlock').textContent=message;$('#result-unlock').hidden=!message;$('#compare-slider').value=50;updateComparison();initializeOrder();$('#result-dialog').showModal();audio.chime('complete');
});
$('#next-order').addEventListener('click',()=>beginPlay(!mobile));$('#result-shop').addEventListener('click',()=>openPanel('shop'));
$$('dialog').forEach(d=>{d.addEventListener('close',()=>{dirty=true;});d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();stopSpray();save();}});setInterval(()=>{if(saveNeeded)save();},2200);
initializeOrder();$('#loading').hidden=true;if(mobile)$('#start-prompt p').textContent='Джойстик — ходить · веди по машине — мыть';requestAnimationFrame(frame);
