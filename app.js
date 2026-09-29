
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

const C={
  ivory:0xf4eee3, ivory2:0xe5dacb, obsidian:0x17181b,
  charcoal:0x24262a, gold:0xc9a15a, bronze:0x8f653a,
  light:0xffd59a, glass:0x9eb2bb
};

// Exact working coordinates derived from the uploaded 24-9-2026 OBJ.
// The complete scan is larger; this box tracks the principal retail volume visible in the supplied plan/photos.
const STORE={
  x0:-7.15, x1:7.18,
  z0:-9.72, z1:3.18,
  floor:-1.30,
  ceiling:1.10
};
const CX=(STORE.x0+STORE.x1)/2;
const CZ=(STORE.z0+STORE.z1)/2;
const W=STORE.x1-STORE.x0;
const D=STORE.z1-STORE.z0;
const H=STORE.ceiling-STORE.floor;

const canvas=document.getElementById('scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.localClippingEnabled=true;

// Open-roof clipping plane: removes scan geometry above the interior ceiling line.
const roofClipPlane=new THREE.Plane(new THREE.Vector3(0,-1,0),STORE.ceiling-.08);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0b0d10);
scene.fog=new THREE.Fog(0x0b0d10,25,50);

const camera=new THREE.PerspectiveCamera(47,1,.02,120);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.065;
controls.maxPolarAngle=Math.PI*.495;

const scanRoot=new THREE.Group();
const floorRoot=new THREE.Group();
const wallRoot=new THREE.Group();
const ceilingRoot=new THREE.Group();
const lightRoot=new THREE.Group();
const brandRoot=new THREE.Group();
const glassRoot=new THREE.Group();
const markerRoot=new THREE.Group();
const existingRoot=new THREE.Group();
existingRoot.name='existing-building-layout';
const furnitureRoot=new THREE.Group();
furnitureRoot.name='furniture-layout';
scene.add(scanRoot,floorRoot,wallRoot,existingRoot,furnitureRoot,ceilingRoot,lightRoot,brandRoot,glassRoot,markerRoot);

scene.add(new THREE.HemisphereLight(0xffead0,0x11151a,1.2));
const key=new THREE.DirectionalLight(0xffe0aa,1.2);key.position.set(-8,12,-4);scene.add(key);

