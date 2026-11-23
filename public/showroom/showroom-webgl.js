import {makeWater} from './water.js?v=white-studio-1';
import {addLiquidRefraction, bindLiquidCamera} from './glass-volume.js?v=white-studio-1';
import {
  ACESFilmicToneMapping, AmbientLight, Box3, BoxGeometry, CanvasTexture, Color, DoubleSide, GLTFLoader,
  Group, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera,
  PlaneGeometry, PMREMGenerator, Reflector, Scene, SpotLight, SRGBColorSpace, Vector3, WebGLRenderer
} from './three-showroom.js?v=2';

const stage = document.querySelector('#stage');
const mount = document.querySelector('#showroom3d');
const dragArea = document.querySelector('#product-drag');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const scene = new Scene();
const camera = new PerspectiveCamera(34, 1, .07, 65);
// Five tall slots share one continuous facade at every viewport size.
const lighting={aim:0,shelf:100,selection:100,key:100,distance:100};
const whiteShelfGain = .75;
const colourBounceGain = 1.15;
const BAY = {width:2.40, height:5.80, columns:5, step:2.96};
const entries = [
  {key:'galet', file:'galet-crystal.glb', height:2.58,
    tone:'#21db75', glass:'#d8f8e1', absorption:'#56ba78', liquid:'#079c41', distance:1.18, thickness:.012, rest:-.10, shape:[1.1,.95,2.0]},
  {key:'rose', file:'rose-lune-smoked.glb', height:2.57,
    tone:'#ff408c', glass:'#ffe0ed', absorption:'#d45b8a', liquid:'#c91862', distance:1.16, thickness:.016, rest:.08, shape:[1.02,.89,2.65]},
  {key:'iris', file:'iris.glb', height:2.95,
    tone:'#ac76ff', glass:'#efe4ff', absorption:'#9962ce', liquid:'#813eca', distance:1.2, thickness:.035, rest:.05, shape:[.89,.86,2.1]},
  {key:'terre', file:'grenat.glb', height:4.02,
    tone:'#d1a05e', glass:'#ffe7b9', absorption:'#985c2b', liquid:'#a36521', distance:1.2, thickness:.035, rest:.05, shape:[.89,.86,2.1]},
  {key:'nacre', file:'nacre.glb', height:2.67,
    tone:'#72dfd3', glass:'#e1faf6', absorption:'#56b8ad', liquid:'#21b6a5', distance:1.2, thickness:.035, rest:.05, shape:[.89,.86,2.1]}
];
const products = entries.map(d=>({...d,z:.52}));
const phoneLayout=matchMedia('(max-width:679px) and (orientation:portrait)');
let stacked=phoneLayout.matches;
const phoneSlots={terre:[-.5,1],rose:[.5,1],galet:[-1,0],iris:[0,0],nacre:[1,0]};
function placeProducts(){
  products.forEach((p,index)=>{
    const [column,row]=stacked?phoneSlots[p.key]:[index-2,0];
    p.x=column*BAY.step;
    p.y=-2.14+row*(BAY.height+.52);
    p.group?.position.set(p.x,p.y,p.z);
  });
}
placeProducts();
const layouts=new Map();
let transition=null;

const angle = Math.tan(MathUtils.degToRad(camera.fov / 2));
const pointerStates = new Map();
const lightingPointer = {x: 0, y: 0, targetX: 0, targetY: 0};
const manualTurn = {x: 0, y: 0};
const projected = new Vector3();
const worldPoint = new Vector3();
const hoverGap = .016;

let renderer, studioReflection, water, shelves;
let width = 0, height = 0, previousTime = 0;
let presented = false;
let shot = null, lastProduct = 'gallery';
const spinDuration = 1750;
const additiveBlending = 2; // Three.js AdditiveBlending, omitted from the local bundle exports.

function contactTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const falloff = ctx.createRadialGradient(64, 64, 1, 64, 64, 64);
  falloff.addColorStop(0, 'rgba(0,0,0,.8)');
  falloff.addColorStop(.5, 'rgba(0,0,0,.47)');
  falloff.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = falloff;
  ctx.fillRect(0, 0, 128, 128);
  return new CanvasTexture(canvas);
}

const shadowMap = contactTexture();

function refractionTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.translate(96, 96);
  for (let i = 0; i < 3; i++) {
    const halo = ctx.createRadialGradient(-12 + i * 12, 5 - i * 8, 1, 0, 0, 93);
    halo.addColorStop(0, 'rgba(255,255,255,.45)');
    halo.addColorStop(.42, 'rgba(255,255,255,.16)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(-96, -96, 192, 192);
  }
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,' + (.05 + (i % 3) * .024) + ')';
    ctx.lineWidth = 1.2 + (i % 4) * .65;
    ctx.ellipse(i * 5 - 18, i * 3 - 8, 30 + i * 5, 14 + i * 5, -.5 + i * .21, .1, Math.PI * 1.54);
    ctx.stroke();
  }
  return new CanvasTexture(canvas);
}

const refractionMap = refractionTexture();

function addRefraction(group, color, radius) {
  const groundLight = new Mesh(new PlaneGeometry(radius * 1.98, radius * 1.91),
    new MeshBasicMaterial({
      map: refractionMap, color, opacity: .72, transparent: true,
      blending: additiveBlending, depthWrite: false, toneMapped: false
    }));
  groundLight.rotateX(-Math.PI / 2);
  groundLight.position.set(0, .014, .13);
  groundLight.renderOrder = 2;
  group.add(groundLight);
  return groundLight;
}

