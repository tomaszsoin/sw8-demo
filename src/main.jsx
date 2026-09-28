import React,{useEffect,useLayoutEffect,useMemo,useRef,useState}from'react'
import{createRoot}from'react-dom/client'
import{Canvas,useFrame,useThree}from'@react-three/fiber'
import{OrbitControls}from'@react-three/drei'
import*as THREE from'three'
import{SW8_AREAS}from'./sw8Data.js'
import'./styles.css'

const AREAS=SW8_AREAS.map(a=>a.name)
const INITIAL=[3,5,4,2,4,3,5,3],MAX=6
const MOBILE=typeof window!=='undefined'&&matchMedia('(max-width:700px)').matches
const INNER=MOBILE?1.5:1.9,OUTER=MOBILE?2.72:3.65,H=MOBILE?1.02:.82,STEP=MOBILE?1.045:.845
const MAX_DIST=MOBILE?26:27,NODE_R=OUTER+.86,OUTER_RING=NODE_R,BRAND='#153AC7'
const PALE_BLUE='#f2f6ff'

function blockCompletion(area,level,progress){
 if(level>=progress[area])return 0
 const depth=progress[area]-level
 return THREE.MathUtils.clamp(.38+depth*.18,.56,1)
}
function completionColor(value){
 const completion=THREE.MathUtils.clamp(value,0,1)
 const tint=THREE.MathUtils.lerp(.20,.78,completion)
 return new THREE.Color(PALE_BLUE).lerp(new THREE.Color(BRAND),tint)
}

const vertex=`
attribute float instanceHover;
varying vec3 vN;varying vec3 vW;varying float vY;varying vec3 vObj;varying float vHover;
void main(){
 vec4 world=modelMatrix*instanceMatrix*vec4(position,1.0);
 vW=world.xyz;vN=normalize(mat3(modelMatrix*instanceMatrix)*normal);vY=position.y;vObj=position;vHover=instanceHover;
 gl_Position=projectionMatrix*viewMatrix*world;
}`
const fragment=`
uniform vec3 uBlue;uniform vec3 uBrand;uniform vec3 uIce;uniform vec3 uLight;uniform float uOpacity;uniform float uGhost;
varying vec3 vN;varying vec3 vW;varying float vY;varying vec3 vObj;varying float vHover;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
void main(){
 vec3 N=normalize(vN),V=normalize(cameraPosition-vW),L=normalize(uLight);
 float ndv=max(dot(N,V),0.0),fres=pow(1.0-ndv,3.55),diffuse=max(dot(N,L),0.0);
 float top=smoothstep(.04,.96,vY),edge=smoothstep(.09,.91,fres),facing=smoothstep(.14,.90,ndv);
 float n=hash(floor(vObj*32.0))*2.0-1.0,glow=pow(diffuse,3.0),band=.5+.5*sin(vW.y*2.9+vW.x*.31-vW.z*.22);
 vec3 col;
 if(uGhost>.5){col=mix(vec3(.955,.958,.968),uBlue,.075);col=mix(col,vec3(1.0),top*.08+edge*.11);}
 else{col=min(vec3(1.0),uBlue*(.98+diffuse*.18));col=mix(col,uIce,top*.11+edge*.20);col+=uBlue*(glow*.045+band*.012);col+=n*.007;}
 if(vHover>.01){
  float h=smoothstep(0.0,1.0,vHover);
  if(uGhost>.5){vec3 ghostHover=mix(vec3(.91,.93,.98),uBrand,.34);col=mix(col,ghostHover,.82*h);}
  else{vec3 brandLift=min(vec3(1.0),uBrand*1.18+vec3(.018,.028,.075));col=mix(col,brandLift,.58*h);}
 }
 float alpha=uOpacity*(.70+edge*.22+facing*.04);alpha+=vHover*(uGhost>.5?.16:.045);
 gl_FragColor=vec4(col,alpha);
}`