function mat(color,rough=.55,metal=.02,extra={}){
  return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,...extra});
}
function box(parent,w,h,d,x,y,z,m){
  const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
  q.position.set(x,y,z);q.castShadow=true;q.receiveShadow=true;parent.add(q);return q;
}
function plane(parent,w,h,x,y,z,ry,m){
  const q=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);
  q.position.set(x,y,z);q.rotation.y=ry;parent.add(q);return q;
}
function emissive(parent,w,h,d,x,y,z,color=C.light,intensity=4){
  return box(parent,w,h,d,x,y,z,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.4}));
}
function canvasTexture(draw,w=1024,h=1024){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d');draw(g,w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;
}
function makeTile(){
  const t=canvasTexture((g,w,h)=>{
    g.fillStyle='#eee5d7';g.fillRect(0,0,w,h);
    const s=w/5;g.strokeStyle='rgba(100,90,80,.22)';g.lineWidth=3;
    for(let i=0;i<=5;i++){g.beginPath();g.moveTo(i*s,0);g.lineTo(i*s,h);g.stroke();g.beginPath();g.moveTo(0,i*s);g.lineTo(w,i*s);g.stroke()}
    for(let i=0;i<90;i++){g.strokeStyle=`rgba(104,91,73,${.012+Math.random()*.025})`;g.beginPath();const y=Math.random()*h;g.moveTo(0,y);g.bezierCurveTo(w*.3,y+Math.random()*18,w*.65,y-Math.random()*18,w,y+Math.random()*8);g.stroke()}
  });t.repeat.set(W/3,D/3);return t;
}
function makeStone(){
  const t=canvasTexture((g,w,h)=>{
    g.fillStyle='#141517';g.fillRect(0,0,w,h);
    for(let i=0;i<28;i++){g.strokeStyle=`rgba(198,174,139,${.015+Math.random()*.025})`;g.lineWidth=1+Math.random();g.beginPath();let y=Math.random()*h;g.moveTo(0,y);for(let x=0;x<w;x+=80){y+=(Math.random()-.5)*34;g.lineTo(x,y)}g.stroke()}
  });t.repeat.set(2,2);return t;
}
function makeCeiling(){
  const t=canvasTexture((g,w,h)=>{
    g.fillStyle='#1d1e22';g.fillRect(0,0,w,h);g.strokeStyle='rgba(210,210,210,.13)';g.lineWidth=3;
    const c=w/6;for(let i=0;i<=6;i++){g.beginPath();g.moveTo(i*c,0);g.lineTo(i*c,h);g.stroke();g.beginPath();g.moveTo(0,i*c);g.lineTo(w,i*c);g.stroke()}
  });t.repeat.set(W/5,D/5);return t;
}
function textTexture(lines){
  return canvasTexture((g,w,h)=>{
    g.clearRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';g.fillStyle='#d5b46c';
    g.font='88px Georgia';g.fillText(lines[0],w/2,h*.44);
    g.font='34px Arial';g.letterSpacing='12px';g.fillText(lines[1],w/2,h*.60);
  },1536,768);
}
function logoPlane(x,y,z,ry,w=3.4,h=1.7){
  const p=plane(brandRoot,w,h,x,y,z,ry,new THREE.MeshBasicMaterial({map:textTexture(['ONE CATCH','COMPANY']),transparent:true,depthWrite:false}));
  return p;
}
function slatsX(cx,cz,width,height){
  const n=Math.round(width/.16), step=width/n,m=mat(C.bronze,.34,.5);
  for(let i=0;i<n;i++)box(brandRoot,.052,height,.06,cx-width/2+(i+.5)*step,STORE.floor+height/2+.10,cz,m);
  emissive(lightRoot,width,.025,.025,cx,STORE.floor+.13,cz+.04,C.light,5);
}
function slatsZ(cx,cz,width,height){
  const n=Math.round(width/.16), step=width/n,m=mat(C.bronze,.34,.5);
  for(let i=0;i<n;i++)box(brandRoot,.06,height,.052,cx,STORE.floor+height/2+.10,cz-width/2+(i+.5)*step,m);
  emissive(lightRoot,.025,.025,width,cx+.04,STORE.floor+.13,cz,C.light,5);
}
function track(x1,z1,x2,z2,count=5){
  const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),ang=-Math.atan2(dz,dx);
  const q=box(lightRoot,len,.028,.045,(x1+x2)/2,STORE.ceiling-.12,(z1+z2)/2,mat(0x08090a,.3,.25));q.rotation.y=ang;
  for(let i=0;i<count;i++){
    const t=(i+.5)/count,x=x1+dx*t,z=z1+dz*t;
    const h=box(lightRoot,.10,.15,.10,x,STORE.ceiling-.20,z,mat(0x08090a,.3,.25));
    const s=new THREE.SpotLight(C.light,13,5.5,Math.PI/7,.45,1.3);s.position.set(x,STORE.ceiling-.25,z);s.target.position.set(x,STORE.floor,z);lightRoot.add(s,s.target);
  }
}
function ring(cx,cz,r){
  const curve=new THREE.EllipseCurve(0,0,r,r,0,Math.PI*2);
  const pts=curve.getPoints(96).map(p=>new THREE.Vector3(p.x,0,p.y));
  const loop=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:C.gold}));
  loop.position.set(cx,STORE.ceiling-.28,cz);lightRoot.add(loop);
  const p=new THREE.PointLight(C.light,26,6,1.7);p.position.set(cx,STORE.ceiling-.35,cz);lightRoot.add(p);
}
function marker(name,color,x,z){
  const g=new THREE.Group();
  const p=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.08,24),mat(color,.4,.05,{emissive:color,emissiveIntensity:.4}));p.position.y=STORE.floor+.07;g.add(p);
  const pole=box(g,.025,1.1,.025,0,.58,0,mat(color,.4,.05,{emissive:color,emissiveIntensity:.4}));
  const s=makeSprite(name,color);s.position.y=1.45;s.scale.set(2.6,.58,1);g.add(s);
  g.position.set(x,STORE.floor,z);markerRoot.add(g);
}
function makeSprite(text,border){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');
  g.fillStyle='rgba(10,12,15,.88)';g.fillRect(18,35,988,186);g.strokeStyle=`#${border.toString(16).padStart(6,'0')}`;g.lineWidth=5;g.strokeRect(18,35,988,186);
  g.fillStyle='#fff';g.font='700 66px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(text,512,128);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));
}