function satinBump() {
  const canvas = document.createElement('canvas'); canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d'); const tex=ctx.createImageData(128,128);
  let state=37;
  for(let i=0;i<tex.data.length;i+=4){state=(Math.imul(state,1664525)+1013904223)>>>0;
    const v=105+(state>>>27);tex.data[i]=tex.data[i+1]=tex.data[i+2]=v;tex.data[i+3]=255;}
  ctx.putImageData(tex,0,0);return new CanvasTexture(canvas);
}

// Colour, tangent normals, height (R) and roughness (G) share the scan's UVs.
let rockMap,rockNormal,stoneRoughnessMap,stoneSample;
async function loadStoneTexture(){
  const [albedo,normal,relief]=await Promise.all(['color','normal','relief'].map(async channel=>{
    const image=new Image();
    image.src=new URL('cleaved-rock-'+channel+'.webp',import.meta.url).href;
    await image.decode();
    const map=new CanvasTexture(image);
    map.wrapS=map.wrapT=1000;
    map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    return map;
  }));
  albedo.colorSpace=SRGBColorSpace;
  rockNormal=normal;stoneRoughnessMap=relief;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(relief.image,0,0,256,256);
  stoneSample=ctx.getImageData(0,0,256,256).data;
  return albedo;
}

function beamTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  // Optical haze has a feathered falloff. The stone itself receives the real light.
  const pixels=context.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const t=y/255;
    const halfWidth=13+97*Math.pow(t,.85);
    const centre=128+3.5*t*Math.sin(5*t);
    const lateral=Math.exp(-Math.pow((x-centre)/halfWidth,2)*1.55);
    const vertical=Math.exp(-t*2.7)*Math.min(1,t*110)*(1-t*t);
    const at=(y*256+x)*4;
    pixels.data[at]=pixels.data[at+1]=pixels.data[at+2]=255;
    pixels.data[at+3]=Math.round(255*lateral*vertical);
  }
  context.putImageData(pixels,0,0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

const lightBeamMap = beamTexture();

const satinMap = satinBump();

// Cleft stone lies inside precisely cut recesses. World-space UVs continue over
// adjacent architectural pieces and the displacement fades out at their edges.
function createWall() {
  const wall=new Group();
  const outside=new MeshStandardMaterial({color:'#555560',map:rockMap,
    metalness:.05,roughness:.91,roughnessMap:stoneRoughnessMap,
    normalMap:rockNormal,envMapIntensity:.12});
  outside.normalScale.set(1.12,1.12);
  const inner=outside.clone();inner.color.set('#acabb3');
  const backStone=inner.clone();
  backStone.color.set('#8e8c97');
  backStone.vertexColors=true;
  const floorStone=inner.clone();floorStone.roughness=.70;floorStone.normalScale.set(.45,.45);
  const ceiling=outside.clone();ceiling.color.set('#3b3940');ceiling.roughness=.95;
  const dark=new MeshStandardMaterial({color:'#17151b',metalness:.67,roughness:.38});
  function rock(size,pos,mat=outside,amount=.008,seed=1){
    const sx=Math.max(1,Math.min(64,Math.ceil(size[0]*9)));
    const sy=Math.max(1,Math.min(96,Math.ceil(size[1]*12)));
    const sz=Math.max(1,Math.min(32,Math.ceil(size[2]*9)));
    const g=new BoxGeometry(...size,sx,sy,sz);
    const occlusion=mat===backStone?g.attributes.normal.clone():null;
    const a=g.attributes.position, normals=g.attributes.normal, uv=g.attributes.uv;
    for(let i=0;i<a.count;i++){
      const x=a.getX(i),y=a.getY(i),z=a.getZ(i);
      const nx=normals.getX(i),ny=normals.getY(i),nz=normals.getZ(i);
      const faceX=Math.abs(nx)>.5,faceY=Math.abs(ny)>.5;
      const worldX=x+pos[0],worldY=y+pos[1],worldZ=z+pos[2];
      const scale=3.35;
      const u=(faceX?worldZ:worldX)/scale;
      const v=(faceY?worldZ:worldY)/scale;
      uv.setXY(i,u,v);
      const tx=Math.floor(((u%1+1)%1)*255),ty=255-Math.floor(((v%1+1)%1)*255);
      const sample=stoneSample[(ty*256+tx)*4]/255-.575;
      const edgeA=faceX?Math.min(size[2]/2-Math.abs(z),size[1]/2-Math.abs(y)):
        faceY?Math.min(size[0]/2-Math.abs(x),size[2]/2-Math.abs(z)):
        Math.min(size[0]/2-Math.abs(x),size[1]/2-Math.abs(y));
      const fade=MathUtils.smoothstep(edgeA,0,.12);
      if(occlusion){
        // Recessed upper corners receive progressively less bounced light.
        const down=MathUtils.clamp(.5-y/size[1],0,1);
        const radius=.15+down*1.12;
        const offset=(x/size[0]+sample*.035)/radius;
        const gain=.07+.93*(1-Math.exp(-down*5))*Math.exp(-offset*offset*1.35);
        occlusion.setXYZ(i,gain,gain,gain);
      }
      const relief=sample*amount*fade;
      a.setXYZ(i,x+nx*relief,y+ny*relief,z+nz*relief);
    }
    if(occlusion)g.setAttribute('color',occlusion);
    g.computeVertexNormals();
    if(Array.isArray(mat)){
      // Keep all exterior faces in one draw call and the lit reveal in a second.
      const unique=[...new Set(mat)];
      const ordered=new g.index.array.constructor(g.index.count);
      const groups=[...g.groups];let offset=0;
      g.clearGroups();
      for(const [materialIndex,material] of unique.entries()){
        const start=offset;
        for(const group of groups)if(mat[group.materialIndex]===material){
          ordered.set(g.index.array.subarray(group.start,group.start+group.count),offset);
          offset+=group.count;
        }
        g.addGroup(start,offset-start,materialIndex);
      }
      g.index.array.set(ordered);mat=unique;
    }
    const mesh=new Mesh(g,mat);mesh.castShadow=true;mesh.receiveShadow=true;mesh.position.set(...pos);wall.add(mesh);return mesh;
  }
  const w=BAY.width,base=-2.56;
  const rows=[...new Set(products.map(p=>p.y))];
  for(const bottom of rows){
    const xs=products.filter(p=>p.y===bottom).map(p=>p.x).sort((a,b)=>a-b);
    const left=xs[0]-w/2,right=xs.at(-1)+w/2;
    const centreY=bottom+BAY.height/2;
    for(let c=1;c<xs.length;c++){
      rock([xs[c]-xs[c-1]-w,BAY.height+.12,3.06],[(xs[c]+xs[c-1])/2,centreY,-.27],outside,.075);
    }
    for(const [edge,limit] of [[left,-40],[right,40]]){
      rock([Math.abs(limit-edge),BAY.height+.12,3.06],[(edge+limit)/2,centreY,-.27],outside,.075);
    }
    rock([80,.56,3.06],[0,bottom+BAY.height+.24,-.25],outside,.052);
    rock([80,.52,3.08],[0,bottom-.25,-.26],outside,.052);
  }
  const highestCeiling=Math.max(...products.map(p=>p.y+BAY.height));
  rock([80,60,3.06],[0,highestCeiling+.50+30,-.25],outside,.052);
  const bayLights=new Map();
  // One inspection light serves the selected recess. Keeping it in the light
  // set at zero intensity avoids recompiling every glass material on selection.
  const inspection=addSpot(wall,{color:'#fff8ef',intensity:0,
    position:[0,0,.50],look:[0,0,-1.28],spread:.69});
  inspection.penumbra=.94;
  wall.userData.inspection=inspection;
  for(const product of products){
    const cx=product.x,bottom=product.y,topY=bottom+BAY.height;
    const tintedSides=inner.clone();
    tintedSides.emissive.set(product.tone);
    const tintedFloor=floorStone.clone();
    const backWall=rock([w+.16,BAY.height+.14,.14],[cx,bottom+BAY.height/2,-2.10],backStone,.15);
    rock([w+.12,.15,3.32],[cx,bottom-.075,-.37],
      [outside,outside,tintedFloor,outside,outside,outside],.006);
    rock([w+.12,.19,3.32],[cx,topY+.04,-.37],
      [outside,outside,outside,ceiling,outside,outside],.006);
    const sideOffset=w/2+.06;
    for(const dir of [-1,1]){
      rock([.12,BAY.height+.10,3.32],[cx+dir*sideOffset,bottom+BAY.height/2,-.37],
        [dir<0?tintedSides:outside,dir>0?tintedSides:outside,outside,outside,outside,outside],.07);
    }
    // A flush downward-facing optic is visible only from below its ceiling.
    const disc=new PlaneGeometry(1,1,12,12);
    const vertices=disc.attributes.position;
    for(let i=0;i<vertices.count;i++){
      const x=vertices.getX(i)*2,y=vertices.getY(i)*2;
      vertices.setXY(i,.5*x*Math.sqrt(1-y*y*.5),.5*y*Math.sqrt(1-x*x*.5));
    }
    function downlight(x,diameter){
      const rim=new Mesh(disc,dark);
      rim.position.set(x,topY-.065,-.28);rim.rotation.x=Math.PI/2;
      rim.scale.setScalar(diameter);wall.add(rim);
      const lens=new Mesh(disc,new MeshBasicMaterial({color:'#fff4e4',toneMapped:false}));
      lens.scale.setScalar(.77);lens.position.z=.015;rim.add(lens);
      return lens;
    }
    const lens=downlight(cx,.41);
    const halo=new Mesh(new PlaneGeometry(1.15,.60),new MeshBasicMaterial({
      map:refractionMap,color:0xfff7ec,transparent:true,opacity:.30,
      blending:additiveBlending,depthWrite:false,toneMapped:false}));
    halo.position.set(cx,topY-.082,-.28);halo.rotation.x=Math.PI/2;wall.add(halo);
    const beam=new Mesh(new PlaneGeometry(w*.90,BAY.height-.3),new MeshBasicMaterial({
      map:lightBeamMap,color:0xfffaf4,transparent:true,opacity:.018,
      blending:additiveBlending,depthWrite:false,toneMapped:false,side:DoubleSide}));
    beam.position.y=-(BAY.height-.3)/2;
    const beamPivot=new Group();beamPivot.position.set(cx,topY-.09,-.28);
    beamPivot.add(beam);wall.add(beamPivot);
    const overhead=addSpot(wall,{color:'#fff8f0',intensity:150,
      position:[cx,topY-.09,-.28],look:[cx,bottom+product.height*.62,-1.52],spread:.55});
    overhead.penumbra=1;overhead.distance=9;
    const spill=addSpot(wall,{color:product.tone,intensity:8,
      position:[cx,bottom+product.height*.40,-.24],look:[cx,bottom+product.height*.45,-2.10],spread:1.08});
    spill.distance=4.0;
    spill.penumbra=.95;
    // Continuous wall-side transmission extends over the entire stone reveal.
    const caustics=[-1,1].map(dir=>{
      const patch=new Mesh(new PlaneGeometry(3.24,product.height*.94),new MeshBasicMaterial({
        map:refractionMap,color:product.tone,transparent:true,opacity:.17,
        blending:additiveBlending,depthWrite:false,toneMapped:false}));
      patch.position.set(cx+dir*(sideOffset-.08),bottom+BAY.height*.5,-.37);
      patch.rotation.y=dir<0?Math.PI/2:-Math.PI/2;wall.add(patch);return patch;
    });
    bayLights.set(product.key,{overhead,spill,caustics,halo,beam,beamPivot,
      lens,
      tintedSides,tintedFloor,backWall});
  }
  rock([80,.16,3.1],[0,base-.19,-.20],floorStone,.006);
  wall.userData.lights=bayLights;scene.add(wall);return wall;
}

function addSpot(parent, {color, intensity, position, look, spread = .56}) {
  const light = new SpotLight(color, intensity, 0, spread, .74, 2);
  light.position.set(...position);
  light.target.position.set(...look);
  parent.add(light, light.target);
  return light;
}

// The blue cap's 32 identical-material flutes share one draw call.
function mergeCapFlutes(model) {
  const flutes = [];
  model.updateMatrixWorld(true);
  model.traverse(mesh => {
    if (mesh.isMesh && /^Fine cap flute/.test(mesh.name)) flutes.push(mesh);
  });
  if (flutes.length < 2) return;
  const parts = flutes.map(mesh => {
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    return geometry.applyMatrix4(mesh.matrixWorld);
  });
  const merged = parts[0].clone();
  merged.clearGroups();
  for (const [name, attribute] of Object.entries(merged.attributes)) {
    const length = parts.reduce((total, part) => total + part.attributes[name].array.length, 0);
    const values = new attribute.array.constructor(length);
    let offset = 0;
    for (const part of parts) {
      values.set(part.attributes[name].array, offset);
      offset += part.attributes[name].array.length;
    }
    merged.setAttribute(name, new attribute.constructor(values, attribute.itemSize, attribute.normalized));
  }
  merged.computeBoundingSphere();
  const cap = new Mesh(merged, flutes[0].material);
  cap.name = 'Merged cap flutes';
  for (const mesh of flutes) mesh.removeFromParent();
  for (const geometry of parts) geometry.dispose();
  model.add(cap);
}

async function loadBottle(product, loader) {
  const url = new URL(product.file, import.meta.url);
  url.searchParams.set('v', product.key === 'terre' ? 'bronze-4' : 'spirits-1');
  const {scene: model} = await loader.loadAsync(url.href);
  mergeCapFlutes(model);
  const bottle = new Group();
  bottle.add(model);
  const bounds = new Box3().setFromObject(bottle);
  const liquidBounds = new Box3();
  const scale = product.height / (bounds.max.y - bounds.min.y);
  const center = bounds.getCenter(new Vector3());
  product.footprint = {width: (bounds.max.x - bounds.min.x) * scale, depth: (bounds.max.z - bounds.min.z) * scale};
  product.fluidMotion = new Vector3();
  product.lastTurn=0;
  product.lastPitch=0;
  product.fluidLight = {value: .56};
  bottle.traverse(mesh => {
    if (mesh.isMesh && /eau de parfum/i.test(mesh.material.name)) liquidBounds.expandByObject(mesh);
  });
  bottle.traverse(mesh => {
    if (!mesh.isMesh) return;
    const material = mesh.material;
    if (/eau de parfum/i.test(material.name)) {
      // The authored mesh defines the fill level and footprint. Its optical volume is evaluated in the glass pass.
      mesh.visible = false;
    } else if (/clear.*cap crystal/i.test(material.name)) {
      material.color.set(product.key === 'bleu' ? '#eff7ff' : '#fff8e8');
      material.attenuationColor = new Color(product.key === 'bleu' ? '#e2f0ff' : '#fff0d5');
      material.attenuationDistance = 2.2;
      material.transmission = .988;
      material.thickness = .022;
      material.ior = 1.49;
      material.roughness = .028;
      material.envMapIntensity = 1.55;
    } else if (/crystal/i.test(material.name)) {
      material.color.set(product.glass).lerp(new Color('#ffffff'),.54);
      material.attenuationColor = new Color(product.absorption);
      material.attenuationDistance = product.distance*1.7;
      material.transmission = .986;
      material.thickness = product.thickness*1.45;
      material.ior = 1.512;
      material.roughness = .018;
      material.clearcoat = .35;
      material.clearcoatRoughness = .025;
      material.envMapIntensity = 1.65;
      material.side = DoubleSide;
      if (!liquidBounds.isEmpty()){
        const cavity=liquidBounds.clone();
        cavity.max.y=new Box3().setFromObject(mesh).max.y;
        // Heights enclosing 95% of each flacon, integrated from 160 horizontal body sections.
        const levels={galet:.88661,rose:.94172,iris:.90881,terre:.92150,nacre:.84475};
        addLiquidRefraction(mesh,cavity,product,levels[product.key]);
      }
    } else if (/satin bronze plaque|champagne raised type/i.test(material.name)) {
      const isPlaque = /plaque/i.test(material.name);
      material.envMapIntensity = isPlaque ? 2.1 : 2.6;
      if (isPlaque) {
        material.bumpMap = satinMap;
        material.bumpScale = .0007;
      }
    } else if (/(print|label)/i.test(material.name) && material.map) {
      material.map.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
      material.map.colorSpace = SRGBColorSpace;
      // Keep printed ink legible and equally exposed under every product spotlight.
      mesh.material = new MeshBasicMaterial({
        name: material.name, map: material.map, alphaTest: material.alphaTest, color: '#fffef9', toneMapped: false,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
      });
    } else if (/brushed champagne/i.test(material.name) && ['terre','iris'].includes(product.key)){
      material.roughness=product.key==='iris'?.22:.39;
      material.metalness=.98;
      material.envMapIntensity=1.48;
      material.onBeforeCompile=shader=>{
        shader.vertexShader='varying vec2 machiningUv;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n machiningUv=uv;');
        shader.fragmentShader='varying vec2 machiningUv;\n'+shader.fragmentShader.replace('#include <roughnessmap_fragment>',
          '#include <roughnessmap_fragment>\n float grain=sin(machiningUv.y*290.0+sin(machiningUv.x*38.0)*.6); roughnessFactor+=.07*grain*(1.0-smoothstep(.3,2.0,fwidth(machiningUv.y)*290.0));');
      };
    } else if (/atomizer tube/i.test(material.name)) {
      // Leave a muted highlight on the dip tube in the solid pass refracted by the shell.
      material.transmission = 0;
      material.color.set('#64605d');
      material.roughness = .31;
    } else if (/pearl|lacquer|cap/i.test(material.name)) {
      material.bumpMap = satinMap;
      material.bumpScale = .00013;
      material.envMapIntensity = .83;
      if(product.key==='galet' && /cap|pearl/i.test(material.name)){
        material.color.set('#f4f1e9'); material.roughness=.26; material.metalness=.14;
      }
    }
  });

  bottle.position.copy(center).multiplyScalar(-scale);
  bottle.scale.setScalar(scale);
  bindLiquidCamera(bottle);

  const group = new Group();
  group.position.set(product.x, product.y, product.z);
  const pivot = new Group();
  pivot.position.y = product.height / 2 + hoverGap;
  pivot.add(bottle);
  const radius = product.key === 'galet' ? 1.13 : 1.05;
  const shadow = new Mesh(new PlaneGeometry(radius*1.70,radius*1.65),
    new MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false,opacity:.78}));
  shadow.rotateX(-Math.PI/2);
  shadow.position.y=.012;
  group.add(pivot,shadow);
  product.shadow=shadow;
  product.refraction=addRefraction(group,product.tone,radius);
  scene.add(group);
  Object.assign(product,{group,pivot,bottle});
}