function makeGeometry(){
 const shape=new THREE.Shape(),a0=-Math.PI/8+.006,a1=Math.PI/8-.006
 shape.moveTo(Math.cos(a0)*OUTER,Math.sin(a0)*OUTER);shape.absarc(0,0,OUTER,a0,a1,false)
 shape.lineTo(Math.cos(a1)*INNER,Math.sin(a1)*INNER);shape.absarc(0,0,INNER,a1,a0,true);shape.closePath()
 const g=new THREE.ExtrudeGeometry(shape,{depth:H,bevelEnabled:false,curveSegments:MOBILE?20:30})
 g.rotateX(-Math.PI/2);g.computeVertexNormals();g.setAttribute('instanceHover',new THREE.BufferAttribute(new Float32Array(g.getAttribute('position').count),1));return g
}
function makeInstancedGeometry(){const g=makeGeometry();g.setAttribute('instanceHover',new THREE.InstancedBufferAttribute(new Float32Array(48),1));return g}

function makeGhostOutlineGeometry(progress){
 const positions=[],seen=new Set(),arcSteps=MOBILE?10:14,a0=-Math.PI/8+.006,a1=Math.PI/8-.006
 const keyPoint=(x,y,z)=>`${Math.round(x*10000)},${Math.round(y*10000)},${Math.round(z*10000)}`
 const addSegment=(x1,y1,z1,x2,y2,z2)=>{const p1=keyPoint(x1,y1,z1),p2=keyPoint(x2,y2,z2),key=p1<p2?`${p1}|${p2}`:`${p2}|${p1}`;if(seen.has(key))return;seen.add(key);positions.push(x1,y1,z1,x2,y2,z2)}
 const point=(r,a,y)=>[Math.cos(a)*r,y,Math.sin(a)*r]
 for(let area=0;area<8;area++)for(let level=progress[area];level<MAX;level++){
  const center=area*Math.PI/4,start=center+a0,end=center+a1,y0=level*STEP,y1=y0+H
  const drawBottom=level===progress[area]
  for(const r of[INNER,OUTER]){
   const ys=drawBottom?[y0,y1]:[y1]
   for(const y of ys)for(let s=0;s<arcSteps;s++){
    const aa=THREE.MathUtils.lerp(start,end,s/arcSteps),ab=THREE.MathUtils.lerp(start,end,(s+1)/arcSteps)
    addSegment(...point(r,aa,y),...point(r,ab,y))
   }
  }
  const inner0=point(INNER,start,y0),outer0=point(OUTER,start,y0),inner1=point(INNER,start,y1),outer1=point(OUTER,start,y1)
  if(drawBottom)addSegment(...inner0,...outer0)
  addSegment(...inner1,...outer1);addSegment(...inner0,...inner1);addSegment(...outer0,...outer1)
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));return g
}

function makeActiveGridGeometry(progress){
 const positions=[],arcSteps=MOBILE?7:10,a0=-Math.PI/8+.012,a1=Math.PI/8-.012
 const point=(r,a,y)=>[Math.cos(a)*r,y,Math.sin(a)*r]
 const add=(a,b)=>positions.push(...a,...b)
 for(let area=0;area<8;area++)for(let level=0;level<progress[area];level++){
  const center=area*Math.PI/4,start=center+a0,end=center+a1,y0=level*STEP+.01,y1=y0+H-.02,ym=(y0+y1)/2,rm=(INNER+OUTER)/2
  for(const r of[INNER+.012,OUTER-.012])for(let s=0;s<arcSteps;s++){
   const aa=THREE.MathUtils.lerp(start,end,s/arcSteps),ab=THREE.MathUtils.lerp(start,end,(s+1)/arcSteps)
   add(point(r,aa,ym),point(r,ab,ym))
  }
  add(point(INNER+.015,center,y0),point(INNER+.015,center,y1))
  add(point(OUTER-.015,center,y0),point(OUTER-.015,center,y1))
  add(point(INNER+.02,center,y1+.003),point(OUTER-.02,center,y1+.003))
  for(let s=0;s<arcSteps;s++){
   const aa=THREE.MathUtils.lerp(start,end,s/arcSteps),ab=THREE.MathUtils.lerp(start,end,(s+1)/arcSteps)
   add(point(rm,aa,y1+.003),point(rm,ab,y1+.003))
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));return g
}