/*
 * Existing building layout reconstructed from the supplied leased-premises plan.
 * Coordinates are mapped into the current OBJ/store coordinate system.
 * This layer represents fixed walls/cores/door openings and is intentionally
 * separate from the One Catch decorative finishes.
 */
function existingWallX(x1,x2,z,height=H*.90,material=null){
  const m=material||mat(C.ivory2,.73,.01);
  return box(existingRoot,Math.abs(x2-x1),height,.10,(x1+x2)/2,STORE.floor+height/2,z,m);
}
function existingWallZ(x,z1,z2,height=H*.90,material=null){
  const m=material||mat(C.ivory2,.73,.01);
  return box(existingRoot,.10,height,Math.abs(z2-z1),x,STORE.floor+height/2,(z1+z2)/2,m);
}
function doorLeafX(x,z,width=.92,openAngle=Math.PI*.36,flip=false){
  const g=new THREE.Group();
  const leaf=box(g,width,2.05,.045,(flip?-1:1)*width/2,1.025,0,mat(0x302b27,.46,.10));
  const trim=box(g,width+.05,.045,.065,(flip?-1:1)*width/2,2.04,0,mat(C.obsidian,.40,.25));
  g.position.set(x,STORE.floor,z);
  g.rotation.y=(flip?-1:1)*openAngle;
  existingRoot.add(g);
  return g;
}
function doorLeafZ(x,z,width=.92,openAngle=Math.PI*.36,flip=false){
  const g=new THREE.Group();
  const leaf=box(g,.045,2.05,width,0,1.025,(flip?-1:1)*width/2,mat(0x302b27,.46,.10));
  const trim=box(g,.065,.045,width+.05,0,2.04,(flip?-1:1)*width/2,mat(C.obsidian,.40,.25));
  g.position.set(x,STORE.floor,z);
  g.rotation.y=(flip?-1:1)*openAngle;
  existingRoot.add(g);
  return g;
}
function wallXWithDoor(x1,x2,z,doorX,doorW=.95,flip=false){
  const gap=doorW/2+.035;
  existingWallX(x1,doorX-gap,z);
  existingWallX(doorX+gap,x2,z);
  // header keeps the wall visually continuous above the opening
  box(existingRoot,doorW+.08,H*.90-2.12,.10,doorX,STORE.floor+2.12+(H*.90-2.12)/2,z,mat(C.ivory2,.73,.01));
  doorLeafX(doorX-gap,z+.025,doorW,Math.PI*.38,flip);
}
function wallZWithDoor(x,z1,z2,doorZ,doorW=.95,flip=false){
  const gap=doorW/2+.035;
  existingWallZ(x,z1,doorZ-gap);
  existingWallZ(x,doorZ+gap,z2);
  box(existingRoot,.10,H*.90-2.12,doorW+.08,x,STORE.floor+2.12+(H*.90-2.12)/2,doorZ,mat(C.ivory2,.73,.01));
  doorLeafZ(x+.025,doorZ-gap,doorW,Math.PI*.38,flip);
}