function viewAround({x, y, z}, radius, yaw, elevation, amount = 0) {
  return {
    x: x + Math.sin(yaw) * radius, y: y + elevation, z: z + Math.cos(yaw) * radius,
    aimX: x, aimY: y, aimZ: z, focus: amount
  };
}

function galleryFrame(aspect) {
  // Preserve the complete rock wall and a strip of nearly still reflection below.
  if(stacked){
    const radius=Math.max(16.9/(2*angle),9.6/(2*angle*aspect));
    return viewAround({x:0,y:3.65,z:.15},radius,0,.40);
  }
  const radius=Math.max(18.7,16.4/(2*angle*aspect));
  const aimY = .22 - radius * 2 * angle * (aspect<.80?.095:.12);
  const cameraY = aspect<.80 ? 1.1 : 1.65;
  return viewAround({x:0,y:aimY,z:-.60},radius,0,cameraY-aimY);
}

function productFrame(product,aspect,yaw=0,focus=1){
  // On phones the camera frames the glass, with the overhead fixture above the crop.
  if(stacked){
    const coverage=product.height>3.5?.54:.44;
    const framingScale = ['galet','nacre'].includes(product.key) ? 1 / .9 : 1;
    const radius=framingScale*Math.max(product.height/((2*angle)*coverage),product.footprint.width/(2*angle*aspect)*1.42);
    return viewAround({x:product.x,y:product.y+radius*2*angle*.15,z:product.z},radius,yaw*.13,.16,focus);
  }
  const radius=aspect<.80 ? Math.max(8.2, product.footprint.width/(2*angle*aspect)*1.18) : 12.2;
  const aimY=product.y+(aspect<.80?product.height*.44:BAY.height*.40);
  return viewAround({x:product.x,y:aimY,z:product.z},radius, yaw*.13,.21,focus);
}