function glassMaterial(ghost=false){return new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:!ghost,side:THREE.DoubleSide,uniforms:{uBlue:{value:new THREE.Color(ghost?'#d6d9e3':BRAND)},uBrand:{value:new THREE.Color(BRAND)},uIce:{value:new THREE.Color('#ffffff')},uLight:{value:new THREE.Vector3(-4,10,7)},uOpacity:{value:ghost?0:.77},uGhost:{value:ghost?1:0}}})}
function activeGlassMaterial(transition=false){return new THREE.MeshPhysicalMaterial({
 color:'#ffffff',metalness:0,roughness:MOBILE?.42:.31,transmission:MOBILE?.62:.78,thickness:MOBILE?.34:.42,ior:1.18,
 attenuationColor:new THREE.Color('#eef4ff'),attenuationDistance:18,clearcoat:.38,clearcoatRoughness:.30,
 specularIntensity:.90,specularColor:new THREE.Color('#ffffff'),emissive:new THREE.Color('#000000'),emissiveIntensity:0,
 side:THREE.DoubleSide,depthWrite:!transition,transparent:transition,opacity:transition?1:1
})}

function GlassTower({progress,transitions,highlighted,setHovered,setSelected}){
 const active=useRef(),ghost=useRef(),activeMap=useRef([]),ghostMap=useRef([])
 const activeGeo=useMemo(makeInstancedGeometry,[]),ghostGeo=useMemo(makeInstancedGeometry,[]),activeMat=useMemo(()=>activeGlassMaterial(false),[]),ghostMat=useMemo(()=>glassMaterial(true),[])
 const hoverColor=useMemo(()=>new THREE.Color('#2f63ff'),[]),{invalidate}=useThree()
 useLayoutEffect(()=>{
  const skipped=new Set(transitions.map(t=>`${t.area}:${t.level}`)),m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1),axis=new THREE.Vector3(0,1,0)
  let ai=0,gi=0;activeMap.current=[];ghostMap.current=[]
  for(let area=0;area<8;area++)for(let level=0;level<MAX;level++){
   if(skipped.has(`${area}:${level}`))continue
   p.set(0,level*STEP,0);q.setFromAxisAngle(axis,area*Math.PI/4);m.compose(p,q,s)
   if(level<progress[area]){
    const completion=blockCompletion(area,level,progress),color=completionColor(completion)
    active.current.setMatrixAt(ai,m);active.current.setColorAt(ai,color);activeMap.current[ai]={area,level,active:true,completion};ai++
   }else{ghost.current.setMatrixAt(gi,m);ghostMap.current[gi]={area,level,active:false,completion:0};gi++}
  }
  active.current.count=ai;ghost.current.count=gi;active.current.instanceMatrix.needsUpdate=true;ghost.current.instanceMatrix.needsUpdate=true
  if(active.current.instanceColor)active.current.instanceColor.needsUpdate=true
  invalidate()
 },[progress,transitions,invalidate])
 useEffect(()=>{
  if(active.current){
   for(let i=0;i<active.current.count;i++)active.current.setColorAt(i,completionColor(activeMap.current[i]?.completion||1))
   if(highlighted?.active){const idx=activeMap.current.findIndex(m=>m.area===highlighted.area&&m.level===highlighted.level);if(idx>=0)active.current.setColorAt(idx,hoverColor)}
   if(active.current.instanceColor)active.current.instanceColor.needsUpdate=true
  }
  const ghostHover=ghostGeo.getAttribute('instanceHover');ghostHover.array.fill(0)
  if(highlighted&&!highlighted.active){const idx=ghostMap.current.findIndex(m=>m.area===highlighted.area&&m.level===highlighted.level);if(idx>=0)ghostHover.setX(idx,1)}
  ghostHover.needsUpdate=true;invalidate()
 },[highlighted,progress,transitions,ghostGeo,hoverColor,invalidate])
 const hover=(map,e)=>{e.stopPropagation();const meta=map.current[e.instanceId];if(meta)setHovered(prev=>prev&&prev.area===meta.area&&prev.level===meta.level&&prev.active===meta.active?prev:meta)}
 const select=(map,e)=>{e.stopPropagation();const meta=map.current[e.instanceId];if(meta)setSelected({...meta})}
 const leave=e=>{e.stopPropagation();setHovered(null)}
 return<><instancedMesh ref={ghost} args={[ghostGeo,ghostMat,48]} frustumCulled={false} onPointerMove={e=>hover(ghostMap,e)} onPointerOut={leave} onClick={e=>select(ghostMap,e)}/><instancedMesh ref={active} args={[activeGeo,activeMat,48]} frustumCulled={false} castShadow onPointerMove={e=>hover(activeMap,e)} onPointerOut={leave} onClick={e=>select(activeMap,e)}/></>
}