function furnitureMat(color,rough=.5,metal=.05,extra={}){
  return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,...extra});
}
function addDisplayCase(x,z,w=1.8,d=.55,h=1.25,ry=0){
  const g=new THREE.Group();
  const base=box(g,w,.28,d,0,.14,0,furnitureMat(C.obsidian,.42,.12));
  const frame=box(g,w,.06,d,0,h-.03,0,furnitureMat(C.gold,.3,.55));
  const glass=new THREE.Mesh(
    new THREE.BoxGeometry(w-.06,h-.34,d-.06),
    new THREE.MeshPhysicalMaterial({color:0xbfd0d8,transparent:true,opacity:.18,roughness:.08,metalness:.02,transmission:.6})
  );
  glass.position.y=.28+(h-.34)/2;
  g.add(glass);
  g.position.set(x,STORE.floor,z);g.rotation.y=ry;furnitureRoot.add(g);return g;
}
function addCounter(x,z,w=2.2,d=.75,h=.95,ry=0){
  const g=new THREE.Group();
  box(g,w,h,d,0,h/2,0,furnitureMat(0x1d1f22,.48,.08));
  box(g,w+.03,.055,d+.03,0,h+.03,0,furnitureMat(C.gold,.28,.5));
  g.position.set(x,STORE.floor,z);g.rotation.y=ry;furnitureRoot.add(g);return g;
}
function addPlayTable(x,z,w=1.6,d=.8,ry=0){
  const g=new THREE.Group();
  box(g,w,.06,d,0,.76,0,furnitureMat(0x2a2b2f,.62,.04));
  for(const sx of [-1,1])for(const sz of [-1,1]){
    box(g,.06,.74,.06,sx*(w/2-.12),.37,sz*(d/2-.12),furnitureMat(C.obsidian,.45,.14));
  }
  g.position.set(x,STORE.floor,z);g.rotation.y=ry;furnitureRoot.add(g);return g;
}
function addChair(x,z,ry=0){
  const g=new THREE.Group();
  box(g,.44,.05,.44,0,.46,0,furnitureMat(0x222428,.58,.04));
  box(g,.05,.44,.05,-.17,.22,-.17,furnitureMat(C.obsidian,.45,.12));
  box(g,.05,.44,.05,.17,.22,-.17,furnitureMat(C.obsidian,.45,.12));
  box(g,.05,.44,.05,-.17,.22,.17,furnitureMat(C.obsidian,.45,.12));
  box(g,.05,.44,.05,.17,.22,.17,furnitureMat(C.obsidian,.45,.12));
  box(g,.44,.52,.05,0,.77,.195,furnitureMat(0x222428,.58,.04));
  g.position.set(x,STORE.floor,z);g.rotation.y=ry;furnitureRoot.add(g);return g;
}
function buildFurniture(){
  furnitureRoot.clear();

  // Front / retail display run
  addDisplayCase(-5.55,-8.95,1.7,.55,1.25,0);
  addDisplayCase(-3.55,-8.95,1.7,.55,1.25,0);
  addDisplayCase(-1.55,-8.95,1.7,.55,1.25,0);

  // Premium slab / raw card display on right wall
  addDisplayCase(6.55,-5.95,1.6,.5,1.3,Math.PI/2);
  addDisplayCase(6.55,-3.95,1.6,.5,1.3,Math.PI/2);

  // Main service / checkout counter
  addCounter(3.8,-7.6,2.4,.8,.95,0);

  // Play area: 4 tables, 4 seats each
  const tables=[[-4.8,-1.8],[-2.6,-1.8],[-4.8,.3],[-2.6,.3]];
  for(const [x,z] of tables){
    addPlayTable(x,z,1.55,.8,0);
    addChair(x,z-.72,0);
    addChair(x,z+.72,Math.PI);
    addChair(x-.95,z,Math.PI/2);
    addChair(x+.95,z,-Math.PI/2);
  }

  // Rear accessory/sealed display
  addDisplayCase(.8,2.45,2.0,.5,1.25,0);
  addDisplayCase(3.15,2.45,2.0,.5,1.25,0);
}