function flyThrough(aspect, progress) {
  const flightOrder=Array.from(stage.querySelectorAll('.gallery-bay'),button=>button.dataset.go);
  const shots=[galleryFrame(aspect),...flightOrder.map(key=>
    productFrame(products.find(p=>p.key===key),aspect,0,.34))];
  const p=MathUtils.clamp(progress,0,1)*flightOrder.length;
  const index=Math.min(flightOrder.length-1,Math.floor(p));
  const t=MathUtils.smoothstep(p-index,0,1);
  const from=shots[index], to=shots[index+1];
  return Object.fromEntries(Object.keys(from).map(key=>[
    key,MathUtils.lerp(from[key],to[key],t)
  ]));
}


function frame() {
  const selected = products.find(product => product.key === stage.dataset.state);
  if (selected) return productFrame(selected, camera.aspect, 0, 1);
  const progress = Number(stage.dataset.progress || 0);
  return flyThrough(camera.aspect, reducedMotion.matches ? Math.round(progress * products.length) / products.length : progress);
}

function spin(key) {
  const product = products.find(item => item.key === key);
  if (!product || reducedMotion.matches) return;
  if (product.spin && performance.now() - product.spin.started < spinDuration) return;
  product.spin = {started: performance.now()};
}

function spinAngle(product, time) {
  if (!product.spin) return 0;
  const t = MathUtils.clamp((time - product.spin.started) / spinDuration, 0, 1);
  if (t >= 1) {
    product.spin = null;
    return 0;
  }
  return MathUtils.smoothstep(t, 0, 1) * Math.PI * 2;
}

