import * as THREE from './vendor/three.module.js';

/** Small reusable low-poly tools, water particles and visible helpers. */
export function createEffects(scene, camera) {
  const colors = { mint: 0x7d9f91, dark: 0x344e49, cream: 0xebe8d5, glove: 0xc9d6b6, brass: 0xc9b57b, blue: 0x99d1dd, yellow: 0xe7cd85, brown: 0xa78863 };
  const materials = {};
  const geometries = new Set();
  const ownMaterials = new Set();
  const mat = (color, roughness = 0.7, metalness = 0) => {
    const key = `${color}-${roughness}-${metalness}`;
    if (!materials[key]) { materials[key] = new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true }); ownMaterials.add(materials[key]); }
    return materials[key];
  };
  const mesh = (group, geometry, color, position = [0, 0, 0], rotation = [0, 0, 0]) => {
    geometries.add(geometry);
    const item = new THREE.Mesh(geometry, mat(color));
    item.position.set(...position); item.rotation.set(...rotation);
    group.add(item); return item;
  };
  const box = (group, size, color, position, rotation) => mesh(group, new THREE.BoxGeometry(...size), color, position, rotation);
  const cylinder = (group, r1, r2, height, color, position, rotation = [Math.PI / 2, 0, 0], sides = 8) => mesh(group, new THREE.CylinderGeometry(r1, r2, height, sides), color, position, rotation);
  const ball = (group, radius, color, position, detail = 0) => mesh(group, new THREE.IcosahedronGeometry(radius, detail), color, position);
  const roots = [];

  const handRoot = new THREE.Group();
  handRoot.position.set(0.3, -0.265, -0.5);
  handRoot.rotation.set(-0.035, -0.13, -0.03);
  camera.add(handRoot); roots.push(handRoot);
  const handLight = new THREE.PointLight(0xfff5dc, 0.32, 1.5, 2);
  handLight.position.set(-0.15, 0.05, -0.05); camera.add(handLight); roots.push(handLight);
  const models = new Map();
  let selected = 'water';
  let localTime = 0;
  let sway = 0;
  const toolNames = ['water', 'foam', 'sponge', 'brush', 'degreaser', 'vacuum', 'hand', 'polish', 'coat', 'paint', 'rims'];

  function glove(group, open = false) {
    const arm = cylinder(group, 0.043, 0.056, 0.21, colors.mint, [0.043, -0.15, 0.17], [-0.86, 0, -0.18]);
    cylinder(group, 0.05, 0.05, 0.045, colors.cream, [0.025, -0.065, 0.071], [-0.86, 0, -0.18]);
    const palm = ball(group, 0.065, colors.glove, [0.011, -0.018, 0.022], 1); palm.scale.set(0.79, 1, 0.67);
    if (open) {
      for (let i = 0; i < 4; i++) cylinder(group, 0.011, 0.014, 0.085 - Math.abs(i - 1.5) * 0.01, colors.glove, [-0.023 + i * 0.021, 0.062, 0.005], [0, 0, (i - 1.5) * -0.1]);
      cylinder(group, 0.015, 0.018, 0.065, colors.glove, [-0.043, 0.003, 0.008], [0, 0, -0.7]);
    } else {
      for (let i = 0; i < 3; i++) box(group, [0.062, 0.016, 0.038], colors.glove, [0.002, -0.037 + i * 0.021, -0.026], [0.08, 0, 0]);
      cylinder(group, 0.015, 0.019, 0.057, colors.glove, [-0.03, 0.014, -0.021], [0.12, 0, -0.57]);
    }
    return arm;
  }
  function gun(group, color = colors.mint) {
    box(group, [0.078, 0.13, 0.075], colors.dark, [0, 0.005, -0.006], [-0.16, 0, 0]);
    box(group, [0.095, 0.068, 0.18], color, [0, 0.083, -0.053]);
    cylinder(group, 0.028, 0.035, 0.14, colors.dark, [0, 0.086, -0.181]);
    cylinder(group, 0.019, 0.026, 0.055, colors.brass, [0, 0.086, -0.274]);
    box(group, [0.022, 0.045, 0.018], colors.brass, [-0.008, 0.022, -0.051], [0.2, 0, 0]);
    return new THREE.Vector3(0, 0.086, -0.31);
  }
  for (const id of toolNames) {
    const group = new THREE.Group(); handRoot.add(group); group.visible = id === selected;
    glove(group, id === 'hand');
    let muzzle = new THREE.Vector3(0, 0.05, -0.16);
    if (id === 'water' || id === 'foam' || id === 'paint') {
      muzzle = gun(group, id === 'paint' ? 0xc59080 : colors.mint);
      if (id === 'foam') {
        cylinder(group, 0.052, 0.066, 0.17, colors.cream, [0, -0.048, -0.18], [0, 0, 0]);
        box(group, [0.085, 0.055, 0.003], colors.mint, [0, -0.047, -0.242]);
        cylinder(group, 0.025, 0.035, 0.03, colors.brass, [0, 0.052, -0.18], [0, 0, 0]);
      }
      if (id === 'paint') {
        cylinder(group, 0.042, 0.032, 0.098, colors.cream, [0, 0.163, -0.075], [0, 0, 0]);
        cylinder(group, 0.047, 0.047, 0.015, colors.dark, [0, 0.219, -0.075], [0, 0, 0]);
      }
    } else if (id === 'sponge') {
      box(group, [0.16, 0.055, 0.105], colors.yellow, [0, 0.057, -0.099], [-0.12, 0.1, 0.05]);
      box(group, [0.163, 0.014, 0.108], 0x829578, [0, 0.09, -0.103], [-0.12, 0.1, 0.05]);
      for (let i = 0; i < 6; i++) ball(group, 0.006, 0xc5aa68, [-0.05 + (i % 3) * 0.048, 0.05 + Math.floor(i / 3) * 0.025, -0.155]);
    } else if (id === 'brush') {
      cylinder(group, 0.02, 0.024, 0.2, colors.brown, [0, 0.055, -0.07]);
      box(group, [0.16, 0.04, 0.081], colors.brown, [0, 0.057, -0.196]);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) box(group, [0.014, 0.042, 0.014], colors.cream, [-0.062 + i * 0.031, 0.012, -0.222 + j * 0.026]);
      muzzle.set(0, 0.015, -0.23);
    } else if (id === 'degreaser' || id === 'coat') {
      const bottleColor = id === 'coat' ? 0x94bfc7 : 0xbacb8f;
      box(group, [0.097, 0.143, 0.086], bottleColor, [0, 0.055, -0.083]);
      cylinder(group, 0.024, 0.046, 0.04, bottleColor, [0, 0.147, -0.083], [0, 0, 0]);
      box(group, [0.045, 0.038, 0.085], colors.cream, [0, 0.18, -0.103]);
      box(group, [0.039, 0.024, 0.024], colors.dark, [0, 0.18, -0.153]);
      box(group, [0.02, 0.047, 0.018], colors.dark, [0, 0.132, -0.131], [-0.4, 0, 0]);
      box(group, [0.062, 0.051, 0.003], colors.cream, [0, 0.055, -0.129]);
      muzzle.set(0, 0.18, -0.17);
    } else if (id === 'vacuum') {
      cylinder(group, 0.031, 0.033, 0.24, colors.dark, [0, 0.059, -0.09]);
      cylinder(group, 0.034, 0.034, 0.043, colors.cream, [0, 0.059, -0.157]);
      box(group, [0.19, 0.037, 0.093], colors.mint, [0, 0.038, -0.243], [0.08, 0, 0]);
      box(group, [0.174, 0.018, 0.016], colors.dark, [0, 0.023, -0.288]);
      muzzle.set(0, 0.03, -0.3);
    } else if (id === 'polish') {
      box(group, [0.083, 0.096, 0.126], colors.mint, [0, 0.07, -0.07]);
      cylinder(group, 0.076, 0.076, 0.025, colors.dark, [0, 0.067, -0.146]);
      cylinder(group, 0.084, 0.084, 0.027, colors.cream, [0, 0.067, -0.172]);
      cylinder(group, 0.061, 0.074, 0.013, 0xdadcc4, [0, 0.067, -0.193]);
      muzzle.set(0, 0.067, -0.2);
    } else if (id === 'rims') {
      box(group, [0.073, 0.13, 0.063], colors.dark, [0, 0.017, 0], [-0.12, 0, 0]);
      cylinder(group, 0.052, 0.052, 0.14, colors.mint, [0, 0.097, -0.06]);
      cylinder(group, 0.025, 0.032, 0.082, colors.cream, [0, 0.097, -0.172], [Math.PI / 2, 0, 0], 6);
      muzzle.set(0, 0.097, -0.22);
    }
    models.set(id, { group, muzzle });
  }

  const poolSize = 180;
  const particleGeometry = new THREE.IcosahedronGeometry(1, 0); geometries.add(particleGeometry);
  const particleMaterial = new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.45,flatShading:true,transparent:true,opacity:0.78,depthWrite:false}); ownMaterials.add(particleMaterial);
  const particles = new THREE.InstancedMesh(particleGeometry, particleMaterial, poolSize);
  particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage); particles.frustumCulled = false; scene.add(particles); roots.push(particles);
  const pool = Array.from({length:poolSize},()=>({life:0,max:1,size:0,position:new THREE.Vector3(),velocity:new THREE.Vector3(),vacuum:false}));
  const dummy = new THREE.Object3D();
  const temporaryColor = new THREE.Color();
  for(let i=0;i<poolSize;i++){dummy.scale.setScalar(0);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);particles.setColorAt(i,temporaryColor.set(colors.blue));}
  let poolCursor = 0, emission = 0;
  const nozzles = new THREE.Vector3(), vector = new THREE.Vector3();
  const normal = new THREE.Vector3(0,1,0);

  function stream(lineCount = 4) {
    const geometry = new THREE.BufferGeometry(); geometries.add(geometry);
    const positions = new Float32Array(lineCount * 6);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
    const material = new THREE.LineBasicMaterial({color:colors.blue,transparent:true,opacity:0.62,depthWrite:false}); ownMaterials.add(material);
    const lines = new THREE.LineSegments(geometry,material);lines.frustumCulled=false;lines.visible=false;scene.add(lines);roots.push(lines);
    return {lines,positions,lineCount};
  }
  const manualStream = stream(5);
  function drawStream(item, from, to, tool, time) {
    const color = tool === 'foam' ? colors.cream : tool === 'degreaser' ? 0xc8dcb7 : tool === 'paint' ? 0xd8a296 : colors.blue;
    item.lines.material.color.setHex(color);item.lines.visible=true;
    for(let i=0;i<item.lineCount;i++) {
      const j=i*6, spread=(i-(item.lineCount-1)/2)*0.009;
      item.positions[j]=from.x+spread*.22;item.positions[j+1]=from.y;item.positions[j+2]=from.z;
      item.positions[j+3]=to.x+spread+Math.sin(time*26+i)*0.007;
      item.positions[j+4]=to.y+Math.cos(time*23+i)*0.008;
      item.positions[j+5]=to.z+spread*.65;
    }
    item.lines.geometry.attributes.position.needsUpdate=true;
  }
  function emit(point, surfaceNormal, tool, count = 1) {
    if(!point)return;
    normal.copy(surfaceNormal || vector.set(0,1,0));
    if(normal.lengthSq()<0.01)normal.set(0,1,0);else normal.normalize();
    for(let n=0;n<count;n++) {
      const i=poolCursor++%poolSize,p=pool[i];
      p.max=p.life=tool==='foam'?0.8+Math.random()*.55:0.28+Math.random()*.4;
      p.size=tool==='foam'?.02+Math.random()*.025:tool==='polish'?.009+Math.random()*.01:.008+Math.random()*.017;
      p.position.copy(point).addScaledVector(normal,0.025).add(vector.set((Math.random()-.5)*.075,(Math.random()-.5)*.075,(Math.random()-.5)*.075));
      p.velocity.copy(normal).multiplyScalar(.12+Math.random()*.32).add(vector.set((Math.random()-.5)*.45,Math.random()*.35,(Math.random()-.5)*.45));
      p.vacuum=tool==='vacuum';
      const color=tool==='foam'?colors.cream:tool==='vacuum'||tool==='hand'?0xb7a685:tool==='polish'?0xf4e7b8:tool==='paint'?0xd6a092:tool==='degreaser'?0xc3d9a6:colors.blue;
      particles.setColorAt(i,temporaryColor.setHex(color));
    }
    if(particles.instanceColor)particles.instanceColor.needsUpdate=true;
  }

  const helpers = new Map();
  function createHelper(id) {
    const group=new THREE.Group();scene.add(group);roots.push(group);
    const nozzle=new THREE.Object3D();group.add(nozzle);
    if(id==='arch') {
      box(group,[.15,2.95,.18],colors.mint,[-1.55,1.475,0]);box(group,[.15,2.95,.18],colors.mint,[1.55,1.475,0]);
      box(group,[3.25,.19,.22],colors.cream,[0,2.93,0]);
      for(const x of [-1.05,-.53,0,.53,1.05])cylinder(group,.043,.057,.07,colors.blue,[x,2.80,0],[0,0,0]);
      for(const x of [-1.55,1.55]){box(group,[.35,.08,.45],colors.dark,[x,.04,0]);for(let y=.65;y<2.5;y+=.55)cylinder(group,.035,.035,.06,colors.brass,[x+(x<0?.09:-.09),y,0],[0,0,Math.PI/2]);}
      nozzle.position.set(0,2.76,0);group.position.z=-1.5;
    } else if(id==='autoFoam') {
      box(group,[.27,.09,.5],colors.dark,[-1.9,.045,0]);box(group,[.13,2.9,.13],colors.mint,[-1.9,1.45,0]);
      box(group,[2.1,.10,.10],colors.cream,[-.89,2.88,0]);cylinder(group,.11,.10,.23,colors.mint,[.1,2.73,0],[0,0,0]);
      cylinder(group,.06,.04,.08,colors.brass,[.1,2.56,0],[0,0,0]);nozzle.position.set(.1,2.5,0);group.position.z=.4;
      cylinder(group,.115,.13,.36,colors.cream,[-1.9,.32,0],[0,0,0]);
    } else {
      const assistant=id==='assistant';
      box(group,assistant?[.39,.32,.3]:[.42,.17,.34],colors.mint,[0,assistant?.32:.18,0]);
      for(const x of [-.23,.23])for(const z of [-.1,.1])cylinder(group,.084,.084,.05,colors.dark,[x,.085,z],[0,0,Math.PI/2]);
      if(assistant){
        box(group,[.34,.19,.27],colors.cream,[0,.59,0]);box(group,[.25,.075,.012],colors.dark,[0,.59,-.142]);
        for(const x of [-.06,.06])box(group,[.034,.018,.006],colors.blue,[x,.598,-.151]);
        ball(group,.042,colors.brass,[0,.765,0]);cylinder(group,.013,.013,.09,colors.dark,[0,.70,0],[0,0,0]);
        cylinder(group,.025,.035,.26,colors.cream,[.23,.40,-.08],[Math.PI/3,0,-.35]);
        cylinder(group,.027,.037,.12,colors.dark,[.25,.40,-.22]);nozzle.position.set(.25,.40,-.30);
        group.position.set(-2.0,0,1.6);
      }else{
        cylinder(group,.09,.105,.13,colors.cream,[0,.325,0],[0,0,0]);cylinder(group,.044,.034,.23,colors.dark,[0,.30,-.14]);
        cylinder(group,.09,.09,.05,colors.brown,[0,.30,-.275]);
        for(let i=0;i<8;i++){const angle=i*Math.PI/4;box(group,[.025,.025,.03],colors.cream,[Math.sin(angle)*.09,.30+Math.cos(angle)*.09,-.295]);}
        nozzle.position.set(0,.30,-.31);group.position.set(1.9,0,.8);
      }
    }
    group.visible=false;
    const helper={id,group,nozzle,stream:stream(2),destination:new THREE.Vector3(),lastActive:0};helpers.set(id,helper);return helper;
  }
  ['autoFoam','autoWheels','assistant','arch'].forEach(createHelper);

  function setTool(tool) {
    if(!models.has(tool))tool='water';
    if(tool===selected)return;
    models.get(selected).group.visible=false;selected=tool;models.get(selected).group.visible=true;sway=.025;
  }
  function clear() {
    for(const p of pool)p.life=0;
    for(let i=0;i<poolSize;i++){dummy.scale.setScalar(0);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);}
    particles.instanceMatrix.needsUpdate=true;manualStream.lines.visible=false;
    for(const helper of helpers.values())helper.stream.lines.visible=false;
    emission=0;
  }
  function update(dt, options = {}) {
    dt=Math.min(.08,Math.max(0,Number(dt)||0));localTime+=dt;
    const time=Number.isFinite(options.time)?options.time:localTime;
    if(options.tool)setTool(options.tool);
    const spraying=Boolean(options.spraying&&options.hit?.point);
    handRoot.visible=options.visible!==false;
    // Keep the tool inside a portrait camera's narrower horizontal field of view.
    handRoot.position.x=.3*Math.min(1,camera.aspect/1.45);
    handRoot.scale.setScalar(Math.min(1,Math.max(.62,camera.aspect/.9)));
    sway=Math.max(0,sway-dt*.12);
    handRoot.position.y=-.265-sway+(spraying?Math.sin(time*29)*.0018:Math.sin(time*1.8)*.0018);
    handRoot.rotation.z=-.03+(spraying&&['brush','sponge','polish'].includes(selected)?Math.sin(time*19)*.035:0);
    handRoot.updateWorldMatrix(true,true);
    nozzles.copy(models.get(selected).muzzle);models.get(selected).group.localToWorld(nozzles);
    manualStream.lines.visible=false;
    if(spraying) {
      if(['water','foam','degreaser','coat','paint'].includes(selected))drawStream(manualStream,nozzles,options.hit.point,selected,time);
      emission+=dt*(selected==='water'?85:selected==='foam'?43:27);
      const count=Math.min(10,Math.floor(emission));emission-=count;
      if(count)emit(options.hit.point,options.hit.normal,selected,count);
    }else emission=0;
    const active=new Map((options.automations||[]).map(item=>[item.id,item]));
    for(const helper of helpers.values()) {
      helper.group.visible=Number(options.upgrades?.[helper.id])>0;
      helper.stream.lines.visible=false;
      if(!helper.group.visible)continue;
      const action=active.get(helper.id);
      if(action) {
        helper.lastActive=time;
        const target=new THREE.Vector3(action.x,action.y,action.z);
        if(!Number.isFinite(target.x+target.y+target.z))continue;
        if(helper.id==='arch'||helper.id==='autoFoam')helper.group.position.z=THREE.MathUtils.lerp(helper.group.position.z,target.z,Math.min(1,dt*.9));
        else {
          const side=target.x>=0?1:-1;
          helper.destination.set(side*(helper.id==='assistant'?1.85:1.60),0,target.z+.26);
          helper.group.position.lerp(helper.destination,Math.min(1,dt*1.65));
          const angle=Math.atan2(helper.group.position.x-target.x,helper.group.position.z-target.z);
          helper.group.rotation.y=angle;
        }
        helper.group.updateWorldMatrix(true,true);helper.nozzle.getWorldPosition(vector);
        drawStream(helper.stream,vector,target,action.tool||'water',time);
        if(Math.random()<dt*22)emit(target,new THREE.Vector3(action.nx||0,action.ny||.5,action.nz||0),action.tool||'water',1);
      }
    }
    for(let i=0;i<poolSize;i++) {
      const p=pool[i];
      if(p.life>0) {
        p.life-=dt;
        if(p.vacuum) {vector.copy(nozzles).sub(p.position).multiplyScalar(dt*4);p.position.add(vector);}
        else {p.velocity.y-=dt*.9;p.position.addScaledVector(p.velocity,dt);}
        const fade=Math.min(1,Math.max(0,p.life)/.16);
        dummy.position.copy(p.position);dummy.rotation.set(i*.73+time*.5,i*.22,0);dummy.scale.setScalar(p.size*fade);
      }else dummy.scale.setScalar(0);
      dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);
    }
    particles.instanceMatrix.needsUpdate=true;
  }
  function dispose() {
    clear();for(const object of roots)object.removeFromParent();
    for(const geometry of geometries)geometry.dispose();for(const material of ownMaterials)material.dispose();
    particles.dispose();
  }
  return {setTool,update,clear,dispose};
}
