import * as THREE from './vendor/three.module.js';

// All dimensions are metres. Local +Z is the nose; local Y=0 is the floor.
// Each wash mesh owns a disjoint atlas rectangle in a 1000 × 620 texture.
const ATLAS_W=1000,ATLAS_H=620;
const COLORS={tire:'#303a38',rim:'#d3dad2',glass:'#91b6ba',trim:'#4c625b',chrome:'#cbd7c9'};
const MODELS={
 compact:{length:3.70,width:1.64,belt:.98,roof:1.47,rearBase:-1.30,rearTop:-.87,frontTop:.20,frontBase:.73,axle:1.12,radius:.31,roofWidth:.64},
 sedan:{length:4.48,width:1.79,belt:1.02,roof:1.48,rearBase:-1.36,rearTop:-.83,frontTop:.28,frontBase:.92,axle:1.40,radius:.33,roofWidth:.68},
 hatch:{length:3.86,width:1.74,belt:1.02,roof:1.58,rearBase:-1.66,rearTop:-1.19,frontTop:.34,frontBase:.92,axle:1.19,radius:.32,roofWidth:.69},
 wagon:{length:4.65,width:1.83,belt:1.05,roof:1.61,rearBase:-2.02,rearTop:-1.59,frontTop:.32,frontBase:.96,axle:1.44,radius:.34,roofWidth:.73,rail:true},
 coupe:{length:4.42,width:1.86,belt:.91,roof:1.29,rearBase:-1.49,rearTop:-.75,frontTop:.10,frontBase:.79,axle:1.36,radius:.33,roofWidth:.67,coupe:true},
 suv:{length:4.64,width:1.96,belt:1.19,roof:1.91,rearBase:-1.99,rearTop:-1.57,frontTop:.42,frontBase:1.04,axle:1.45,radius:.39,roofWidth:.80,rail:true,cladding:true},
 pickup:{length:4.84,width:1.90,belt:1.12,roof:1.76,rearBase:-.55,rearTop:-.40,frontTop:.49,frontBase:1.07,axle:1.55,radius:.37,roofWidth:.74,pickup:true,cladding:true},
 van:{length:4.58,width:1.92,belt:1.12,roof:2.04,rearBase:-2.11,rearTop:-2.02,frontTop:.61,frontBase:1.18,axle:1.39,radius:.35,roofWidth:.83,van:true}
};
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.48,metalness:.08,...extra});
const tint=(color,n)=>new THREE.Color(color).lerp(new THREE.Color(n<0?'#18352e':'#fff7df'),Math.abs(n));
function reverseGeometry(g){const idx=g.getIndex();if(idx){for(let i=0;i<idx.count;i+=3){const a=idx.getX(i);idx.setX(i,idx.getX(i+2));idx.setX(i+2,a);}}else{const p=g.getAttribute('position');for(let i=0;i<p.count;i+=3)for(let a=0;a<3;a++){const v=p.array[i*3+a];p.array[i*3+a]=p.array[(i+2)*3+a];p.array[(i+2)*3+a]=v;}}return g;}
function polygon(points,normal){
 const verts=points.map(p=>Array.isArray(p)?V(...p):p.clone());
 const n=new THREE.Vector3().crossVectors(verts[1].clone().sub(verts[0]),verts[2].clone().sub(verts[0])).normalize();
 if(normal&&n.dot(V(...normal))<0)verts.reverse();
 const positions=[],indices=[];verts.forEach(v=>positions.push(v.x,v.y,v.z));for(let i=1;i<verts.length-1;i++)indices.push(0,i,i+1);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function planarShape(points,holes,to3D,outward){
 const sh=new THREE.Shape();sh.moveTo(...points[0]);points.slice(1).forEach(p=>sh.lineTo(...p));sh.closePath();
 for(const hp of holes||[]){const hole=new THREE.Path();hole.moveTo(...hp[0]);hp.slice(1).forEach(p=>hole.lineTo(...p));hole.closePath();sh.holes.push(hole);}
 const g=new THREE.ShapeGeometry(sh,1),p=g.getAttribute('position');for(let i=0;i<p.count;i++){const v=to3D(p.getX(i),p.getY(i));p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();
 if(outward){const n=g.getAttribute('normal');if(V(n.getX(0),n.getY(0),n.getZ(0)).dot(V(...outward))<0){reverseGeometry(g);g.computeVertexNormals();}}
 return g;
}
function area(g){const p=g.getAttribute('position'),idx=g.getIndex();let total=0;for(let i=0;i<(idx?idx.count:p.count);i+=3){const a=idx?idx.getX(i):i,b=idx?idx.getX(i+1):i+1,c=idx?idx.getX(i+2):i+2;const av=V(p.getX(a),p.getY(a),p.getZ(a)),bv=V(p.getX(b),p.getY(b),p.getZ(b)),cv=V(p.getX(c),p.getY(c),p.getZ(c));total+=bv.sub(av).cross(cv.sub(av)).length()*.5;}return total;}
function builder(){
 const group=new THREE.Group(),surfaces=[];
 function surface(id,geometry,zone,color,axes='xy',extra={}){
   const index=surfaces.length;if(index>=64)throw new Error('Vehicle wash atlas exceeded 64 panels');
   const rect={x:(index%8)*125+2,y:Math.floor(index/8)*77.5+2,w:121,h:73.5};
   const p=geometry.getAttribute('position'),a='xyz'.indexOf(axes[0]),b='xyz'.indexOf(axes[1]);let minA=Infinity,maxA=-Infinity,minB=Infinity,maxB=-Infinity;
   for(let i=0;i<p.count;i++){const aa=p.array[i*3+a],bb=p.array[i*3+b];minA=Math.min(minA,aa);maxA=Math.max(maxA,aa);minB=Math.min(minB,bb);maxB=Math.max(maxB,bb);}
   const uv=[];for(let i=0;i<p.count;i++){const aa=(p.array[i*3+a]-minA)/Math.max(.00001,maxA-minA),bb=(p.array[i*3+b]-minB)/Math.max(.00001,maxB-minB);uv.push((rect.x+aa*rect.w)/ATLAS_W,1-(rect.y+(1-bb)*rect.h)/ATLAS_H);}
   geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();geometry.computeBoundingSphere();
   const mesh=new THREE.Mesh(geometry,material(color,extra));mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=id;mesh.userData={surfaceId:id,zone,rect};group.add(mesh);
   const item={id,mesh,zone,rect,area:area(geometry)};surfaces.push(item);return mesh;
 }
 function poly(id,points,zone,color,axes='xy',normal,extra){return surface(id,polygon(points,normal),zone,color,axes,extra);}
 function detail(geometry,color,pos,extra={}){const mesh=new THREE.Mesh(geometry,material(color,extra));if(pos)mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
 function box(color,x,y,z,w,h,d,extra={}){return detail(new THREE.BoxGeometry(w,h,d),color,[x,y,z],extra);}
 return {group,surfaces,surface,poly,detail,box};
}
function discGeometry(x,y,z,r,sign,inner=0,segments=16){
 const pos=[],index=[];
 if(inner===0){pos.push(x,y,z);for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;pos.push(x,y+Math.sin(a)*r,z+Math.cos(a)*r);}for(let i=0;i<segments;i++)index.push(0,i+1,i+2);}
 else{for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;pos.push(x,y+Math.sin(a)*r,z+Math.cos(a)*r,x,y+Math.sin(a)*inner,z+Math.cos(a)*inner);}for(let i=0;i<segments;i++){const k=i*2;index.push(k,k+2,k+1,k+1,k+2,k+3);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(index);g.computeVertexNormals();if(g.getAttribute('normal').getX(0)*sign<0){reverseGeometry(g);g.computeVertexNormals();}return g;
}
function plate(b,z,y,front=true){
 if(typeof document==='undefined')return;
 const canvas=document.createElement('canvas');canvas.width=384;canvas.height=112;const c=canvas.getContext('2d');c.fillStyle='#f7f2dd';c.fillRect(0,0,384,112);c.strokeStyle='#93a78e';c.lineWidth=9;c.strokeRect(4,4,376,104);c.fillStyle='#4b725c';c.font='bold 63px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('ПЕНА',192,60);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.45,.132),material('#fff',{map:tex,roughness:.75,metalness:0}));mesh.position.set(0,y,z);if(!front)mesh.rotation.y=Math.PI;b.group.add(mesh);
}
export function createVehicle(carId='compact',color='#dd8c76',rimsStyle=0){
 const c=MODELS[carId]||MODELS.compact,b=builder(),hw=c.width/2,hl=c.length/2,wy=c.radius+.018,arch=c.radius+.073,sideTop=c.belt-.055,bottom=.41+(c.radius-.31)*.55,topW=hw-.10;
 const wheelCenters=[];
 const lower=(z)=>{let y=bottom;for(const wz of[-c.axle,c.axle]){const dz=z-wz;if(Math.abs(dz)<arch)y=Math.max(y,wy+Math.sqrt(arch*arch-dz*dz));}return y;};
 const zBack=-hl+.12,zFront=hl-.13;
 // Six separate side panels follow the wheel arches; there is no hidden dirt behind tires.
 for(const side of[-1,1]){
  const bounds=[zBack,-c.axle+.46,c.axle-.46,zFront];
  for(let j=0;j<3;j++){
   const lo=bounds[j],hi=bounds[j+1],outline=[[lo,sideTop],[hi,sideTop]];
   const steps=Math.ceil((hi-lo)/.038);for(let k=steps;k>=0;k--){const z=lo+(hi-lo)*k/steps;outline.push([z,lower(z)]);}
   const geo=planarShape(outline,[],(z,y)=>V(side*hw,y,z),[side,0,0]);b.surface(`body-side-${side}-${j}`,geo,'body',color,'zy');
  }
  b.poly(`shoulder-${side}`,[[side*hw,sideTop,zBack],[side*hw,sideTop,zFront],[side*topW,c.belt,zFront],[side*topW,c.belt,zBack]],'body',tint(color,.08),'zy',[side,.4,0]);
  // Front and rear chamfers keep the simple body from feeling like a box.
  for(const end of[-1,1]){
   const zs=end>0?zFront:zBack,ze=end*hl,xe=hw-.10;
   b.poly(`corner-${side}-${end}`,[[side*hw,bottom,zs],[side*hw,sideTop,zs],[side*xe,c.belt-.12,ze],[side*xe,bottom+.03,ze]],'body',color,'zy',[side,0,end]);
   b.poly(`corner-cap-${side}-${end}`,[[side*hw,sideTop,zs],[side*xe,c.belt-.12,ze],[side*topW,c.belt,zs]],'body',tint(color,.09),'xz',[side,1,end]);
  }
 }
 for(const end of[-1,1]){
  const z=end*hl,yTop=c.belt-.12;
  b.poly(`bumper-face-${end}`,[[-hw+.10,bottom+.03,z],[hw-.10,bottom+.03,z],[hw-.10,yTop,z],[-hw+.10,yTop,z]],'body',tint(color,-.025),'xy',[0,0,end]);
  const innerZ=end>0?zFront:zBack;
  b.poly(`end-top-bevel-${end}`,[[-hw+.10,yTop,z],[hw-.10,yTop,z],[topW,c.belt,innerZ],[-topW,c.belt,innerZ]],'body',tint(color,.10),'xz',[0,1,end]);
 }
 // A low black undertray is decoration, never included in washable geometry.
 b.box('#33413a',0,bottom-.035,0,c.width-.16,.07,c.length-.25);
 b.poly('hood',[[-topW,c.belt,c.frontBase],[topW,c.belt,c.frontBase],[topW,c.belt,zFront],[-topW,c.belt,zFront]],'body',tint(color,.11),'xz',[0,1,0]);
 if(!c.pickup){b.poly('trunk',[[-topW,c.belt,zBack],[topW,c.belt,zBack],[topW,c.belt,c.rearBase],[-topW,c.belt,c.rearBase]],'body',tint(color,.08),'xz',[0,1,0]);}
 else{
  // The pickup has a genuine recessed open bed, including washable inner walls.
  const bedRear=zBack+.035,bedFront=c.rearBase-.055,innerW=hw-.18,bedY=c.belt-.34;
  b.poly('bed-floor',[[-innerW,bedY,bedRear],[innerW,bedY,bedRear],[innerW,bedY,bedFront],[-innerW,bedY,bedFront]],'body',tint(color,-.09),'xz',[0,1,0]);
  for(const side of[-1,1]){
   b.poly(`bed-inner-${side}`,[[side*innerW,bedY,bedRear],[side*innerW,bedY,bedFront],[side*innerW,c.belt,bedFront],[side*innerW,c.belt,bedRear]],'body',tint(color,-.1),'zy',[-side,0,0]);
   b.poly(`bed-rail-${side}`,[[side*innerW,c.belt,bedRear],[side*topW,c.belt,bedRear],[side*topW,c.belt,bedFront],[side*innerW,c.belt,bedFront]],'body',tint(color,.15),'xz',[0,1,0]);
  }
  for(const [id,z,nz]of[['tail',bedRear,1],['cab',bedFront,-1]])b.poly(`bed-${id}`,[[-innerW,bedY,z],[innerW,bedY,z],[innerW,c.belt,z],[-innerW,c.belt,z]],'body',tint(color,-.04),'xy',[0,0,nz]);
  for(let z=bedRear+.13;z<bedFront;z+=.21)b.box(tint(color,.1),0,bedY+.007,z,innerW*1.88,.015,.013);
 }
 const sideX=y=>topW-(topW-c.roofWidth)*(y-c.belt)/(c.roof-c.belt);
 const split=c.pickup?(c.rearTop+.14):c.coupe?-.34:Math.max(c.rearTop+.34,-.45);
 const cabinOutline=[[c.rearBase,c.belt],[c.frontBase,c.belt],[c.frontTop,c.roof],[c.rearTop,c.roof]];
 const windowBottom=c.belt+.071,windowTop=c.roof-.070;
 const zRearAt=y=>c.rearBase+(c.rearTop-c.rearBase)*(y-c.belt)/(c.roof-c.belt);
 const zFrontAt=y=>c.frontBase+(c.frontTop-c.frontBase)*(y-c.belt)/(c.roof-c.belt);
 const windows=[];
 if(!c.van){
  if(c.pickup){windows.push([[c.rearBase+.07,windowBottom],[zFrontAt(windowBottom)-.07,windowBottom],[zFrontAt(windowTop)-.07,windowTop],[zRearAt(windowTop)+.065,windowTop]]);}
  else {
   windows.push([[zRearAt(windowBottom)+.07,windowBottom],[split-.035,windowBottom],[split-.035,windowTop],[zRearAt(windowTop)+.065,windowTop]]);
   windows.push([[split+.035,windowBottom],[zFrontAt(windowBottom)-.075,windowBottom],[zFrontAt(windowTop)-.065,windowTop],[split+.035,windowTop]]);
  }
 }else{windows.push([[-.10,windowBottom],[zFrontAt(windowBottom)-.075,windowBottom],[zFrontAt(windowTop)-.06,windowTop],[-.10,windowTop]]);}
 for(const side of[-1,1]){
  const map=(z,y)=>V(side*sideX(y),y,z);
  const frame=planarShape(cabinOutline,windows,map,[side,.2,0]);b.surface(`cabin-frame-${side}`,frame,'body',tint(color,.04),'zy');
  windows.forEach((win,i)=>{
   const points=win.map(([z,y])=>[side*(sideX(y)+.001),y,z]);b.poly(`side-window-${side}-${i}`,points,'glass',COLORS.glass,'zy',[side,.2,0],{roughness:.22,metalness:.10});
  });
 }
 // Roof is a shallow three-facet cap: a broad central panel and gentle bevels.
 const crown=.045,roofEdge=c.roofWidth,flatW=roofEdge-.085;
 b.poly('roof',[[-flatW,c.roof+crown,c.rearTop+.035],[flatW,c.roof+crown,c.rearTop+.035],[flatW,c.roof+crown,c.frontTop-.035],[-flatW,c.roof+crown,c.frontTop-.035]],'body',tint(color,.18),'xz',[0,1,0]);
 for(const side of[-1,1])b.poly(`roof-edge-${side}`,[[side*roofEdge,c.roof,c.rearTop],[side*roofEdge,c.roof,c.frontTop],[side*flatW,c.roof+crown,c.frontTop-.035],[side*flatW,c.roof+crown,c.rearTop+.035]],'body',tint(color,.13),'xz',[side,1,0]);
 // Windshield and rear glass are independent planar faces with painted frames.
 for(const end of[-1,1]){
  const lowerZ=end>0?c.frontBase:c.rearBase,upperZ=end>0?c.frontTop:c.rearTop;
  const widthAt=y=>topW-(topW-roofEdge)*(y-c.belt)/(c.roof-c.belt),zAt=y=>lowerZ+(upperZ-lowerZ)*(y-c.belt)/(c.roof-c.belt);
  const outer=[[-topW,c.belt],[topW,c.belt],[roofEdge,c.roof],[-roofEdge,c.roof]];
  const glass=[[-widthAt(windowBottom)+.066,windowBottom],[widthAt(windowBottom)-.066,windowBottom],[widthAt(windowTop)-.066,windowTop],[-widthAt(windowTop)+.066,windowTop]];
  const noRearGlass=c.van&&end<0;
  b.surface(`window-frame-${end}`,planarShape(outer,noRearGlass?[]:[glass],(x,y)=>V(x,y,zAt(y)),[0,.35,end]),'body',tint(color,.08),'xy');
  if(!noRearGlass)b.poly(`windshield-${end}`,glass.map(([x,y])=>[x,y,zAt(y)+end*.001]),'glass',end>0?'#91b8bf':'#8aa9aa','xy',[0,.35,end],{roughness:.2,metalness:.12});
  // Small upper bevel joins the glass frame to the roof crown.
  b.poly(`roof-lip-${end}`,[[-roofEdge,c.roof,upperZ],[roofEdge,c.roof,upperZ],[flatW,c.roof+crown,upperZ-end*.035],[-flatW,c.roof+crown,upperZ-end*.035]],'body',tint(color,.15),'xz',[0,1,end]);
 }
 // Four real tires: 16-sided cylinders, separate washable sidewalls and rims.
 for(const side of[-1,1])for(const wz of[-c.axle,c.axle]){
  const wheelX=side*(hw-.018),outerX=side*(hw+.095),depth=.23,r=c.radius;
  wheelCenters.push(V(wheelX,wy,wz));
  const tire=b.detail(new THREE.CylinderGeometry(r,r,depth,16,1,true),COLORS.tire,[wheelX,wy,wz],{roughness:.92,metalness:0});tire.rotation.z=Math.PI/2;
  b.surface(`tire-${side}-${wz}`,discGeometry(outerX,wy,wz,r,side,r*.64,16),'wheels',COLORS.tire,'zy',{roughness:.9,metalness:0});
  // The inward facing dark discs are intentionally not a task surface.
  const inCap=b.detail(new THREE.CircleGeometry(r,16),COLORS.tire,[side*(hw-.133),wy,wz],{roughness:.95});inCap.rotation.y=side>0?-Math.PI/2:Math.PI/2;
  const rimColor=rimsStyle===2?'#d4b577':rimsStyle===1?'#dce4dc':COLORS.rim;
  const rimX=outerX+side*.003;b.surface(`rim-${side}-${wz}`,discGeometry(rimX,wy,wz,r*.63,side,0,rimsStyle===1?12:16),'rims',rimColor,'zy',{roughness:.30,metalness:.5});
  const rimDepth=outerX+side*.006;
  for(let i=0;i<(rimsStyle===1?7:rimsStyle===2?10:5);i++){
   const count=rimsStyle===1?7:rimsStyle===2?10:5,a=i*Math.PI*2/count;
   const spoke=b.box(rimsStyle===2?'#8f805f':'#758c82',rimDepth,wy+Math.sin(a)*r*.37,wz+Math.cos(a)*r*.37,.007,r*.15,r*.17,{roughness:.4,metalness:.25});spoke.rotation.x=-a;
  }
  const cap=b.detail(new THREE.CylinderGeometry(r*.15,r*.15,.014,12),rimsStyle===2?'#e2c68d':'#ecede0',[outerX+side*.012,wy,wz],{roughness:.28,metalness:.6});cap.rotation.z=Math.PI/2;
  // A segmented arch lip adds volume without covering the washable body.
  const archMat=c.cladding?'#465850':tint(color,-.1);const pts=[];for(let i=0;i<=12;i++){const a=.12+(Math.PI-.24)*i/12;pts.push(V(side*(hw+.008),wy+Math.sin(a)*(arch+.01),wz+Math.cos(a)*(arch+.01)));}
  const curve=new THREE.CatmullRomCurve3(pts);b.detail(new THREE.TubeGeometry(curve,12,c.cladding?.025:.012,4,false),archMat,null,{roughness:.65});
 }
 // Door seams are subtle shallow grooves. They do not create fictitious task panels.
 for(const side of[-1,1]){
  const seamColor=tint(color,-.16),doorZ=c.pickup?c.rearBase+.015:split;
  const lineGeometry=new THREE.BufferGeometry().setFromPoints([V(side*(hw+.002),sideTop-.018,doorZ),V(side*(hw+.002),bottom+.06,doorZ),V(side*(hw+.002),bottom+.06,c.axle-.44)]);
  const seam=new THREE.Line(lineGeometry,new THREE.LineBasicMaterial({color:seamColor}));b.group.add(seam);
  b.box(COLORS.chrome,side*(hw+.013),sideTop-.095,c.pickup?c.rearBase+.20:split+.19,.028,.036,.15,{metalness:.65,roughness:.32});
  if(!c.coupe&&!c.pickup&&!c.van)b.box(COLORS.chrome,side*(hw+.013),sideTop-.095,split-.24,.028,.036,.14,{metalness:.65,roughness:.32});
  const mx=side*(hw+.14),my=c.belt+.13,mz=c.frontBase-.14;
  b.box(COLORS.trim,side*(hw+.038),my-.03,mz,.10,.035,.03);
  const mirror=b.box(color,mx,my,mz,.20,.115,.12,{roughness:.38});
  // The rear-facing reflective lens makes mirrors readable from the driver's side.
  b.poly(`mirror-${side}`,[[mx-.075,my-.037,mz-.061],[mx+.075,my-.037,mz-.061],[mx+.075,my+.038,mz-.061],[mx-.075,my+.038,mz-.061]],'glass','#b7d4ce','xy',[0,0,-1],{roughness:.18,metalness:.3});
  if(c.cladding)b.box('#465850',side*(hw+.005),bottom+.006,0,.024,.075,Math.max(.8,c.axle*2-.94));
 }
 // Rounded lamps for the tiny classic; rectangular lights for bigger silhouettes.
 for(const side of[-1,1]){
  if(carId==='compact'){
   const ring=b.detail(new THREE.CylinderGeometry(.112,.112,.031,12),COLORS.chrome,[side*(hw-.24),c.belt-.265,hl+.014],{metalness:.45});ring.rotation.x=Math.PI/2;
   const lens=b.detail(new THREE.CylinderGeometry(.087,.087,.037,12),'#fff3cd',[side*(hw-.24),c.belt-.265,hl+.025],{roughness:.2,emissive:'#f5dca0',emissiveIntensity:.17});lens.rotation.x=Math.PI/2;
  }else{
   b.box(COLORS.chrome,side*(hw-.25),c.belt-.238,hl+.012,.32,.15,.033,{metalness:.45});
   b.box('#fff1c8',side*(hw-.25),c.belt-.236,hl+.031,.286,.12,.022,{emissive:'#f3d394',emissiveIntensity:.13,roughness:.24});
  }
  b.box('#b95e4f',side*(hw-.20),c.belt-.245,-hl-.013,.17,.17,.032,{roughness:.35,emissive:'#652619',emissiveIntensity:.07});
  b.box('#f0c286',side*(hw-.20),c.belt-.205,-hl-.032,.15,.05,.017,{roughness:.35});
 }
 b.box('#3e5047',0,c.belt-.27,hl+.015,carId==='compact'?.66:.79,.135,.024,{roughness:.65});
 for(let i=0;i<3;i++)b.box('#91a897',0,c.belt-.318+i*.043,hl+.033,carId==='compact'?.62:.74,.009,.012,{metalness:.5,roughness:.38});
 b.box(COLORS.chrome,0,bottom+.025,hl+.013,c.width-.28,.047,.049,{metalness:.55,roughness:.35});
 b.box(COLORS.chrome,0,bottom+.025,-hl-.013,c.width-.28,.047,.049,{metalness:.55,roughness:.35});
 plate(b,hl+.043,bottom+.138,true);plate(b,-hl-.038,bottom+.137,false);
 // Wipers rest along the lower edge of the actual windshield.
 for(const x of[-.32,.21]){const points=[V(x,c.belt+.087,c.frontBase-.04),V(x+.24,c.belt+.106,c.frontBase-.061)];b.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#49615a'})));}
 if(c.rail){for(const side of[-1,1]){b.box('#697d72',side*(c.roofWidth-.10),c.roof+.094,(c.frontTop+c.rearTop)/2,.037,.036,c.frontTop-c.rearTop-.19,{metalness:.4});for(const z of[c.rearTop+.16,c.frontTop-.16])b.box('#70877b',side*(c.roofWidth-.10),c.roof+.06,z,.047,.065,.069);}}
 if(c.van){
  // Cargo door hinges and sliding rail distinguish the van from the tall wagon.
  for(const side of[-1,1]){b.box(tint(color,-.09),side*(hw-.045),c.belt+.20,-1.05,.032,.022,1.57);b.box(COLORS.chrome,side*(hw-.025),c.belt+.15,-.52,.028,.052,.19,{metalness:.45});}
  b.box('#a2b4a6',0,1.49,-hl-.020,.022,.87,.018);b.box(COLORS.chrome,.10,1.24,-hl-.036,.06,.16,.025);
 }
 b.group.name=`vehicle-${carId}`;b.group.userData={carId,color,rimsStyle};
 return {group:b.group,surfaces:b.surfaces,dimensions:{width:c.width+.30,height:c.roof+.12,length:c.length+.10,x:c.width+.30,y:c.roof+.12,z:c.length+.10},wheelCenters,atlas:{width:ATLAS_W,height:ATLAS_H}};
}

export function createInteriorVehicle(carId='compact'){
 const c=MODELS[carId]||MODELS.compact,b=builder(),width=c.width-.21,length=Math.min(c.length-.38,3.64),hw=width/2,front=length/2,rear=-length/2;
 const leather='#cfc0a0',edge='#aa9c7d',mat='#607864',dash='#829b82';
 // An open roofless cabin presents tangible seats, deep footwells and a console.
 b.box('#7c947c',0,.15,0,width+.14,.22,length+.14,{roughness:.8});
 b.box('#abc0a6',-hw-.05,.43,0,.11,.41,length);b.box('#abc0a6',hw+.05,.43,0,.11,.41,length);
 b.box('#abc0a6',0,.43,rear-.035,width,.41,.11);
 for(const side of[-1,1]){
  b.box('#d0d9bd',side*(hw-.012),.61,.26,.027,.035,.41);
  b.box('#637f63',side*(hw-.009),.54,.26,.028,.075,.28);
 }
 function panelBox(id,x,y,z,w,h,d,zone,col,top=true){
  const a=x-w/2,A=x+w/2,bot=y-h/2,t=y+h/2,back=z-d/2,f=z+d/2;
  if(top)b.poly(`${id}-top`,[[a,t,back],[A,t,back],[A,t,f],[a,t,f]],zone,tint(col,.05),'xz',[0,1,0],{roughness:.85,metalness:0});
  for(const side of[-1,1])b.poly(`${id}-side-${side}`,[[side>0?A:a,bot,back],[side>0?A:a,bot,f],[side>0?A:a,t,f],[side>0?A:a,t,back]],zone,tint(col,-.04),'zy',[side,0,0],{roughness:.88,metalness:0});
  for(const end of[-1,1])b.poly(`${id}-end-${end}`,[[a,bot,end>0?f:back],[A,bot,end>0?f:back],[A,t,end>0?f:back],[a,t,end>0?f:back]],zone,col,'xy',[0,0,end],{roughness:.88,metalness:0});
 }
 for(const side of[-1,1]){
  const x=side*width*.26;
  // Mats sit in front of, and beneath, the front seats.
  b.poly(`mat-front-${side}`,[[x-.26,.279,.30],[x+.26,.279,.30],[x+.26,.279,front-.15],[x-.26,.279,front-.15]],'mats',mat,'xz',[0,1,0],{roughness:1,metalness:0});
  b.poly(`mat-rear-${side}`,[[x-.26,.279,rear+.25],[x+.26,.279,rear+.25],[x+.26,.279,-.52],[x-.26,.279,-.52]],'mats',mat,'xz',[0,1,0],{roughness:1,metalness:0});
  panelBox(`seat-${side}`,x,.48,-.07,.56,.19,.62,'seats',leather);
  panelBox(`seatback-${side}`,x,.82,-.34,.55,.61,.14,'seats',leather);
  const head=b.box('#d6c8a7',x,1.19,-.35,.31,.20,.14,{roughness:.8,metalness:0});
  b.box(edge,x,1.04,-.35,.025,.13,.018);b.box('#b7785e',x-side*.32,.46,-.22,.048,.085,.043);
  // Seat seams and inset ribs are low-contrast decoration above the leather.
  for(const z of[-.23,-.09,.05,.19])b.box('#c1b18e',x,.578,z,.39,.003,.012,{roughness:1,metalness:0});
 }
 panelBox('rear-bench',0,.45,rear+.35,width-.12,.18,.55,'seats',leather);
 // The rear backrest faces forward and exposes only its useful washable face and top.
 b.poly('rear-backrest',[[-hw+.07,.48,rear+.07],[hw-.07,.48,rear+.07],[hw-.07,.93,rear+.07],[-hw+.07,.93,rear+.07]],'seats',leather,'xy',[0,0,1],{roughness:.86,metalness:0});
 b.poly('rear-backrest-top',[[-hw+.07,.93,rear-.015],[hw-.07,.93,rear-.015],[hw-.07,.93,rear+.075],[-hw+.07,.93,rear+.075]],'seats',tint(leather,.05),'xz',[0,1,0],{roughness:.86,metalness:0});
 for(const x of[-width*.28,width*.28])b.box('#d6c8a7',x,1.01,rear+.03,.30,.16,.13,{roughness:.8,metalness:0});
 // Sloped dashboard and a reachable centre console.
 b.poly('dashboard-top',[[-hw,.85,front-.33],[hw,.85,front-.33],[hw,.96,front-.03],[-hw,.96,front-.03]],'dash',dash,'xz',[0,1,0],{roughness:.7,metalness:0});
 b.poly('dashboard-front',[[-hw,.53,front-.33],[hw,.53,front-.33],[hw,.85,front-.33],[-hw,.85,front-.33]],'dash',tint(dash,-.04),'xy',[0,0,-1],{roughness:.72,metalness:0});
 b.poly('console-top',[[-.12,.49,-.42],[.12,.49,-.42],[.12,.58,front-.33],[-.12,.58,front-.33]],'dash',tint(dash,-.08),'xz',[0,1,0],{roughness:.72,metalness:0});
 b.box('#58705b',0,.76,front-.348,.29,.14,.018);b.box('#adcab7',0,.768,front-.360,.22,.083,.010,{roughness:.4});
 for(const x of[-.081,0,.081]){const dial=b.detail(new THREE.CylinderGeometry(.018,.018,.012,10),'#d4dbbb',[x,.658,front-.355]);dial.rotation.x=Math.PI/2;}
 b.box('#57735b',0,.614,.45,.045,.17,.043);b.detail(new THREE.SphereGeometry(.044,8,5),'#c5d3b4',[0,.71,.45]);
 // Steering wheel tilted towards the driver, with a hub and three real spokes.
 const steer=new THREE.Group();steer.position.set(-width*.26,.93,front-.48);steer.rotation.x=.30;
 const torus=new THREE.Mesh(new THREE.TorusGeometry(.205,.023,6,16),material('#5e7862',{roughness:.65}));steer.add(torus);
 const hub=new THREE.Mesh(new THREE.CylinderGeometry(.068,.068,.049,10),material('#a4b997'));hub.rotation.x=Math.PI/2;steer.add(hub);
 for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const spoke=new THREE.Mesh(new THREE.BoxGeometry(.025,.18,.023),material('#91a687'));spoke.position.set(Math.sin(a)*.11,Math.cos(a)*.11,0);spoke.rotation.z=-a;steer.add(spoke);}b.group.add(steer);
 b.group.name=`interior-${carId}`;
 // Rear bench backing meets the cabin wall; it stays geometry, never a washing target.
 const reachableSurfaces=b.surfaces.filter(surface=>surface.id!=='rear-bench-end--1');
 return {group:b.group,surfaces:reachableSurfaces,dimensions:{width:width+.24,height:1.32,length:length+.18,x:width+.24,y:1.32,z:length+.18},wheelCenters:[],atlas:{width:ATLAS_W,height:ATLAS_H}};
}