function resize() {
  const container = mount;
  const nextWidth = container.clientWidth;
  const nextHeight = container.clientHeight;
  if (!nextWidth || !nextHeight || (width === nextWidth && height === nextHeight)) return;
  if(stacked!==phoneLayout.matches){
    layouts.set(stacked,shelves);
    scene.remove(shelves);
    stacked=phoneLayout.matches;
    placeProducts();
    shelves=layouts.get(stacked) || createWall();
    renderer.shadowMap.needsUpdate=true;
    scene.add(shelves);
    transition=null;shot=null;
  }
  width = nextWidth;
  height = nextHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  const compact = width <= 700;
  const pixelBudget = compact ? 2_000_000 : 3_000_000;
  const ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(pixelBudget / (width * height)));
  renderer.setPixelRatio(ratio);
  renderer.setSize(width, height, false);
}

function updateHits() {
  camera.updateMatrixWorld();
  for (const product of products) {
    if (!product.button) continue;
    worldPoint.copy(product.pivot.position).add(product.group.position);
    const distance = camera.position.distanceTo(worldPoint);
    projected.copy(worldPoint).project(camera);
    product.button.style.left = ((projected.x + 1) * 50) + '%';
    product.button.style.top = ((1 - projected.y) * 50) + '%';
    const halfWidth = Math.min(BAY.width*.48, product.footprint.width*.60);
    const hitWidth = Math.min(camera.aspect < .82 ? width * .31 : 245,
      width * halfWidth / (distance * angle * camera.aspect));
    product.button.style.width = hitWidth + 'px';
    product.button.style.height = (height * (product.height + .18) / (2 * angle * distance)) + 'px';
    product.button.style.zIndex = String(Math.max(0, Math.round(105 - distance * 3)));
    product.button.hidden = Math.abs(projected.x) > 1.18 || Math.abs(projected.y) > 1.18 || projected.z > 1;
    if (stage.dataset.state === product.key) {
      dragArea.style.setProperty('--drag-left', ((projected.x + 1) * 50) + '%');
      dragArea.style.setProperty('--drag-top', ((1 - projected.y) * 50) + '%');
      dragArea.style.setProperty('--drag-width', Math.max(hitWidth * 1.45, width * .32) + 'px');
      dragArea.style.setProperty('--drag-height', height * (product.height + .35) / (2 * angle * distance) + 'px');
    }
  }
}

