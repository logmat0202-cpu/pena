import * as THREE from './vendor/three.module.js';
export function createPainter(vehicle){
 const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=620;const ctx=canvas.getContext('2d');
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.anisotropy=4;
 for(const s of vehicle.surfaces){const m=s.mesh.material;m.map=texture;m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP\nvec4 dirtColor=texture2D(map,vMapUv);\ndiffuseColor.rgb=mix(diffuseColor.rgb,dirtColor.rgb,dirtColor.a);\n#endif`);};m.customProgramCacheKey=()=> 'pena-spatial-dirt-v3';m.needsUpdate=true;}
 function draw(base=[],extras={},options={}){
  ctx.clearRect(0,0,1000,620);
  const groups=new Map(vehicle.surfaces.map(s=>[s.id,[]]));
  for(const p of base)groups.get(p.surfaceId)?.push(p);
  for(const points of Object.values(extras))for(const p of points)groups.get(p.surfaceId)?.push(p);
  for(const s of vehicle.surfaces){const list=groups.get(s.id);if(!list?.length)continue;ctx.save();ctx.beginPath();ctx.rect(s.rect.x,s.rect.y,s.rect.w,s.rect.h);ctx.clip();
   for(const p of list){let a=Math.min(1,p.amount/(p.initial||1)),r=p.radius;const service=['paint','coat','polish','rims'].includes(p.type);if(a<=0&&p.foam<.01&&!['paint','coat'].includes(p.type))continue;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.id*2.399);
    if(p.type==='paint'){ctx.globalAlpha=(1-a)*.96;ctx.fillStyle=options.paintColor||'#dd8c76';ctx.beginPath();ctx.ellipse(0,0,r*1.4,r*1.2,0,0,7);ctx.fill();}
    else if(p.type==='coat'){ctx.globalAlpha=(1-a)*.13;ctx.fillStyle='#d6f4f9';ctx.beginPath();ctx.ellipse(0,0,r,r*.8,0,0,7);ctx.fill();if(a>.02){ctx.globalAlpha=a*.15;ctx.strokeStyle='#a9d8ec';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(0,0,r*.45,0,Math.PI*1.2);ctx.stroke();}}
    else if(p.type==='polish'){ctx.globalAlpha=a*.6;ctx.strokeStyle='#ddd7bd';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-r*.6,0);ctx.lineTo(r*.5,r*.15);ctx.stroke();}
    else if(p.type==='rims'){ctx.globalAlpha=a*.22;ctx.fillStyle='#c7af80';ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();}
    else if(p.type==='trash'){ctx.globalAlpha=a*.95;ctx.fillStyle=p.id%2?'#d3c098':'#f2e4c2';ctx.fillRect(-r*.6,-r*.5,r,r*.85);ctx.strokeStyle='#a99a76';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(-r*.4,0);ctx.lineTo(r*.2,r*.2);ctx.stroke();}
    else if(p.type==='crumbs'){ctx.globalAlpha=a*.85;ctx.fillStyle=p.id%2?'#ae9169':'#e1cfa0';ctx.beginPath();ctx.ellipse(0,0,Math.max(1,r*.18),Math.max(.7,r*.12),0,0,7);ctx.fill();}
    else if(p.type==='bugs'){ctx.globalAlpha=a*.82;ctx.fillStyle='#686440';ctx.beginPath();ctx.ellipse(0,0,r*.4,r*.18,0,0,7);ctx.fill();ctx.fillRect(-r*.1,r*.1,r*.17,r*.16);}
    else if(p.type==='oil'){ctx.globalAlpha=a*.60;ctx.fillStyle='#555d54';ctx.beginPath();ctx.ellipse(0,0,r,r*.7,0,0,7);ctx.fill();ctx.globalAlpha=a*.25;ctx.fillStyle='#5e778c';ctx.beginPath();ctx.ellipse(r*.3,0,r*.5,r*.36,0,0,7);ctx.fill();}
    else{const mud=p.type==='mud'||p.type==='stain';ctx.globalAlpha=a*(mud?.50:p.type==='wheel'?.53:.30);ctx.fillStyle=p.foam>.18?'#b2a48a':mud?'#95805e':p.type==='wheel'?'#8c7a5a':'#b5a47e';ctx.beginPath();ctx.ellipse(0,0,r,r*.79,0,0,7);ctx.fill();ctx.globalAlpha=a*(mud?.13:.07);ctx.fillStyle='#675e49';ctx.beginPath();ctx.ellipse(r*.28,-r*.2,r*.47,r*.36,0,0,7);ctx.fill();}
    if(!service&&p.foam>.015){ctx.globalAlpha=Math.min(.95,p.foam*.9);ctx.fillStyle='#f9fff1';ctx.beginPath();ctx.arc(0,0,r*.78,0,7);ctx.arc(r*.48,-r*.2,r*.43,0,7);ctx.arc(-r*.3,r*.4,r*.45,0,7);ctx.fill();ctx.globalAlpha=p.foam*.5;ctx.strokeStyle='#d5e8df';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(r*.2,-r*.15,Math.max(1.2,r*.21),0,7);ctx.stroke();}
    ctx.restore();
   }ctx.restore();
  }
  texture.needsUpdate=true;
 }
 return {canvas,texture,draw,dispose(){texture.dispose();}};
}