function buildExistingLayout(){
  const wall=mat(C.ivory2,.74,.01);
  const core=mat(0x2a2b2d,.58,.05);

  // 1. Front-left stair/service core: the lease boundary wraps around this
  // existing common/core volume on the supplied plan.
  const coreX0=STORE.x0+.30, coreX1=STORE.x0+3.28;
  const coreZ0=STORE.z0+.18, coreZ1=STORE.z0+2.55;
  existingWallX(coreX0,coreX1,coreZ1,H*.92,core);
  existingWallZ(coreX1,coreZ0,coreZ1,H*.92,core);
  // Low dark infill makes the excluded core immediately readable from above.
  box(existingRoot,coreX1-coreX0,.08,coreZ1-coreZ0,(coreX0+coreX1)/2,STORE.floor+.05,(coreZ0+coreZ1)/2,mat(0x161719,.82,.02));

  // 2. Existing room at the left/rear side, including its doorway.
  wallXWithDoor(STORE.x0+.30,STORE.x0+5.25,STORE.z0+4.63,STORE.x0+4.12,.92,false);
  existingWallZ(STORE.x0+5.25,STORE.z0+4.63,STORE.z0+6.72,H*.90,wall);

  // 3. Small existing enclosure/niche adjoining that room.
  existingWallX(STORE.x0+4.22,STORE.x0+5.25,STORE.z0+5.62,H*.90,wall);
  wallZWithDoor(STORE.x0+4.22,STORE.z0+4.63,STORE.z0+5.62,STORE.z0+5.12,.82,true);

  // 4. Two fixed longitudinal internal walls visible in the leased shop area.
  // They intentionally stop short of the façade, as on the plan.
  existingWallZ(STORE.x0+6.58,STORE.z0+4.75,STORE.z0+7.73,H*.90,wall);
  existingWallZ(STORE.x0+9.58,STORE.z0+4.55,STORE.z0+7.55,H*.90,wall);

  // 5. Rear/right separation with the existing door into the service side.
  wallXWithDoor(STORE.x0+9.58,STORE.x1-.24,STORE.z0+7.55,STORE.x1-1.63,.92,true);
  existingWallZ(STORE.x1-.24,STORE.z0+7.55,STORE.z1-.28,H*.90,wall);

  // 6. Door/opening on the right-hand side of the leased unit.
  // This is represented as a real opening + leaf rather than a painted symbol.
  wallZWithDoor(STORE.x1-.24,STORE.z0+3.18,STORE.z0+5.10,STORE.z0+4.18,.92,false);

  // Black skirting/reveal along fixed partitions, matching the current design language.
  const sk=mat(C.obsidian,.48,.08);
  existingWallX(STORE.x0+.30,STORE.x0+5.25,STORE.z0+4.63,.09,sk).position.y=STORE.floor+.065;
  existingWallZ(STORE.x0+6.58,STORE.z0+4.75,STORE.z0+7.73,.09,sk).position.y=STORE.floor+.065;
  existingWallZ(STORE.x0+9.58,STORE.z0+4.55,STORE.z0+7.55,.09,sk).position.y=STORE.floor+.065;
}