function render(time) {
  if (document.hidden) return;
  if (stage.getBoundingClientRect().bottom <= 0) return;
  if (previousTime && time - previousTime < 27 && stage.dataset.state === 'gallery') return;
  resize();
  const dt = previousTime ? Math.min((time - previousTime) / 1000, .20) : .016;
  previousTime = time;
  const current = stage.dataset.state;
  if (current !== lastProduct) {
    manualTurn.x = manualTurn.y = 0;
    pointerStates.clear();
    transition=shot && !reducedMotion.matches?{from:{...shot},started:time}:null;
    lastProduct = current;
  }
  const next = frame();
  shot ??= {...next};
  if(transition){
    const t=Math.min(1,(time-transition.started)/1450);
    const phase=t*t*(3-2*t);
    for(const key of Object.keys(shot))shot[key]=MathUtils.lerp(transition.from[key],next[key],phase);
    if(t===1)transition=null;
  }else{
    for(const key of Object.keys(shot))shot[key]=reducedMotion.matches?next[key]:MathUtils.damp(shot[key],next[key],6.5,dt);
  }
  camera.position.set(shot.x, shot.y, shot.z);
  camera.lookAt(shot.aimX, shot.aimY, shot.aimZ);
  const seconds = time / 1000;
  const reach = reducedMotion.matches ? 0 : 1;
  lightingPointer.x = MathUtils.damp(lightingPointer.x, lightingPointer.targetX * reach, 3.8, dt);
  lightingPointer.y = MathUtils.damp(lightingPointer.y, lightingPointer.targetY * reach, 3.8, dt);
  const selectedProduct=products.find(product=>current===product.key);
  const inspection=shelves?.userData.inspection;
  if(inspection){
    inspection.intensity=selectedProduct?MathUtils.clamp(shot.focus,0,1)*116*whiteShelfGain*(lighting.selection/100):0;
    inspection.userData.selected=selectedProduct?.key??null;
    if(selectedProduct){
      inspection.position.set(selectedProduct.x-.12,selectedProduct.y+BAY.height-.12,-.59);
      inspection.target.position.set(selectedProduct.x+lightingPointer.x*.18,
        selectedProduct.y+selectedProduct.height*.94,.46+lightingPointer.y*.14);
    }
  }
  for (const [index, product] of products.entries()) {
    const selected = current === product.key;
    product.group.visible = current === 'gallery' || selected || Boolean(transition);
    const emphasis = selectedProduct === product ? MathUtils.clamp(shot.focus, 0, 1) : 0;
    const orbitX = 0;
    const orbitZ = 0;
    const turn = spinAngle(product, time) + (selected ? manualTurn.y : 0);
    const pitch = selected ? manualTurn.x : 0;
    const roll = 0;
    const rotatedDepth = product.footprint.width * Math.abs(Math.sin(turn))
      + product.footprint.depth * Math.abs(Math.cos(turn));
    const orbitY = Math.max(0, (Math.cos(pitch) - 1) * product.height / 2
      + Math.abs(Math.sin(pitch)) * rotatedDepth / 2);
    product.pivot.position.set(orbitX, product.height / 2 + hoverGap + orbitY, orbitZ);
    product.pivot.rotation.set(pitch, turn, roll);
    const deltaYaw=turn-product.lastTurn;
    const yawSpeed=Math.atan2(Math.sin(deltaYaw),Math.cos(deltaYaw))/Math.max(.008,dt);
    const pitchSpeed=(pitch-product.lastPitch)/Math.max(.008,dt);
    const lateral=MathUtils.clamp(-yawSpeed*.026,-.15,.15);
    const foreAft=MathUtils.clamp(-pitch*.60-pitchSpeed*.035,-.32,.32);
    product.fluidMotion.x=MathUtils.damp(product.fluidMotion.x,reach*lateral,5,dt);
    product.fluidMotion.y=MathUtils.damp(product.fluidMotion.y,reach*foreAft,5,dt);
    product.fluidMotion.z=seconds;
    product.lastTurn=turn;product.lastPitch=pitch;
    const glint = Math.sin(turn * 2 + pitch + lightingPointer.x * .38);
    product.fluidLight.value = .48 + emphasis * (1.02 + .28 * glint);
    product.shadow.position.x = orbitX + lightingPointer.x * -.06;
    product.shadow.position.z = orbitZ + .06;
    const contactScale = 1.03 + orbitY * .45;
    product.shadow.scale.set(product.shape[0] * contactScale, product.shape[1] * contactScale, 1);
    product.shadow.material.opacity = .72 - orbitY * 1.05;
    const otherFocus = current !== 'gallery' && !selected ? shot.focus : 0;
    const secondary = 1 - otherFocus * .81;
    const niche = shelves?.userData.lights.get(product.key);
    if (niche) {
      niche.overhead.intensity=(210+emphasis*134)*secondary*whiteShelfGain*(lighting.shelf/100);
      niche.spill.intensity=(15+emphasis*(20+8*glint))*secondary*colourBounceGain;
      niche.overhead.target.position.x=product.x+lightingPointer.x*.30;
      const drop=niche.overhead.position.y-niche.overhead.target.position.y;
      const tilt=Math.atan2(1.24,drop)+MathUtils.degToRad(lighting.aim);
      niche.overhead.target.position.z=niche.overhead.position.z-drop*Math.tan(tilt)+lightingPointer.y*.10;
      niche.spill.target.position.x=product.x+Math.sin(turn)*.25+lightingPointer.x*.22;
      niche.spill.target.position.y=product.y+product.height*.42+lightingPointer.y*.12;
      niche.beamPivot.rotation.z=-lightingPointer.x*.065;
      niche.beamPivot.rotation.x= .24+MathUtils.degToRad(lighting.aim)+lightingPointer.y*.025;
      niche.beam.material.opacity=(.38+emphasis*.065)*secondary*whiteShelfGain*(lighting.shelf/100);
      niche.halo.material.opacity=(.28+emphasis*.12)*secondary*whiteShelfGain*(lighting.shelf/100);
      for (const [side, patch] of niche.caustics.entries()) {
        const direction=side===0?-1:1;
        patch.material.opacity=(.17+emphasis*(.18+direction*.12*glint))*secondary*colourBounceGain;
        patch.position.z=-.37+emphasis*direction*glint*.20;
        patch.position.y=product.y+product.height*.37+lightingPointer.y*.03;
      }
      niche.tintedSides.emissiveIntensity=(.008+emphasis*.009)*secondary*colourBounceGain;
      niche.lens.material.color.set(selected?'#fffaf3':'#e6dcd2');
    }
    product.refraction.rotation.z = turn * .91;
    product.refraction.position.x = Math.sin(turn) * .15 + lightingPointer.x * .085;
    product.refraction.position.z = .26 + Math.cos(turn * 2) * .08;
    product.refraction.material.opacity = (.23 + emphasis * .15) * colourBounceGain * secondary * (.88 + .12 * Math.cos(turn * 2));
    if (water) {
      const {pools, poolColors} = water.material.uniforms;
      pools.value[index].set(product.x + lightingPointer.x * .12,
        1.0 + lightingPointer.y * .07, (.42 + emphasis * .62) * colourBounceGain * secondary);
      poolColors.value[index].set(product.tone);
    }
  }
  if (water) water.material.uniforms.clock.value = reducedMotion.matches ? 0 : seconds;
  updateHits();
  renderer.render(scene, camera);
  if (!presented) {
    presented = true;
    document.documentElement.classList.add('glb-live');
    window.dispatchEvent(new Event('perfume-ready'));
    if (stage.dataset.state !== 'gallery') spin(stage.dataset.state);
  }
}