function ActiveGridLines({progress}){const geo=useMemo(()=>makeActiveGridGeometry(progress),[progress]);useEffect(()=>()=>geo.dispose(),[geo]);return<lineSegments geometry={geo} raycast={()=>{}} frustumCulled={false} renderOrder={2}><lineBasicMaterial color="#dce9ff" transparent opacity={.14} depthWrite={false}/></lineSegments>}
function GhostOutlines({progress}){const ref=useRef(),geo=useMemo(()=>makeGhostOutlineGeometry(progress),[progress]);useLayoutEffect(()=>{if(ref.current)ref.current.computeLineDistances()},[geo]);useEffect(()=>()=>geo.dispose(),[geo]);return<lineSegments ref={ref} geometry={geo} raycast={()=>{}} frustumCulled={false} renderOrder={3}><lineDashedMaterial color="#8b919d" transparent opacity={.22} depthWrite={false} toneMapped={false} dashSize={.07} gapSize={.075}/></lineSegments>}

function TransitionBlock({transition}){
 const geo=useMemo(makeGeometry,[]),mat=useMemo(()=>{const m=activeGlassMaterial(true);m.color.copy(completionColor(.62));m.opacity=transition.type==='in'?0:1;return m},[transition.id,transition.type]),{invalidate}=useThree()
 useFrame(()=>{const raw=Math.min(1,(performance.now()-transition.startedAt)/transition.duration),t=raw*raw*(3-2*raw),alpha=transition.type==='in'?t:1-t;mat.opacity=Math.max(0,Math.min(1,alpha));invalidate()})
 return<mesh geometry={geo} material={mat} position={[0,transition.level*STEP,0]} rotation={[0,transition.area*Math.PI/4,0]} castShadow raycast={()=>{}}/>
}
function TransitionBlocks({transitions}){return<>{transitions.map(t=><TransitionBlock key={t.id} transition={t}/>)}</>}

function HudTracker({labels,lines}){
 const{camera,size}=useThree(),anchors=useMemo(()=>Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return new THREE.Vector3(Math.cos(a)*NODE_R,.05,Math.sin(a)*NODE_R)}),[]),center=useMemo(()=>new THREE.Vector3(0,.05,0),[])
 useFrame(()=>{
  const c=center.clone().project(camera),cx=(c.x*.5+.5)*size.width,cy=(-c.y*.5+.5)*size.height,centerDist=camera.position.distanceTo(center),labelW=MOBILE?94:126,yPad=MOBILE?18:20,offset=MOBILE?18:24
  anchors.forEach((world,i)=>{const label=labels.current[i],line=lines.current[i];if(!label||!line)return;const projected=world.clone().project(camera),ax=(projected.x*.5+.5)*size.width,ay=(-projected.y*.5+.5)*size.height;let dx=ax-cx,dy=ay-cy;const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;const right=dx>=0;let lx=ax+dx*offset,ly=ay+dy*offset;if(right)lx=Math.max(8,Math.min(size.width-labelW-8,lx));else lx=Math.max(labelW+8,Math.min(size.width-8,lx));ly=Math.max(yPad,Math.min(size.height-yPad,ly));const front=camera.position.distanceTo(world)<centerDist;label.style.display='flex';label.style.opacity=front?'0.94':'0.54';label.style.textAlign=right?'left':'right';label.dataset.side=right?'right':'left';label.style.transform=`translate3d(${lx}px,${ly}px,0) translate(${right?'0':'-100%'},-50%)`;const ex=lx+(right?-6:6);line.style.display='block';line.style.opacity=front?'.54':'.24';line.setAttribute('x1',ax);line.setAttribute('y1',ay);line.setAttribute('x2',ex);line.setAttribute('y2',ly)})
 });return null
}

