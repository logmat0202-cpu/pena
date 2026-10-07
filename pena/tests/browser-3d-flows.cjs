const assert=require('node:assert/strict');
const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const URL='http://127.0.0.1:5173',KEY='pena-save-v2';
const errors=[];
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const open=async(seed,mobile=false)=>{
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:960,height:600},hasTouch:mobile,deviceScaleFactor:1});
   if(seed)await context.addInitScript(({seed,key})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(seed));sessionStorage.setItem('seeded','1');}},{seed,key:KEY});
   const page=await context.newPage();page.setDefaultTimeout(90000);if(process.env.QA_FAST)page.screenshot=async()=>{};
   page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
   await page.goto(URL,{waitUntil:'networkidle',timeout:90000});await page.waitForFunction(()=>document.querySelector('#loading').hidden);console.log('Loaded order',seed?.level||1,mobile?'mobile':'desktop');return{context,page};
  };
  const saved=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
  const close=p=>p.locator('dialog[open] [data-close]').first().click();
  const menu=async(p,id)=>{await p.locator('#menu').click();await p.locator(`[data-open="${id}"]`).click();};
  const hold=async(p,spot,ms=2200)=>{await p.mouse.move(spot.sx,spot.sy);await p.mouse.down();await p.waitForTimeout(ms);await p.mouse.up();await p.waitForTimeout(400);};
  const visiblePoint=(page,collection='exterior',type=null)=>page.evaluate(async({key,collection,type})=>{
   const T=await import('/vendor/three.module.js'),V=await import('/vehicles3d.js'),E=await import('/engine.js');
   const s=JSON.parse(localStorage.getItem(key)),o=E.getOrder(s.level,s.cycle),inside=collection==='interior';
   const v=inside?V.createInteriorVehicle(o.carId):V.createVehicle(o.carId,o.color);v.group.updateMatrixWorld(true);
   const c=new T.PerspectiveCamera(matchMedia('(pointer:coarse)').matches?69:64,innerWidth/innerHeight,.055,100);c.position.fromArray(s.order.camera.position);c.rotation.set(s.order.camera.pitch,s.order.camera.yaw,0,'YXZ');c.updateMatrixWorld();
   const points=collection==='exterior'?s.order.exterior:inside?s.order.interior:s.order.services[collection];
   const rc=new T.Raycaster(),world=new T.Vector3(),normal=new T.Vector3(),candidates=[];
   for(const p of points){if(p.amount<=0||type&&p.type!==type)continue;world.set(p.wx,p.wy,p.wz);normal.set(p.nx,p.ny,p.nz);if(normal.dot(world.clone().sub(c.position))>=-.015)continue;const projection=world.clone().project(c);const sx=(projection.x+1)*innerWidth/2,sy=(1-projection.y)*innerHeight/2;if(sx<innerWidth*.1||sx>innerWidth*.90||sy<innerHeight*.16||sy>innerHeight*.77||projection.z>1)continue;rc.setFromCamera(new T.Vector2(projection.x,projection.y),c);const hit=rc.intersectObjects(v.surfaces.map(s=>s.mesh),false)[0];if(!hit||hit.point.distanceTo(world)>.08)continue;candidates.push({...p,sx,sy,distance:Math.hypot(sx-innerWidth/2,sy-innerHeight*.5)});}
   candidates.sort((a,b)=>a.distance-b.distance);return candidates[0]||null;
  },{key:KEY,collection,type});
  let {context,page}=await open();
  const seeds=await page.evaluate(async()=>{
   const E=await import('/engine.js'),V=await import('/vehicles3d.js'),W=await import('/wash3d.js'),T=await import('/vendor/three.module.js');
   function make(level,opts={}){
    const state=E.createState();state.level=level;state.money=opts.money||0;state.muted=true;Object.assign(state.upgrades,opts.upgrades||{});
    const order=E.getOrder(level),v=V.createVehicle(order.carId,order.color);v.group.updateMatrixWorld(true);
    const work={key:`3d:${level}:1`,format:3,exterior:W.createSurfaceDirt(v,order),interior:[],services:{},startedServices:{},paintColor:'#a49cbd',rimsStyle:1,paintComplete:false,rimsComplete:false,polishComplete:false,coatComplete:false,view:'exterior',tool:'water',activeService:null,started:true};
    if(order.interior){const iv=V.createInteriorVehicle(order.carId);iv.group.updateMatrixWorld(true);work.interior=W.createSurfaceDirt(iv,order,{interior:true});}
    for(const id of order.services){const all=W.createSurfaceDirt(v,order,{service:id});work.services[id]=all;if(opts.smallServices){const candidate=all.find(p=>p.nx>.9&&(id==='rims'||p.wy>.65&&p.wy<1.1))||all[0];work.services[id]=[candidate];const c=new T.PerspectiveCamera();c.rotation.order='YXZ';c.position.set(candidate.wx+candidate.nx*2.1,candidate.wy+.75,candidate.wz+candidate.nz*2.1+.25);c.lookAt(new T.Vector3(candidate.wx,candidate.wy,candidate.wz));work.camera={position:c.position.toArray(),yaw:c.rotation.y,pitch:c.rotation.x,stepUp:false};}}
    if(opts.cleanExterior||opts.cleanAll)work.exterior.forEach(p=>p.amount=0);
    if(opts.cleanAll){work.interior.forEach(p=>p.amount=0);Object.values(work.services).flat().forEach(p=>p.amount=0);}
    if(opts.assets){state.decor='botanical';state.ownedDecor.push('botanical');state.garage=['pixie'];state.garageColors={pixie:'#123456'};}
    state.order=work;return state;
   }
   return{finish:make(1,{cleanAll:true}),interior:make(21,{cleanExterior:true}),paint:make(31,{cleanExterior:true,smallServices:true}),rims:make(34,{cleanExterior:true,smallServices:true}),auto:make(19,{money:50000,upgrades:{assistant:1}}),loop:make(40,{money:1234,cleanAll:true,assets:true,upgrades:{water:2,autoFoam:1}})};
  });
  let state;
  if(!process.env.QA_REMAINING){
  const before=await saved(page),point=await visiblePoint(page);assert(point,'Initial car has an accessible visible dirty point');
  await hold(page,point,2500);const after=await saved(page);
  const changed=after.order.exterior.filter((p,i)=>p.amount<before.order.exterior[i].amount);
  assert(changed.length>2,'Real 3D pointer removes local dirt');assert(changed.length<after.order.exterior.length*.2,'Cleaning remains spatial');
  assert(changed.every(p=>p.nx*point.nx+p.ny*point.ny+p.nz*point.nz>0),'Opposite faces remain dirty');
  await page.reload({waitUntil:'networkidle'});assert.deepEqual((await saved(page)).order.exterior,after.order.exterior);
  const poseBefore=(await saved(page)).order.camera;
  await page.keyboard.down('d');await page.waitForTimeout(900);await page.keyboard.up('d');await page.locator('#menu').click();const walked=(await saved(page)).order.camera;assert.notDeepEqual(walked.position,poseBefore.position);await close(page);
  await page.mouse.move(650,420);await page.mouse.down({button:'right'});await page.mouse.move(730,440,{steps:10});await page.mouse.up({button:'right'});const rotated=(await saved(page)).order.camera;assert.notEqual(rotated.yaw,walked.yaw);
  await page.screenshot({path:'/tmp/pena-3d-washed.png'});console.log('PASS 3D local pointer cleaning, untouched backfaces, reload, WASD and right-drag');await context.close();

  ({context,page}=await open(seeds.finish));await page.locator('#finish').click();await page.locator('#result-dialog').waitFor({state:'visible'});assert.match(await page.locator('#result-money').innerText(),/225/);await page.locator('#compare-slider').fill('67');await page.screenshot({path:'/tmp/pena-3d-result.png'});await page.locator('#result-shop').click();await page.locator('[data-upgrade="water"]').click();state=await saved(page);assert.equal(state.money,65);assert.equal(state.upgrades.water,1);assert.equal(state.level,2);await close(page);await page.reload({waitUntil:'networkidle'});assert.equal((await saved(page)).upgrades.water,1);console.log('PASS 3D result, comparison, payment, first purchase and order2 persistence');await context.close();
  }else await context.close();

  if(!process.env.QA_SERVICES){
  ({context,page}=await open(seeds.interior));await page.locator('#view-toggle').click();await page.waitForTimeout(2700);await page.locator('#menu').click();await close(page);
  for(const [type,tool]of[['trash','hand'],['stain','sponge'],['crumbs','vacuum']]){const p=await visiblePoint(page,'interior',type);assert(p,`Visible interior ${type}`);await page.locator(`[data-tool="${tool}"]`).click();const old=(await saved(page)).order.interior.find(q=>q.id===p.id).amount;await hold(page,p,2200);assert((await saved(page)).order.interior.find(q=>q.id===p.id).amount<old,`${tool} changes interior dirt`);}
  await page.screenshot({path:'/tmp/pena-3d-interior-ui.png'});await page.reload({waitUntil:'networkidle'});assert.equal((await saved(page)).order.view,'interior');console.log('PASS 3D interior trash, sponge, vacuum and saved view');await context.close();
  }

  for(const service of['paint','rims']){
   ({context,page}=await open(seeds[service]));await page.locator(`#service-actions button[data-service="${service}"]`).click();
   if(service==='paint')await page.locator('[data-paint="#dd8c76"]').click();else await page.locator('[data-rims="2"]').click();
   await page.waitForTimeout(2300);const p=await visiblePoint(page,service);assert(p,`Visible ${service} point`);await hold(page,p,3500);
   state=await saved(page);assert.equal(state.order[service+'Complete'],true,`${service} finishes`);assert(await page.locator('#finish').isVisible());
   if(service==='paint')assert.equal(state.order.paintColor,'#dd8c76');else assert.equal(state.order.rimsStyle,2);
   await page.screenshot({path:`/tmp/pena-3d-${service}.png`});console.log(`PASS 3D ${service} choice and spatial completion`);await context.close();
  }

  ({context,page}=await open(seeds.auto));await menu(page,'shop');await page.locator('[data-shop="automation"]').click();await page.locator('[data-upgrade="autoFoam"]').click();await page.locator('[data-upgrade="autoWheels"]').click();for(const id of['assistant','autoFoam','autoWheels'])await page.locator(`[data-auto="${id}"]`).uncheck();await close(page);const paused=(await saved(page)).order.exterior.map(p=>p.amount);await page.waitForTimeout(2600);assert.deepEqual((await saved(page)).order.exterior.map(p=>p.amount),paused);await menu(page,'shop');await page.locator('[data-auto="assistant"]').check();await close(page);await page.waitForTimeout(4000);assert((await saved(page)).order.exterior.some((p,i)=>p.amount<paused[i]));assert.match(await page.locator('#auto-hud').innerText(),/Помощник/);
  await menu(page,'garage');await page.locator('[data-buy-car="pixie"]').click();await page.locator('[data-id="pixie"][data-garage-color="#86abc8"]').click();assert.equal((await saved(page)).garageColors.pixie,'#86abc8');await page.screenshot({path:'/tmp/pena-3d-garage-ui.png'});await close(page);await menu(page,'shop');await page.locator('[data-shop="decor"]').click();await page.locator('[data-decor="botanical"]').click();await close(page);await page.reload({waitUntil:'networkidle'});state=await saved(page);assert.equal(state.decor,'botanical');assert.equal(state.garageColors.pixie,'#86abc8');console.log('PASS automation purchase/toggle/local effect, garage collection/recolor, booth decor/save');await context.close();

  ({context,page}=await open(seeds.loop));await page.locator('#finish').click();assert.match(await page.locator('#result-kicker').innerText(),/КРУГ 1 ЗАВЕРШЁН/);state=await saved(page);assert.equal(state.level,1);assert.equal(state.cycle,2);assert.equal(state.upgrades.water,2);assert.equal(state.decor,'botanical');assert.equal(state.garageColors.pixie,'#123456');assert(state.money>1234);await page.locator('#next-order').click();await page.evaluate(()=>document.exitPointerLock?.());await page.reload({waitUntil:'networkidle'});assert.equal((await saved(page)).cycle,2);console.log('PASS order40 -> cycle2/order1 with money, upgrades, garage and decor preserved');await context.close();

  ({context,page}=await open(null,true));const p=await visiblePoint(page);assert(p);const prior=(await saved(page)).order.exterior.map(p=>p.amount),cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.sx,y:p.sy,radiusX:5,radiusY:5}]});await page.waitForTimeout(2400);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);assert((await saved(page)).order.exterior.some((p,i)=>p.amount<prior[i]));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'/tmp/pena-3d-mobile-wash.png'});console.log('PASS mobile touch washing and portrait layout');await context.close();
  assert.deepEqual(errors,[],'Browser runtime errors');console.log('PASS zero browser errors');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