function controls(element) {
  let ignoreReturnClick=false;
  function returnToCollection(){
    for(const product of products)product.spin=null;
    window.dispatchEvent(new Event('perfume-collection-request'));
  }
  // The compatibility click can be retargeted to a gallery bottle after the
  // drag surface disappears. Consume that one click before it can reopen it.
  for(const type of ['pointerdown','keydown'])stage.addEventListener(type,()=>{
    ignoreReturnClick=false;
  },{capture:true});
  stage.addEventListener('click',event=>{
    if(ignoreReturnClick){
      ignoreReturnClick=false;
      event.preventDefault();event.stopImmediatePropagation();
    }
  },{capture:true});
  element.addEventListener('pointerdown', event => {
    const product = products.find(item => item.key === stage.dataset.state);
    if (!product || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    product.spin = null;
    pointerStates.set(event.pointerId, {x:event.clientX,y:event.clientY,
      startX:event.clientX,startY:event.clientY,key:product.key,moved:false});
    if(pointerStates.size>1)for(const gesture of pointerStates.values())gesture.moved=true;
    element.setPointerCapture(event.pointerId);
  });
  element.addEventListener('pointermove', event => {
    const previous = pointerStates.get(event.pointerId);
    if (!previous) return;
    event.preventDefault();
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    previous.moved ||= Math.hypot(event.clientX-previous.startX,event.clientY-previous.startY)>8;
    previous.x=event.clientX;previous.y=event.clientY;
    if(!previous.moved)return;
    manualTurn.y += dx * .012;
    manualTurn.x = MathUtils.clamp(manualTurn.x + dy * .004, -.24, .24);
  });
  function release(event) {
    const gesture=pointerStates.get(event.pointerId);
    pointerStates.delete(event.pointerId);
    if(event.type==='pointerup' && gesture && !gesture.moved && stage.dataset.state===gesture.key){
      ignoreReturnClick=true;
      returnToCollection();
    }
  }
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    element.addEventListener(event, release);
  }
  element.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){
      event.preventDefault();event.stopPropagation();
      returnToCollection();
    }
  });
  element.addEventListener('wheel', event => {
    const product = products.find(item => item.key === stage.dataset.state);
    if (!product) return;
    event.preventDefault();
    product.spin = null;
    for(const gesture of pointerStates.values())gesture.moved=true;
    manualTurn.y += (event.deltaX + event.deltaY) * .006;
  }, {passive: false});
}

