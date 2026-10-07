import * as THREE from './vendor/three.module.js';

export function createWorld(scene, decorId = 'original') {
  const group = new THREE.Group();
  group.name = 'cozy-carwash';
  scene.add(group);
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const interactables = [], animated = [], signs = [];
  const themes = {
    original: {wall:'#f3eee0',lower:'#91b7a5',floor:'#e1ded1',tile:'#c8c7bc',accent:'#446958',frame:'#c7dbcb',sign:'#fff7d7',light:'#fff0d1',outdoor:'#bed7b1'},
    terracotta: {wall:'#f5dfc9',lower:'#cc836d',floor:'#e6c9ad',tile:'#c2a78d',accent:'#904d3d',frame:'#f1b38c',sign:'#fff1d2',light:'#ffddaa',outdoor:'#c6d4aa'},
    botanical: {wall:'#e3ecdc',lower:'#628c68',floor:'#cdd2bd',tile:'#a6b29b',accent:'#315e47',frame:'#c7d8a5',sign:'#efffd6',light:'#eaffcd',outdoor:'#a0c587'},
    midnight: {wall:'#454f66',lower:'#263e56',floor:'#778694',tile:'#526b7a',accent:'#8ba7bf',frame:'#5fa2bc',sign:'#b8f3ff',light:'#c5e4ff',outdoor:'#95b6ac'},
    riviera: {wall:'#fff1d8',lower:'#6aa8b9',floor:'#dbe4df',tile:'#abbfc1',accent:'#316f8b',frame:'#e6c794',sign:'#fff8dd',light:'#fff2bd',outdoor:'#a3c8af'}
  };
  let theme = themes[decorId] || themes.original;
  const mat = (color, options = {}) => {const m=new THREE.MeshStandardMaterial({color,roughness:.8,...options});materials.add(m);return m;};
  const wall=mat(theme.wall),lower=mat(theme.lower),floor=mat(theme.floor),tile=mat(theme.tile);
  const accent=mat(theme.accent),frame=mat(theme.frame),wood=mat('#b88b65'),woodLight=mat('#d7b88a');
  const metal=mat('#6c7b75',{metalness:.3,roughness:.5}),dark=mat('#34443f'),white=mat('#fff9e9');
  const rubber=mat('#334044'),brass=mat('#c8ac69',{metalness:.45,roughness:.4});
  const leaf=mat('#6b9872',{flatShading:true}),leafLight=mat('#94b98a',{flatShading:true}),leafDark=mat('#4c7859',{flatShading:true});
  const terracotta=mat('#b7785e'),glass=mat('#bddbd5',{transparent:true,opacity:.43,roughness:.18,metalness:.12});
  const lampMaterial=mat(theme.sign,{emissive:theme.sign,emissiveIntensity:.9,roughness:.3});
  const water=mat('#a5cfcd',{transparent:true,opacity:.26,roughness:.08,metalness:.15,depthWrite:false});
  const outsideGround=mat(theme.outdoor);
  scene.background=new THREE.Color('#dcebe4');
  scene.fog=new THREE.Fog('#dcebe4',28,82);
  function mesh(geometry,material,position,parent=group){
    geometries.add(geometry);
    const m=new THREE.Mesh(geometry,material);
    if(position)m.position.set(...position);
    m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function box(w,h,d,m,p,parent=group){return mesh(new THREE.BoxGeometry(w,h,d),m,p,parent);}
  function cylinder(rt,rb,h,m,p,segments=12,parent=group){return mesh(new THREE.CylinderGeometry(rt,rb,h,segments),m,p,parent);}
  function sphere(r,m,p,parent=group,detail=0){return mesh(new THREE.IcosahedronGeometry(r,detail),m,p,parent);}
  function batch(geometry,material,positions,parent=group){
    geometries.add(geometry);const object=new THREE.InstancedMesh(geometry,material,positions.length),transform=new THREE.Matrix4();
    positions.forEach((p,i)=>{transform.makeTranslation(...p);object.setMatrixAt(i,transform);});
    object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;
  }
  function line(points,r,m,parent=group){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(10,points.length*6),r,6,false),m,null,parent);}
  function sign(text,w,h,pos,rotation=0,options={}){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024*h/w);
    const ctx=canvas.getContext('2d'),ch=canvas.height;
    if(options.background){ctx.fillStyle=options.background;ctx.fillRect(0,0,1024,ch);}
    ctx.fillStyle=options.color||'#365747';
    ctx.font=(options.weight||700)+' '+Math.min(ch*.62,1024/(text.length*.63))+'px Arial, sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,ch*.53,980);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.add(texture);
    signs.push({ctx,canvas,texture,text,options});
    const m=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide});materials.add(m);
    const object=mesh(new THREE.PlaneGeometry(w,h),m,pos);object.rotation.y=rotation;object.castShadow=false;object.receiveShadow=false;return object;
  }
  function plant(x,z,size=1,parent=group){
    const p=new THREE.Group();parent.add(p);p.position.set(x,0,z);
    cylinder(.26*size,.21*size,.5*size,terracotta,[0,.25*size,0],10,p);
    cylinder(.273*size,.273*size,.09*size,terracotta,[0,.49*size,0],10,p);
    cylinder(.23*size,.23*size,.025*size,dark,[0,.5*size,0],10,p);
    line([[0,.48*size,0],[.02*size,.95*size,0],[-.03*size,1.42*size,.01*size]],.023*size,leafDark,p);
    for(let i=0;i<8;i++){
      const angle=i*2.399,y=(.7+i*.075)*size;
      const l=sphere(.23*size,i%2?leaf:leafLight,[Math.cos(angle)*.18*size,y,Math.sin(angle)*.18*size],p);
      l.scale.set(1,.43,1.8);l.rotation.set(.2,angle,.36);
    }
    return p;
  }
  function bottle(x,y,z,color,scale=1,parent=group){
    const bmat=mat(color),b=new THREE.Group();b.position.set(x,y,z);parent.add(b);
    cylinder(.07*scale,.085*scale,.25*scale,bmat,[0,.125*scale,0],8,b);
    cylinder(.035*scale,.04*scale,.075*scale,white,[0,.288*scale,0],8,b);
    box(.10*scale,.05*scale,.037*scale,accent,[.023*scale,.337*scale,0],b);
    box(.14*scale,.095*scale,.01*scale,white,[0,.135*scale,.077*scale],b);return b;
  }
  function interactive(id,target,label,position){
    target.traverse(o=>o.userData.interaction=id);
    interactables.push({id,mesh:target,label,position:new THREE.Vector3(...position)});
  }
  // The front of the building is entirely open.
  box(16,.16,18,floor,[0,-.095,0]);
  box(.2,4.7,18,wall,[-8.1,2.3,0]);box(.2,4.7,18,wall,[8.1,2.3,0]);box(16.4,4.7,.2,wall,[0,2.3,-9.1]);
  box(.035,1.18,18,lower,[-7.988,.59,0]);box(.035,1.18,18,lower,[7.988,.59,0]);box(16,1.18,.04,lower,[0,.59,-8.985]);
  box(.06,.075,18,frame,[-7.957,1.21,0]);box(.06,.075,18,frame,[7.957,1.21,0]);box(16,.075,.06,frame,[0,1.21,-8.95]);
  batch(new THREE.BoxGeometry(.012,.003,18),tile,Array.from({length:17},(_,i)=>[i-8,.001,0]));
  batch(new THREE.BoxGeometry(16,.003,.012),tile,Array.from({length:19},(_,i)=>[0,.002,i-9]));
  box(16.3,.18,18.2,wall,[0,4.76,0]);
  for(let z=-7;z<=9;z+=4)box(16.2,.20,.19,frame,[0,4.58,z]);
  box(.32,4.68,.38,frame,[-7.86,2.32,8.83]);box(.32,4.68,.38,frame,[7.86,2.32,8.83]);
  box(16,.42,.4,frame,[0,4.47,8.8]);box(16.3,.16,.65,accent,[0,4.77,8.93]);
  const bayPaint=mat('#a8bbb0',{roughness:.95});
  box(.075,.012,9.4,bayPaint,[-3.45,.011,0]);box(.075,.012,9.4,bayPaint,[3.45,.011,0]);
  for(let x=-3.4;x<=3.4;x+=.8){box(.42,.012,.075,bayPaint,[x,.011,-4.7]);box(.42,.012,.075,bayPaint,[x,.011,4.7]);}
  for(const x of [-2.85,2.85]){
    box(.23,.013,7.8,dark,[x,.013,.1]);
    batch(new THREE.BoxGeometry(.205,.021,.036),metal,Array.from({length:43},(_,i)=>[x,.021,-3.72+i*.18]));
  }
  for(const [x,z,sx,sz]of[[-2.1,3.5,.8,.42],[2.1,-1.6,.5,1.1],[-1.6,-3.9,.7,.3],[3.3,2.2,.35,.7]]){
    const p=mesh(new THREE.CircleGeometry(1,18),water,[x,.023,z]);p.rotation.x=-Math.PI/2;p.scale.set(sx,sz,1);p.castShadow=false;
  }
  for(const z of [-5.8,3.5]){
    box(.045,1.7,2.7,frame,[-7.94,2.7,z]);box(.052,1.5,2.48,glass,[-7.906,2.7,z]);
    box(.07,.055,2.48,white,[-7.873,2.7,z]);box(.07,1.5,.05,white,[-7.873,2.7,z]);box(.33,.08,2.88,white,[-7.81,1.91,z]);
  }
  for(const x of[-5.4,0,5.4])for(const z of[-5,3.5]){
    cylinder(.02,.02,.28,metal,[x,4.34,z],8);cylinder(.34,.13,.15,accent,[x,4.18,z],14);cylinder(.30,.30,.045,lampMaterial,[x,4.095,z],14);
    const light=new THREE.PointLight(theme.light,5,8,2);light.position.set(x,3.96,z);group.add(light);animated.push({kind:'light',object:light});
  }
  const ambient=new THREE.HemisphereLight('#f7f4de','#758d7c',2.6);group.add(ambient);
  const sun=new THREE.DirectionalLight('#fff0cc',3.2);sun.position.set(-8,8,26);sun.target.position.set(0,0,-2);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-15;sun.shadow.camera.right=15;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-15;
  sun.shadow.camera.near=1;sun.shadow.camera.far=45;sun.shadow.bias=-.00045;sun.shadow.normalBias=.035;group.add(sun);group.add(sun.target);
  box(4.05,.94,.16,accent,[-1.1,3.67,-8.85]);
  sign('П Е Н А',3.6,.74,[-1.1,3.67,-8.753],0,{color:'#fff7de'});box(3.5,.035,.065,lampMaterial,[-1.1,3.23,-8.75]);
  const logo=sphere(.16,frame,[-3.41,3.72,-8.74]);logo.scale.set(1,1,.32);
  const logo2=sphere(.09,frame,[-3.63,3.93,-8.74]);logo2.scale.set(1,1,.32);
  sign('ХОРОШИЙ ДЕНЬ ДЛЯ ЧИСТОЙ МАШИНЫ',4.3,.19,[-1.1,3.04,-8.91],0,{color:'#557565',weight:500});
  // Workshop on the left wall.
  const shop=new THREE.Group();group.add(shop);
  box(1.35,.14,3.35,woodLight,[-6.8,.95,-2.55],shop);box(1.16,.72,3.05,lower,[-6.84,.48,-2.55],shop);
  for(const z of[-3.55,-2.55,-1.55]){box(.025,.6,.92,accent,[-6.245,.49,z],shop);box(.06,.045,.29,brass,[-6.2,.72,z],shop);}
  box(.13,1.28,2.7,wood,[-7.85,1.88,-2.55],shop);
  const pins=[];for(let row=0;row<5;row++)for(let col=0;col<10;col++)pins.push([-7.77,1.40+row*.22,-3.63+col*.24]);
  batch(new THREE.CylinderGeometry(.013,.013,.021,6).rotateZ(Math.PI/2),dark,pins,shop);
  for(const[z,color]of[[-3.4,'#74a0ae'],[-2.9,'#e6c178'],[-2.45,'#a9bfa6']]){
    box(.10,.47,.075,metal,[-7.71,1.95,z],shop);box(.18,.13,.24,mat(color),[-7.69,1.66,z],shop);
  }
  box(.14,.65,.95,dark,[-6.89,1.40,-2.28],shop);
  const terminal=sign('УЛУЧШЕНИЯ',.83,.21,[-6.81,1.47,-2.28],Math.PI/2,{color:'#c2e4c5'});shop.attach(terminal);
  const terminalArrow=sign('↗',.3,.27,[-6.8,1.25,-2.28],Math.PI/2,{color:'#a6d5b2'});shop.attach(terminalArrow);
  box(.43,.045,.83,metal,[-6.51,1.06,-2.28],shop);
  bottle(-6.65,1.02,-3.72,'#cabb89',1.15,shop);bottle(-6.42,1.02,-3.56,'#98b8a5',1.15,shop);bottle(-6.8,1.02,-1.2,'#c7987b',1.3,shop);
  const shopSign=sign('МАСТЕРСКАЯ',2.75,.37,[-7.74,2.80,-2.5],Math.PI/2,{color:'#34594b'});shop.attach(shopSign);
  interactive('shop',shop,'Мастерская',[-6.05,1.35,-2.55]);
  // Orders counter and physical clipboard.
  const orders=new THREE.Group();group.add(orders);
  box(1.4,.96,2.7,wood,[6.67,.49,-.4],orders);box(1.65,.105,2.96,white,[6.6,1.025,-.4],orders);
  batch(new THREE.BoxGeometry(.022,.75,.055),woodLight,Array.from({length:14},(_,i)=>[5.95,.5,-1.55+i*.18]),orders);
  box(.13,.76,.67,woodLight,[6.7,1.44,-.52],orders);box(.015,.64,.54,white,[6.624,1.44,-.52],orders);box(.025,.07,.2,metal,[6.60,1.80,-.52],orders);
  for(let y=1.25;y<1.6;y+=.09)box(.018,.014,.35,lower,[6.609,y,-.52],orders);
  cylinder(.14,.17,.07,brass,[6.16,1.125,.47],12,orders);sphere(.12,brass,[6.16,1.16,.47],orders);cylinder(.035,.035,.1,metal,[6.16,1.30,.47],8,orders);
  const ordersSign=sign('ЗАКАЗЫ',2.0,.47,[7.9,2.33,-.4],-Math.PI/2,{color:'#34594b'});orders.attach(ordersSign);
  plant(7.05,1.5,.8,orders);interactive('orders',orders,'Заказы',[5.78,1.25,-.4]);
  // Collection garage door, on the back wall.
  const garage=new THREE.Group();group.add(garage);
  box(3.45,3.0,.18,accent,[4.67,1.51,-8.83],garage);box(3.15,2.73,.055,frame,[4.67,1.42,-8.71],garage);
  batch(new THREE.BoxGeometry(3.1,.022,.024),accent,Array.from({length:13},(_,i)=>[4.67,.13+i*.21,-8.667]),garage);
  box(.63,.065,.11,metal,[4.67,.97,-8.61],garage);box(.13,3.17,.27,metal,[2.94,1.58,-8.71],garage);box(.13,3.17,.27,metal,[6.41,1.58,-8.71],garage);
  const garageSign=sign('ГАРАЖ',2.75,.44,[4.67,3.32,-8.73],0,{color:'#365e50'});garage.attach(garageSign);
  box(.24,.43,.13,accent,[6.74,1.20,-8.85],garage);cylinder(.055,.055,.022,lampMaterial,[6.74,1.26,-8.77],8,garage).rotation.x=Math.PI/2;
  interactive('garage',garage,'Личный гараж',[4.67,1.55,-8.25]);
  // Working details, clear of the vehicle perimeter.
  const reel=new THREE.Group();group.add(reel);reel.position.set(-7.60,1.39,5.75);reel.rotation.z=Math.PI/2;
  cylinder(.38,.38,.16,accent,[0,0,0],14,reel);cylinder(.30,.30,.19,rubber,[0,.015,0],14,reel);cylinder(.39,.39,.035,frame,[0,.12,0],14,reel);cylinder(.095,.095,.25,metal,[0,.11,0],10,reel);
  line([[-7.48,1.12,5.75],[-7.25,.45,5.78],[-6.3,.06,5.4],[-5.4,.045,4.9],[-5.4,.05,3.9],[-6.05,.05,4.0],[-6.15,.20,4.6]],.032,rubber);
  cylinder(.3,.24,.49,frame,[-5.77,.26,4.62],12);cylinder(.271,.271,.02,water,[-5.77,.5,4.62],12);
  mesh(new THREE.TorusGeometry(.29,.014,5,12,Math.PI),metal,[-5.77,.51,4.62]);
  box(.32,.08,.20,white,[-5.8,.60,4.6]).rotation.z=.3;
  box(3.1,.09,.6,woodLight,[-1.25,1.14,-8.58]);box(3.1,.09,.6,woodLight,[-1.25,.4,-8.58]);
  for(const x of[-2.65,.15])box(.065,1.12,.065,accent,[x,.57,-8.38]);
  for(let i=0;i<6;i++)bottle(-2.45+i*.37,1.19,-8.5,['#b9c9a0','#e1be81','#9fbccb'][i%3],1.3);
  for(const x of[-2,-.5]){box(.75,.47,.47,lower,[x,.68,-8.57]);box(.79,.05,.5,frame,[x,.94,-8.57]);}
  const clock=cylinder(.36,.36,.06,accent,[7.96,3.35,-4.6],24);clock.rotation.z=Math.PI/2;
  const face=cylinder(.315,.315,.07,white,[7.92,3.35,-4.6],24);face.rotation.z=Math.PI/2;
  for(let i=0;i<12;i++){const a=i*Math.PI/6;box(.014,.042,.022,accent,[7.875,3.35+Math.cos(a)*.262,-4.6+Math.sin(a)*.262]).rotation.x=-a;}
  box(.014,.19,.024,dark,[7.87,3.44,-4.6]);box(.014,.023,.15,dark,[7.866,3.35,-4.53]);
  box(.042,.95,.72,woodLight,[7.945,2.08,4.78]);sign('КАЖДАЯ КАПЛЯ',.65,.33,[7.917,2.21,4.78],-Math.PI/2,{color:'#527a67'});
  const drop=sphere(.14,frame,[7.895,1.91,4.78]);drop.scale.set(.16,1.35,1);
  plant(-6.9,-7.55,1.25);plant(7.1,7.45,1.2);plant(-7.05,7.66,1.1);
  // Outdoor street and low-poly silhouettes through the open entrance.
  box(100,.20,100,outsideGround,[0,-.22,29]);
  const paving=mat('#cfcebc'),curb=mat('#e9e1c8'),asphalt=mat('#8d9993');
  box(23,.06,5,paving,[0,-.09,11.6]);box(60,.08,7,asphalt,[0,-.075,18]);
  box(60,.18,.24,curb,[0,.01,14.43]);box(60,.18,.24,curb,[0,.01,21.56]);
  for(let x=-27;x<29;x+=4)box(2,.015,.08,white,[x,-.02,18]);
  for(const x of[-7.4,7.4]){cylinder(.10,.10,.90,accent,[x,.45,10.35],10);cylinder(.11,.11,.12,white,[x,.69,10.35],10);}
  function tree(x,z,scale=1){
    const t=new THREE.Group();t.position.set(x,0,z);group.add(t);cylinder(.13*scale,.22*scale,2.4*scale,wood,[0,1.2*scale,0],7,t);
    for(const[xx,yy,zz,rr]of[[0,3.1,0,1.25],[-.72,2.75,.1,.84],[.64,2.85,.27,.95],[.11,3.8,-.1,.7]]){
      const m=sphere(rr*scale,yy>3?leafLight:leaf,[xx*scale,yy*scale,zz*scale],t,1);m.scale.y=.9;
    }
  }
  tree(-11,12,1.4);tree(11.5,13.5,1.25);tree(-7,25,1.7);tree(5.5,27,1.5);tree(19,26,2);tree(-23,27,1.8);
  const hillMaterial=mat('#9fbd9b',{flatShading:true});
  for(const[x,z,s]of[[-31,48,15],[-10,60,18],[17,58,18],[36,43,14]]){const h=sphere(s,hillMaterial,[x,0,z],group,1);h.scale.set(1,.38,1);}
  const cloudmat=mat('#faf9e9',{flatShading:true});
  for(let i=0;i<4;i++){
    const cloud=new THREE.Group();cloud.position.set(-25+i*17,11+(i%2)*2,34+i*5);group.add(cloud);
    for(let j=0;j<4;j++){const puff=sphere(1.4,cloudmat,[(j-1.5)*1.4,Math.sin(j)*.4,0],cloud,1);puff.scale.set(1.4,.6,.8);puff.castShadow=false;}
    animated.push({kind:'cloud',object:cloud,x:cloud.position.x,phase:i});
  }
  // Theme-specific additions give each fit-out a distinct silhouette.
  const botanical=new THREE.Group();group.add(botanical);
  for(const z of[-5.8,3.5]){const p=plant(-7.68,z,.7,botanical);p.position.y=1.96;}
  for(const x of[-4.5,-3.4,1.4])plant(x,-8.15,.85,botanical);
  for(let i=0;i<8;i++){
    const xx=-3.2+i*.49;line([[xx,4.48,-8.2],[xx+.12,4.15,-8.2],[xx-.1,3.98,-8.2]],.025,leafDark,botanical);
    for(let j=0;j<4;j++){const l=sphere(.12,leaf,[xx+(j%2?.1:-.1),4.38-j*.14,-8.19],botanical);l.scale.y=.52;}
  }
  const terracottaProps=new THREE.Group();group.add(terracottaProps);
  box(2.2,.017,1.3,mat('#c98362'),[-6.2,.015,-5.7],terracottaProps);
  const rugStripe=mat('#ecd3ad');for(let i=-4;i<=4;i++)box(.06,.021,1.15,rugStripe,[-6.2+i*.21,.027,-5.7],terracottaProps);
  for(const x of[-4.6,-3.9]){cylinder(.23,.31,.70,terracotta,[x,.35,-8.2],10,terracottaProps);cylinder(.27,.23,.23,terracotta,[x,.81,-8.2],10,terracottaProps);}
  const midnight=new THREE.Group();group.add(midnight);const cyan=mat('#98e6e4',{emissive:'#53ccc6',emissiveIntensity:1.5});
  box(.04,.045,16.2,cyan,[-7.86,3.93,0],midnight);box(.04,.045,16.2,cyan,[7.86,3.93,0],midnight);box(15.7,.045,.04,cyan,[0,3.93,-8.85],midnight);
  const riviera=new THREE.Group();group.add(riviera);
  for(let i=0;i<12;i++)box(1.28,.025,.72,i%2?white:frame,[-7.1+i*1.3,4.85,9.08],riviera);
  for(const x of[-6.8,6.8]){
    const pot=plant(x,7.8,1.2,riviera);pot.children.filter(o=>o.material===leaf||o.material===leafLight).forEach(o=>o.scale.set(.4,.15,3.3));
  }
  box(.1,1.9,.46,woodLight,[7.90,2.5,-6.85],riviera).rotation.x=.13;
  const sets={botanical,terracotta:terracottaProps,midnight,riviera};
  function setDecor(id){
    theme=themes[id]||themes.original;
    wall.color.set(theme.wall);lower.color.set(theme.lower);floor.color.set(theme.floor);tile.color.set(theme.tile);accent.color.set(theme.accent);frame.color.set(theme.frame);
    outsideGround.color.set(theme.outdoor);lampMaterial.color.set(theme.sign);lampMaterial.emissive.set(theme.sign);
    for(const[key,value]of Object.entries(sets))value.visible=key===id;
    for(const s of signs){
      if(['#fff7de','#c2e4c5','#a6d5b2'].includes(s.options.color))continue;
      s.ctx.clearRect(0,0,s.canvas.width,s.canvas.height);
      if(s.options.background){s.ctx.fillStyle=s.options.background;s.ctx.fillRect(0,0,s.canvas.width,s.canvas.height);}
      s.ctx.fillStyle=id==='midnight'?'#d9efdf':s.options.color||'#365747';
      s.ctx.fillText(s.text,512,s.canvas.height*.53,980);s.texture.needsUpdate=true;
    }
    for(const a of animated)if(a.kind==='light')a.object.color.set(theme.light);
    ambient.intensity=id==='midnight'?2.1:2.6;sun.intensity=id==='midnight'?2.1:3.2;
    bayPaint.color.set(id==='terracotta'?'#b27b60':id==='midnight'?'#88bfc3':id==='riviera'?'#77a9b2':'#a8bbb0');
    group.userData.decorId=id;
  }
  setDecor(decorId);
  return{
    group,interactables,
    spawn:{position:[3.3,1.75,4.1],target:[0,.85,0]},
    bounds:{minX:-7,maxX:7,minZ:-8,maxZ:8},
    setDecor,
    update(dt,time){for(const a of animated)if(a.kind==='cloud')a.object.position.x=a.x+Math.sin(time*.015+a.phase)*1.1;},
    dispose(){scene.remove(group);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();sun.shadow.map?.dispose();}
  };
}