function buildDesign(){
  // Warm Ivory floor
  const tile=makeTile();
  const floorMat=new THREE.MeshStandardMaterial({map:tile,roughness:.58,metalness:.02});
  box(floorRoot,W,.045,D,CX,STORE.floor+.025,CZ,floorMat);
  // Obsidian edge reveal
  const edge=mat(C.obsidian,.48,.08);
  box(floorRoot,W,.024,.07,CX,STORE.floor+.055,STORE.z0+.04,edge);
  box(floorRoot,W,.024,.07,CX,STORE.floor+.055,STORE.z1-.04,edge);
  box(floorRoot,.07,.024,D,STORE.x0+.04,STORE.floor+.055,CZ,edge);
  box(floorRoot,.07,.024,D,STORE.x1-.04,STORE.floor+.055,CZ,edge);

  // Architectural perimeter. Front is glass, so don't close it with a wall.
  const ivory=mat(C.ivory,.70,.01), ivory2=mat(C.ivory2,.74,.01), dark=mat(C.obsidian,.45,.08);
  box(wallRoot,.07,H,D,STORE.x0+.04,STORE.floor+H/2,CZ,ivory);
  box(wallRoot,.07,H,D,STORE.x1-.04,STORE.floor+H/2,CZ,dark);
  box(wallRoot,W,H,.07,CX,STORE.floor+H/2,STORE.z1-.04,ivory2);

  // Existing fixed internal walls and door openings come from the supplied lease plan.
  buildExistingLayout();

  // Right-hand premium feature treatment.
  const stone=makeStone();
  const stoneMat=new THREE.MeshStandardMaterial({map:stone,roughness:.48,metalness:.03});
  box(wallRoot,.075,H*.87,5.9,STORE.x1-.10,STORE.floor+H*.46,-2.1,stoneMat);
  slatsZ(STORE.x1-.17,-5.85,1.95,H*.84);

  // Entrance/brand feature to the right of the confirmed bottom-right entrance.
  const featureZ=STORE.z0+.12, featureX=5.12, featureW=3.1;
  box(wallRoot,featureW,H*.86,.075,featureX,STORE.floor+H*.44,featureZ,stoneMat);
  slatsX(featureX-featureW/2-.48,featureZ+.035,.72,H*.80);
  logoPlane(featureX,STORE.floor+1.40,featureZ+.045,0,2.65,1.30);
  const torus=new THREE.Mesh(new THREE.TorusGeometry(.27,.025,12,64),mat(C.gold,.25,.65,{emissive:C.gold,emissiveIntensity:.45}));
  torus.position.set(featureX,STORE.floor+1.93,featureZ+.01);torus.rotation.x=Math.PI/2;brandRoot.add(torus);

  // Play-area decorative wall treatment on left/back side. No tables/chairs.
  const playWallX=STORE.x0+.11;
  box(wallRoot,.08,H*.86,4.2,playWallX,STORE.floor+H*.44,-1.9,dark);
  for(let i=0;i<3;i++){
    const z=-3.25+i*1.25;
    const frame=box(brandRoot,.055,1.32,.84,playWallX+.055,STORE.floor+1.35,z,mat(C.gold,.28,.55));
    const insert=box(brandRoot,.065,1.20,.72,playWallX+.095,STORE.floor+1.35,z,mat(0x111318,.58,.05));
  }

  // Front glass façade, split into panels and leaving entrance gaps.
  const glassMat=new THREE.MeshPhysicalMaterial({color:C.glass,transparent:true,opacity:.18,roughness:.08,metalness:.02,transmission:.55,side:THREE.DoubleSide});
  const mullion=mat(0x181b1f,.35,.35);
  const front=STORE.z0+.02;
  const panels=[
    [STORE.x0+.15,-5.85],[-5.55,-4.05],[-3.75,-2.15],[-1.85,-.25],[.05,1.75],[2.05,3.55],
    // confirmed entrance is around bottom-right; leave a broad gap before last panel
    [5.65,STORE.x1-.15]
  ];
  for(const [a,b] of panels){
    const width=b-a;
    if(width<=.05) continue;
    plane(glassRoot,width,H*.78,(a+b)/2,STORE.floor+H*.48,front,0,glassMat);
    box(glassRoot,.045,H*.82,.045,a,STORE.floor+H*.48,front-.02,mullion);
    box(glassRoot,.045,H*.82,.045,b,STORE.floor+H*.48,front-.02,mullion);
  }
  box(glassRoot,W,.055,.055,CX,STORE.floor+H*.87,front-.02,mullion);

  // Ceiling and lighting
  const ceilTex=makeCeiling();
  const ceilMat=new THREE.MeshStandardMaterial({map:ceilTex,roughness:.72,side:THREE.DoubleSide});
  box(ceilingRoot,W,.055,D,CX,STORE.ceiling,CZ,ceilMat);
  // Perimeter glow
  emissive(lightRoot,W-.5,.025,.025,CX,STORE.ceiling-.10,STORE.z0+.22);
  emissive(lightRoot,W-.5,.025,.025,CX,STORE.ceiling-.10,STORE.z1-.22);
  emissive(lightRoot,.025,.025,D-.5,STORE.x0+.22,STORE.ceiling-.10,CZ);
  emissive(lightRoot,.025,.025,D-.5,STORE.x1-.22,STORE.ceiling-.10,CZ);

  // Track lines follow the long room axes.
  for(const x of [-4.8,-1.8,1.2,4.2])track(x,STORE.z0+.65,x,STORE.z1-.70,6);
  // Play-area ring lights only; furniture comes later.
  ring(-3.4,-1.35,1.0);ring(-3.4,1.00,1.0);

  // Markers based on the corrected annotated plan.
  marker('ENTRANCE',0x4ca5ff,4.55,STORE.z0+.35);
  marker('TOILET',0x63df91,-6.25,-3.25);
  marker('SAFE',0xffca55,-.65,-4.10);
  markerRoot.visible=false;
}

buildDesign();
buildFurniture();