function fallback(error) {
  console.warn('3D showroom switched to image previews.', error);
  document.documentElement.classList.remove('glb-live');
  window.dispatchEvent(new Event('perfume-ready'));
  stage.removeEventListener('pointermove', trackLighting);
  stage.removeEventListener('pointerdown', trackLighting);
  stage.removeEventListener('pointerup', releaseLighting);
  stage.removeEventListener('pointerleave', centerLighting);
  stage.removeEventListener('pointercancel', centerLighting);
  renderer?.setAnimationLoop(null);
  renderer?.domElement.remove();
  studioReflection?.dispose();
  water?.dispose();
  renderer?.dispose();
  delete window.Perfume3D;
}

function reflectionPanels(environment) {
  const panels = [
    {size: [2.2, 5.1], position: [-3.3, 2.4, 2.9], color: '#fff4e9', energy: 5.4},
    {size: [.71, 4.1], position: [4.2, .65, 2.35], color: '#f2f4ff', energy: 1.65},
    {size: [3.2, 1.0], position: [.25, 4.25, .6], color: '#fff5ec', energy: 2.75}
  ];
  for (const {size, position, color, energy} of panels) {
    const light = new Mesh(new PlaneGeometry(...size),
      new MeshBasicMaterial({color: new Color(color).multiplyScalar(energy), toneMapped: false}));
    light.position.set(...position);
    light.lookAt(0, 0, 0);
    environment.add(light);
  }
}

function trackLighting(event) {
  const rect = (stage.dataset.state === 'gallery' ? stage : dragArea).getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  lightingPointer.targetX = MathUtils.clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
  lightingPointer.targetY = MathUtils.clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
}

function centerLighting() {
  lightingPointer.targetX = lightingPointer.targetY = 0;
}

function releaseLighting(event) {
  if (event.pointerType !== 'mouse') centerLighting();
}

async function start() {
  try {
    renderer = new WebGLRenderer({alpha: true, antialias: true, powerPreference: 'high-performance'});
    renderer.debug.onShaderError = () => { throw new Error('The 3D material could not compile.'); };
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = .98;
    renderer.transmissionResolutionScale = innerWidth <= 700 ? .85 : 1;
    const studio = new Scene();
    studio.background=new Color(.075,.070,.083);
    reflectionPanels(studio);
    const pmrem = new PMREMGenerator(renderer);
    studioReflection = pmrem.fromScene(studio, .035);
    pmrem.dispose();
    studio.traverse(item=>{item.geometry?.dispose();item.material?.dispose();});
    scene.environment = studioReflection.texture;
    scene.environmentIntensity = .49;
    scene.add(new AmbientLight('#d4d7ed',.026));
    // Grazing incidence exposes the left flanks of fractures across the facade.
    const key=addSpot(scene,{color:'#e4e2f3',intensity:1500,
      position:[-21,13.5,6.5],look:[-5,2,.9],spread:.77});
    key.penumbra=.95;key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);
    key.shadow.camera.near=1;key.shadow.camera.far=46;
    key.shadow.bias=-.00035;key.shadow.normalBias=.025;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.autoUpdate=false;
    renderer.shadowMap.needsUpdate=true;
    rockMap = await loadStoneTexture();
    shelves=createWall();

    water = makeWater(renderer, innerWidth <= 700);
    scene.add(water);
    const loader = new GLTFLoader();
    await Promise.all(products.map(product => loadBottle(product, loader)));
    for (const product of products) product.button = document.querySelector('.gallery-bay.' + product.key);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      fallback(event);
    }, {once: true});
    controls(dragArea);
    mount.appendChild(renderer.domElement);
    stage.addEventListener('pointermove', trackLighting, {passive: true});
    stage.addEventListener('pointerdown', trackLighting, {passive: true});
    stage.addEventListener('pointerup', releaseLighting);
    stage.addEventListener('pointerleave', centerLighting);
    stage.addEventListener('pointercancel', centerLighting);
    window.Perfume3D = {spin, setLighting(values){
      const moved=lighting.distance!==values.distance;
      Object.assign(lighting,values);
      key.intensity=1500*lighting.key/100;
      if(moved){
        const scale=lighting.distance/100;
        key.position.set(-5-16*scale,2+11.5*scale,.9+5.6*scale);
        key.shadow.camera.far=46*Math.max(1,scale);
        key.shadow.camera.updateProjectionMatrix();
        renderer.shadowMap.needsUpdate=true;
      }
    }};
    renderer.setAnimationLoop(time => {
      try {
        render(time);
      } catch (error) {
        fallback(error);
      }
    });
  } catch (error) {
    fallback(error);
  }
}

start();