function Blueprint(){
 const rings=[INNER*.72,INNER,OUTER,OUTER+.42]
 return<group position={[0,.008,0]} raycast={()=>{}}>{rings.map((r,i)=><mesh key={r} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><ringGeometry args={[r-(i<3?.009:.006),r+(i<3?.009:.006),MOBILE?80:128]}/><meshBasicMaterial color={i===2?BRAND:'#9ca9bc'} transparent opacity={i===2?.26:i<3?.16:.10}/></mesh>)}{Array.from({length:8}).map((_,i)=>{const a=i*Math.PI/4,r1=INNER*.54,r2=NODE_R,x=Math.cos(a)*NODE_R,z=Math.sin(a)*NODE_R;return<group key={i}><mesh position={[Math.cos(a)*(r1+r2)/2,.014,Math.sin(a)*(r1+r2)/2]} rotation={[0,-a,0]} raycast={()=>{}}><boxGeometry args={[.006,.006,r2-r1]}/><meshBasicMaterial color={BRAND} transparent opacity={.15}/></mesh><mesh position={[x,.017,z]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><circleGeometry args={[.071,32]}/><meshBasicMaterial color="#f7f7f7" transparent opacity={.99}/></mesh><mesh position={[x,.019,z]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><ringGeometry args={[.076,.113,40]}/><meshBasicMaterial color={BRAND} transparent opacity={.90}/></mesh><mesh position={[x,.018,z]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><ringGeometry args={[.113,.119,40]}/><meshBasicMaterial color={BRAND} transparent opacity={.20}/></mesh></group>})}</group>
}

const dotVertex=`attribute float aAlpha;varying float vAlpha;uniform float uSize;void main(){vec4 mvPosition=modelViewMatrix*vec4(position,1.0);float perspective=20.0/max(11.0,-mvPosition.z);gl_PointSize=uSize*perspective;gl_Position=projectionMatrix*mvPosition;vAlpha=aAlpha;}`
const dotFragment=`varying float vAlpha;uniform vec3 uColor;void main(){float d=length(gl_PointCoord-vec2(.5));float disc=1.0-smoothstep(.24,.50,d);if(d>.5)discard;gl_FragColor=vec4(uColor,disc*vAlpha);}`
function makeDotFieldGeometry(){
 const positions=[],alphas=[],extent=MOBILE?12:15,spacing=MOBILE?.88:.78,fadeStart=MOBILE?6.8:8.7
 for(let x=-extent;x<=extent;x+=spacing)for(let z=-extent;z<=extent;z+=spacing){const r=Math.hypot(x,z),raw=Math.max(0,Math.min(1,(r-fadeStart)/(extent-fadeStart))),smooth=raw*raw*(3-2*raw),fade=(1-smooth)*(MOBILE?.34:.39);if(fade>.022){positions.push(x,-.018,z);alphas.push(fade)}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('aAlpha',new THREE.Float32BufferAttribute(alphas,1));g.computeBoundingSphere();return g
}
function GroundDotField(){const geo=useMemo(makeDotFieldGeometry,[]),mat=useMemo(()=>new THREE.ShaderMaterial({vertexShader:dotVertex,fragmentShader:dotFragment,transparent:true,depthWrite:false,depthTest:true,uniforms:{uColor:{value:new THREE.Color('#7f8997')},uSize:{value:MOBILE?3.25:3.0}}}),[]);return<points geometry={geo} material={mat} raycast={()=>{}} renderOrder={-2}/>}

function Floor(){return<mesh rotation={[-Math.PI/2,0,0]} position={[0,-.035,0]} raycast={()=>{}}><ringGeometry args={[OUTER_RING-.012,OUTER_RING+.012,128]}/><meshBasicMaterial color="#9097a2" transparent opacity={.48}/></mesh>}
const aoVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`
const aoFragment=`varying vec2 vUv;void main(){float r=distance(vUv,vec2(.5))*2.0;float ring=smoothstep(.26,.50,r)*(1.0-smoothstep(.64,.96,r));float broad=1.0-smoothstep(.28,1.0,r);float a=ring*.085+broad*.018;gl_FragColor=vec4(vec3(.12,.14,.18),a);}`
function AmbientOcclusion(){return<mesh rotation={[-Math.PI/2,0,0]} position={[0,-.041,0]} raycast={()=>{}} renderOrder={-1}><circleGeometry args={[OUTER*1.55,128]}/><shaderMaterial vertexShader={aoVertex} fragmentShader={aoFragment} transparent depthWrite={false} depthTest={false}/></mesh>}
function ShadowReceiver(){return<mesh rotation={[-Math.PI/2,0,0]} position={[0,-.045,0]} receiveShadow raycast={()=>{}}><circleGeometry args={[OUTER*1.75,96]}/><shadowMaterial transparent opacity={.075}/></mesh>}

function CameraControls({targetY,rotating,speed,onUserStart,onUserEnd,detailOpen}){
 const controls=useRef(),offset=useRef(0),{camera,size,invalidate}=useThree(),desiredOffset=detailOpen?(MOBILE?size.width*.28:size.width*.17):0
 useEffect(()=>{invalidate()},[detailOpen,size.width,size.height,invalidate]);useEffect(()=>()=>{camera.clearViewOffset();camera.updateProjectionMatrix()},[camera])
 useFrame((_,delta)=>{const next=THREE.MathUtils.damp(offset.current,desiredOffset,4.15,delta),moving=Math.abs(next-offset.current)>.0005||Math.abs(next-desiredOffset)>.08;offset.current=next;if(Math.abs(offset.current)<.05&&!detailOpen){if(camera.view){camera.clearViewOffset();camera.updateProjectionMatrix()}}else{camera.setViewOffset(size.width,size.height,offset.current,0,size.width,size.height);camera.updateProjectionMatrix()}if(moving)invalidate()})
 return<OrbitControls ref={controls} makeDefault target={[0,targetY,0]} minDistance={MOBILE?12.5:9.5} maxDistance={MAX_DIST} enablePan={false} enableDamping={false} minPolarAngle={.72} maxPolarAngle={1.17} autoRotate={rotating} autoRotateSpeed={speed} onStart={onUserStart} onEnd={onUserEnd} onChange={invalidate}/>
}

function Scene({progress,transitions,highlighted,setHovered,setSelected,rotating,speed,onUserStart,onUserEnd,hudLabels,hudLines,detailOpen}){
 const targetY=MOBILE?2.55:2.25,target=new THREE.Vector3(0,targetY,0),dir=new THREE.Vector3(1,.46,1.04).normalize(),pos=target.clone().add(dir.multiplyScalar(MAX_DIST)),camera={position:pos.toArray(),fov:MOBILE?27:29}
 return<Canvas shadows dpr={MOBILE?[1,1.5]:[1,1.7]} gl={{antialias:true,powerPreference:'high-performance',alpha:true}} onCreated={({gl})=>{gl.setClearColor(0x000000,0);gl.shadowMap.type=THREE.PCFSoftShadowMap;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.06}} camera={camera} frameloop={rotating||transitions.length?'always':'demand'} onPointerMissed={()=>{setHovered(null);setSelected(null)}}><ambientLight intensity={.62}/><hemisphereLight args={['#ffffff','#dbe6f4',.58]}/><directionalLight castShadow position={[2.4,12.5,6.2]} intensity={1.45} color="#ffffff" shadow-mapSize-width={MOBILE?512:1024} shadow-mapSize-height={MOBILE?512:1024} shadow-camera-left={-7.5} shadow-camera-right={7.5} shadow-camera-top={7.5} shadow-camera-bottom={-7.5} shadow-camera-near={3} shadow-camera-far={25} shadow-bias={-.00008} shadow-normalBias={.018} shadow-radius={MOBILE?3.5:6.5}/><pointLight position={[0,5.2,9]} intensity={MOBILE?5.5:8.5} distance={25} decay={2} color="#ffffff"/><directionalLight position={[-4,6,-7]} intensity={.48} color="#8fc8ff"/><directionalLight position={[-5,8,4]} intensity={.46} color="#e5edff"/><GroundDotField/><ShadowReceiver/><Floor/><AmbientOcclusion/><Blueprint/><GlassTower progress={progress} transitions={transitions} highlighted={highlighted} setHovered={setHovered} setSelected={setSelected}/><ActiveGridLines progress={progress}/><GhostOutlines progress={progress}/><TransitionBlocks transitions={transitions}/><HudTracker labels={hudLabels} lines={hudLines}/><CameraControls targetY={targetY} rotating={rotating} speed={speed} onUserStart={onUserStart} onUserEnd={onUserEnd} detailOpen={detailOpen}/></Canvas>
}

function getSegmentInfo(block){const area=SW8_AREAS[block.area],item=area.visualBlocks[block.level];return{title:item[0],summary:item[1],foundation:!!item[2]}}
function DetailPanel({block,expanded,visible,onClose}){
 const safeBlock=block||{area:0,level:0,active:false},area=SW8_AREAS[safeBlock.area],segment=getSegmentInfo(safeBlock)
 return<div className={`hoverPanel ${visible?'isVisible':''} ${expanded?'isExpanded':''}`} aria-hidden={!visible}>
  <button className="detailClose" onClick={onClose} aria-label="Zamknij panel">×</button>
  <div className="hoverPanelMicro">OBSZAR {String(safeBlock.area+1).padStart(2,'0')} · SEGMENT {String(safeBlock.level+1).padStart(2,'0')}</div>
  <h3>{area.name}</h3>
  <div className="compactBlockInfo">{segment.foundation&&<div className="compactBlockLabel">FUNDAMENT</div>}<div className="compactBlockTitle">{segment.title}</div><p>{segment.summary}</p></div>
  <div className="hoverFacts"><span>Poziom <b>{safeBlock.level+1}/{MAX}</b></span><span>Stan <b>{safeBlock.active?'zbudowany':'niewypełniony'}</b></span><span>Elementy <b>{area.visualBlocks.length}</b></span></div>
  <div className="detailBody">
   <section className="detailSection"><div className="detailSectionLabel">Pytanie fundamentalne</div><p>{area.question}</p></section>
   <section className="detailSection"><div className="detailSectionLabel">Rezultat obszaru</div><p>{area.outcome}</p></section>
   <section className="detailSection"><div className="detailSectionHeader"><div className="detailSectionLabel">Elementy obszaru</div><span className="blockCount">{area.visualBlocks.length} poziomów</span></div><div className="strategicBlocks">{area.visualBlocks.map((item,i)=><div className="strategicBlockRow" key={item[0]}><div className="strategicBlockIndex">{String(i+1).padStart(2,'0')}</div><div className="strategicBlockContent"><div className="strategicBlockTitle">{item[0]} {item[2]&&<span>FUNDAMENT</span>}</div><div className="strategicBlockQuestion">{item[1]}</div></div></div>)}</div></section>
   <section className="detailSection completionCard"><div className="detailSectionLabel">Gotowość obszaru</div><p>{area.completion}</p></section>
  </div>
 </div>
}

function App(){
 const[progress,setProgress]=useState(INITIAL),[open,setOpen]=useState(false),[paused,setPaused]=useState(false),[interactionHold,setInteractionHold]=useState(false),[rotationSpeed,setRotationSpeed]=useState(.35),[demoRunning,setDemoRunning]=useState(false),[transitions,setTransitions]=useState([]),[hovered,setHovered]=useState(null),[selected,setSelected]=useState(null)
 const resumeTimer=useRef(null),demoToken=useRef(0),progressRef=useRef(INITIAL),transitionId=useRef(0),hudLabels=useRef([]),hudLines=useRef([])
 const rotating=!paused&&!interactionHold,detailBlock=selected||hovered,highlighted=hovered||selected
 useEffect(()=>{progressRef.current=progress},[progress]);useEffect(()=>{document.body.style.cursor=hovered?'pointer':'';return()=>{document.body.style.cursor=''}},[hovered])
 const update=(i,v)=>setProgress(p=>p.map((x,n)=>n===i?+v:x)),clearResume=()=>{if(resumeTimer.current){clearTimeout(resumeTimer.current);resumeTimer.current=null}},wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),cancelDemo=()=>{demoToken.current+=1;setDemoRunning(false);setTransitions([])}
 const handleUserStart=()=>{clearResume();setHovered(null);if(demoRunning)cancelDemo();if(!paused)setInteractionHold(true)},handleUserEnd=()=>{clearResume();if(!paused)resumeTimer.current=setTimeout(()=>setInteractionHold(false),10000)},togglePause=()=>{clearResume();if(paused){setPaused(false);setInteractionHold(false)}else{setPaused(true);setInteractionHold(false)}}
 const buildPath=(from,to)=>{const state=[...from],path=[];let cursor=0,guard=0;while(state.some((v,i)=>v!==to[i])&&guard<512){for(let n=0;n<8;n++){const i=(cursor+n)%8;if(state[i]!==to[i]){state[i]+=state[i]<to[i]?1:-1;path.push([...state]);cursor=(i+1)%8;break}}guard++}return path}
 const getChange=(from,to)=>{const area=from.findIndex((v,i)=>v!==to[i]);if(area<0)return null;const type=to[area]>from[area]?'in':'out',level=type==='in'?from[area]:to[area];return{area,level,type}}
 const runDemo=async()=>{if(demoRunning)return;const token=++demoToken.current,base=[...progressRef.current],zero=Array(8).fill(0),full=Array(8).fill(MAX),path=[...buildPath(base,zero),...buildPath(zero,full),...buildPath(full,base)];let current=[...base];setHovered(null);setSelected(null);setDemoRunning(true);for(const next of path){if(token!==demoToken.current)return;const change=getChange(current,next);if(!change)continue;const id=++transitionId.current,tr={...change,id,duration:145,startedAt:performance.now()};setTransitions(prev=>[...prev,tr]);setProgress(next);progressRef.current=next;current=[...next];setTimeout(()=>setTransitions(prev=>prev.filter(t=>t.id!==id)),tr.duration+25);await wait(56)}await wait(180);if(token===demoToken.current){setProgress(base);progressRef.current=base;setTransitions([]);setDemoRunning(false)}}
 useEffect(()=>()=>{clearResume();demoToken.current+=1},[])
 return<main className={selected?'detailOpen':''}><div className="backgroundFx"/><div className="visualStage"><div className="scene"><Scene progress={progress} transitions={transitions} highlighted={highlighted} setHovered={setHovered} setSelected={setSelected} rotating={rotating} speed={rotationSpeed} onUserStart={handleUserStart} onUserEnd={handleUserEnd} hudLabels={hudLabels} hudLines={hudLines} detailOpen={!!selected}/></div><div className="sceneGlow glowA"/><div className="sceneGlow glowB"/><div className="hudScreen" aria-hidden="true"><svg className="hudLeaders">{AREAS.map((_,i)=><line key={i} ref={el=>hudLines.current[i]=el}/>)}</svg>{AREAS.map((area,i)=><div className="hudLabel" key={area} ref={el=>hudLabels.current[i]=el}><div className="hudLabelNum">{String(i+1).padStart(2,'0')}</div><div className="hudLabelCopy"><strong>{area}</strong><span>POZIOM {progress[i]} / {MAX}</span><div className="hudLabelBars">{Array.from({length:MAX}).map((_,n)=><i key={n} className={n<progress[i]?'on':''}/>)}</div></div></div>)}</div></div>
 <header><div className="micro">SW8 / MODEL 27</div><h1>SW8<br/>Wizualizacja strategii</h1><p>8 obszarów. Każdy ukończony blok buduje kolejny poziom strategii.</p></header>{!detailBlock&&<div className="meta">FROSTED GLASS / HUD SYSTEM<br/>8 OBSZARÓW / 6 POZIOMÓW</div>}
 <DetailPanel block={detailBlock} expanded={!!selected} visible={!!detailBlock} onClose={()=>{setSelected(null);setHovered(null)}}/>
 <div className="bottomControls"><button className="pauseToggle" onClick={togglePause} aria-label={paused?'Włącz automatyczny obrót':'Zatrzymaj automatyczny obrót'} title={paused?'Play':'Pause'}>{paused?'▶':'Ⅱ'}</button><button className="controlToggle" onClick={()=>setOpen(!open)}>{open?'ZAMKNIJ':'STEROWANIE'}</button><button className={`demoToggle ${demoRunning?'isRunning':''}`} onClick={runDemo} disabled={demoRunning}>{demoRunning?'DEMO…':'DEMO'}</button></div>
 {open&&<aside><div className="buttons"><button onClick={()=>setProgress(Array(8).fill(MAX))}>Pełna wieża</button><button onClick={()=>setProgress(INITIAL)}>Reset</button></div><div className="speedControl"><div><span>AUTO OBRÓT</span><b>{rotationSpeed.toFixed(2)}×</b></div><input type="range" min="0.10" max="1.00" step="0.05" value={rotationSpeed} onInput={e=>setRotationSpeed(+e.currentTarget.value)} onChange={e=>setRotationSpeed(+e.currentTarget.value)}/><small>{paused?'Pauza trwała':interactionHold?'Wznowienie za 10 s':'Aktywny'}</small></div>{AREAS.map((a,i)=><label key={a}><span>{String(i+1).padStart(2,'0')} / {a}</span><input type="range" min="0" max={MAX} value={progress[i]} onInput={e=>update(i,e.currentTarget.value)} onChange={e=>update(i,e.currentTarget.value)}/><b>{progress[i]}/{MAX}</b></label>)}</aside>}
 <div className="hint">DRAG → OBRÓT · PINCH / WHEEL → ZOOM</div></main>
}
createRoot(document.getElementById('root')).render(<App/>)