// Load the actual bundled OBJ/MTL automatically.
async function loadScan(){
  const state=document.getElementById('loadState');
  try{
    const materials=await new Promise((resolve,reject)=>{
      new MTLLoader().setPath('./assets/model/').load('24-9-2026.mtl',m=>{m.preload();resolve(m)},undefined,reject);
    });
    const obj=await new Promise((resolve,reject)=>{
      new OBJLoader().setMaterials(materials).setPath('./assets/model/').load('24-9-2026.obj',resolve,undefined,reject);
    });
    obj.traverse(n=>{
      if(n.isMesh){
        n.castShadow=false;n.receiveShadow=true;
        const mats=Array.isArray(n.material)?n.material:[n.material];
        mats.forEach(m=>{
          m.transparent=true;m.opacity=.25;m.depthWrite=false;m.roughness=.72;
          m.clippingPlanes=[];
        });
      }
    });
    scanRoot.add(obj);
    scanRoot.visible=false;
    state.textContent='Actual OBJ loaded: 188,181 vertices · 324,287 faces. Design overlay active.';
  }catch(err){
    console.error(err);
    state.textContent='OBJ load failed: '+(err?.message||err);
  }
}
loadScan();

function updateScanOpacity(){
  const op=+document.getElementById('scanOpacity').value;
  scanRoot.traverse(n=>{
    if(n.isMesh){
      const mats=Array.isArray(n.material)?n.material:[n.material];
      mats.forEach(m=>{m.transparent=true;m.opacity=op;m.depthWrite=op>.75});
    }
  });
}
document.getElementById('scanToggle').addEventListener('change',e=>scanRoot.visible=e.target.checked);
document.getElementById('scanOpacity').addEventListener('input',updateScanOpacity);
document.getElementById('floorToggle').addEventListener('change',e=>floorRoot.visible=e.target.checked);
document.getElementById('wallsToggle').addEventListener('change',e=>wallRoot.visible=e.target.checked);
document.getElementById('existingToggle').addEventListener('change',e=>existingRoot.visible=e.target.checked);
document.getElementById('furnitureToggle').addEventListener('change',e=>furnitureRoot.visible=e.target.checked);
document.getElementById('ceilingToggle').addEventListener('change',e=>ceilingRoot.visible=e.target.checked);

function setOpenRoof(enabled){
  // Hide the designed ceiling entirely.
  ceilingRoot.visible=!enabled && document.getElementById('ceilingToggle').checked;

  // Clip the original scan above the ceiling line so a top/angled view can see inside.
  scanRoot.traverse(n=>{
    if(!n.isMesh) return;
    const mats=Array.isArray(n.material)?n.material:[n.material];
    mats.forEach(m=>{
      m.clippingPlanes=enabled?[roofClipPlane]:[];
      m.clipShadows=enabled;
      m.needsUpdate=true;
    });
  });

  // A slightly higher orbit limit makes overhead inspection easier while roof is open.
  controls.maxPolarAngle=enabled?Math.PI*.62:Math.PI*.495;
}

document.getElementById('openRoofToggle').addEventListener('change',e=>setOpenRoof(e.target.checked));
document.getElementById('lightToggle').addEventListener('change',e=>lightRoot.visible=e.target.checked);
document.getElementById('brandToggle').addEventListener('change',e=>brandRoot.visible=e.target.checked);
document.getElementById('glassToggle').addEventListener('change',e=>glassRoot.visible=e.target.checked);
document.getElementById('markersToggle').addEventListener('change',e=>markerRoot.visible=e.target.checked);

function setView(v){
  controls.target.set(CX,STORE.floor+.85,CZ);
  if(v==='top')camera.position.set(CX,18,CZ+.01);
  else if(v==='entrance')camera.position.set(4.55,STORE.floor+1.65,STORE.z0-5.5);
  else if(v==='play')camera.position.set(-6.0,STORE.floor+1.55,-.8);
  else camera.position.set(14,9,-18);
  controls.update();
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-STORE.floor);
canvas.addEventListener('pointermove',e=>{
  const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(pointer,camera);const p=new THREE.Vector3();
  if(raycaster.ray.intersectPlane(floorPlane,p))document.getElementById('coords').textContent=`X ${p.x.toFixed(2)} · Z ${p.z.toFixed(2)}`;
});

function resize(){
  const w=canvas.clientWidth,h=canvas.clientHeight,pr=Math.min(devicePixelRatio,2);
  if(canvas.width!==Math.floor(w*pr)||canvas.height!==Math.floor(h*pr)){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
}
function animate(){requestAnimationFrame(animate);resize();controls.update();renderer.render(scene,camera)}
setView('hero');animate();
