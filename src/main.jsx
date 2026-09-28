import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './styles.css'

const AREAS=['Dlaczego?','Kto?','Do kogo?','W jakim kontekście?','Co?','Jak?','Gdzie?','Kiedy?']
const AREA_QUESTIONS=[
 'Dlaczego podejmujemy ten kierunek i po co firma istnieje?',
 'Kim jesteśmy jako marka i jaką tożsamość chcemy konsekwentnie wyrażać?',
 'Do kogo świadomie kierujemy ofertę?',
 'W jakiej przestrzeni rynkowej jesteśmy oceniani i jakie miejsce chcemy zajmować?',
 'Co konkretnie oferujemy i jaką zmianę / wartość obiecujemy?',
 'Jak prowadzimy odbiorcę od zainteresowania do decyzji i dalszej relacji?',
 'W jakich kanałach powinniśmy być obecni?',
 'Co robimy najpierw, co później i po czym wiemy, że można przejść dalej?'
]
const INITIAL=[3,5,4,2,4,3,5,3], MAX=6
const MOBILE=typeof window!=='undefined'&&matchMedia('(max-width:700px)').matches
const INNER=MOBILE?1.5:1.9, OUTER=MOBILE?2.72:3.65, H=MOBILE?1.02:.82, STEP=MOBILE?1.045:.845
const MAX_DIST=MOBILE?26:27
const NODE_R=OUTER+.86
const OUTER_RING=NODE_R
const BRAND='#153AC7'

const vertex=`
attribute float instanceHover;
varying vec3 vN;varying vec3 vW;varying float vY;varying vec3 vObj;varying float vHover;
void main(){
 vec4 world=modelMatrix*instanceMatrix*vec4(position,1.0);
 vW=world.xyz;
 vN=normalize(mat3(modelMatrix*instanceMatrix)*normal);
 vY=position.y;
 vObj=position;
 vHover=instanceHover;
 gl_Position=projectionMatrix*viewMatrix*world;
}`

const fragment=`
uniform vec3 uBlue;uniform vec3 uIce;uniform vec3 uLight;uniform float uOpacity;uniform float uGhost;
varying vec3 vN;varying vec3 vW;varying float vY;varying vec3 vObj;varying float vHover;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
void main(){
 vec3 N=normalize(vN),V=normalize(cameraPosition-vW),L=normalize(uLight);
 float ndv=max(dot(N,V),0.0),fres=pow(1.0-ndv,3.6),diffuse=max(dot(N,L),0.0);
 float top=smoothstep(.04,.96,vY),edge=smoothstep(.09,.91,fres),facing=smoothstep(.14,.90,ndv);
 float n=hash(floor(vObj*32.0))*2.0-1.0;
 float glow=pow(diffuse,3.0);
 float band=.5+.5*sin(vW.y*2.9+vW.x*.31-vW.z*.22);
 vec3 deep=vec3(.018,.055,.25);
 vec3 electric=vec3(.11,.32,.86);
 vec3 col=mix(deep,uBlue,.69+diffuse*.12);
 col=mix(col,electric,glow*.23+band*.035);
 col=mix(col,uIce,top*.29+edge*.45);
 col+=n*.010;
 col+=vec3(.025,.08,.28)*(1.0-top)*.045;
 if(uGhost>.5) col=mix(col,vec3(.972,.976,.986),.93);
 if(vHover>.01){
   vec3 lifted=min(vec3(1.0),col*1.16+vec3(.025,.045,.12));
   col=mix(col,lifted,smoothstep(0.0,1.0,vHover));
 }
 float alpha=uOpacity*(.61+edge*.31+facing*.05);
 alpha+=vHover*.055;
 gl_FragColor=vec4(col,alpha);
}`

function makeGeometry(){
 const shape=new THREE.Shape(),a0=-Math.PI/8+.006,a1=Math.PI/8-.006
 shape.moveTo(Math.cos(a0)*OUTER,Math.sin(a0)*OUTER)
 shape.absarc(0,0,OUTER,a0,a1,false)
 shape.lineTo(Math.cos(a1)*INNER,Math.sin(a1)*INNER)
 shape.absarc(0,0,INNER,a1,a0,true)
 shape.closePath()
 const g=new THREE.ExtrudeGeometry(shape,{depth:H,bevelEnabled:false,curveSegments:MOBILE?20:30})
 g.rotateX(-Math.PI/2);g.computeVertexNormals()
 g.setAttribute('instanceHover',new THREE.BufferAttribute(new Float32Array(g.getAttribute('position').count),1))
 return g
}

function makeInstancedGeometry(){
 const g=makeGeometry()
 g.setAttribute('instanceHover',new THREE.InstancedBufferAttribute(new Float32Array(48),1))
 return g
}

function makeAllOutlineGeometry(){
 const base=makeGeometry()
 const edges=new THREE.EdgesGeometry(base,24)
 const src=edges.getAttribute('position')
 const positions=new Float32Array(src.count*8*MAX*3)
 const v=new THREE.Vector3(),m=new THREE.Matrix4(),rot=new THREE.Matrix4(),move=new THREE.Matrix4()
 let o=0
 for(let area=0;area<8;area++)for(let level=0;level<MAX;level++){
  rot.makeRotationY(area*Math.PI/4)
  move.makeTranslation(0,level*STEP,0)
  m.multiplyMatrices(move,rot)
  for(let i=0;i<src.count;i++){
   v.fromBufferAttribute(src,i).applyMatrix4(m)
   positions[o++]=v.x;positions[o++]=v.y;positions[o++]=v.z
  }
 }
 base.dispose();edges.dispose()
 const g=new THREE.BufferGeometry()
 g.setAttribute('position',new THREE.BufferAttribute(positions,3))
 return g
}

function glassMaterial(ghost=false){
 return new THREE.ShaderMaterial({
  vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:!ghost,side:THREE.DoubleSide,
  uniforms:{
   uBlue:{value:new THREE.Color(ghost?'#d6d9e3':BRAND)},
   uIce:{value:new THREE.Color('#ffffff')},
   uLight:{value:new THREE.Vector3(-4,10,7)},
   uOpacity:{value:ghost?.050:.69},
   uGhost:{value:ghost?1:0}
  }
 })
}

function GlassTower({progress,transitions,hovered,setHovered}){
 const active=useRef(),ghost=useRef()
 const activeMap=useRef([]),ghostMap=useRef([])
 const activeGeo=useMemo(makeInstancedGeometry,[]),ghostGeo=useMemo(makeInstancedGeometry,[])
 const activeMat=useMemo(()=>glassMaterial(false),[]),ghostMat=useMemo(()=>glassMaterial(true),[])
 const {invalidate}=useThree()

 useLayoutEffect(()=>{
  const skipped=new Set(transitions.map(t=>`${t.area}:${t.level}`))
  const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1),axis=new THREE.Vector3(0,1,0)
  let ai=0,gi=0
  activeMap.current=[];ghostMap.current=[]
  for(let area=0;area<8;area++)for(let level=0;level<MAX;level++){
   if(skipped.has(`${area}:${level}`))continue
   p.set(0,level*STEP,0);q.setFromAxisAngle(axis,area*Math.PI/4);m.compose(p,q,s)
   const on=level<progress[area]
   if(on){
    active.current.setMatrixAt(ai,m)
    activeMap.current[ai]={area,level,active:true}
    ai++
   }else{
    ghost.current.setMatrixAt(gi,m)
    ghostMap.current[gi]={area,level,active:false}
    gi++
   }
  }
  active.current.count=ai;ghost.current.count=gi
  active.current.instanceMatrix.needsUpdate=true;ghost.current.instanceMatrix.needsUpdate=true
  invalidate()
 },[progress,transitions,invalidate])

 useEffect(()=>{
  const attr=activeGeo.getAttribute('instanceHover')
  attr.array.fill(0)
  if(hovered?.active){
   const idx=activeMap.current.findIndex(m=>m.area===hovered.area&&m.level===hovered.level)
   if(idx>=0)attr.setX(idx,1)
  }
  attr.needsUpdate=true
  invalidate()
 },[hovered,progress,transitions,activeGeo,invalidate])

 const hover=e=>{
  e.stopPropagation()
  const meta=activeMap.current[e.instanceId]
  if(!meta)return
  setHovered(prev=>prev&&prev.area===meta.area&&prev.level===meta.level?prev:meta)
 }
 const leave=e=>{e.stopPropagation();setHovered(null)}

 return <>
  <instancedMesh ref={ghost} args={[ghostGeo,ghostMat,48]} frustumCulled={false} raycast={()=>{}}/>
  <instancedMesh ref={active} args={[activeGeo,activeMat,48]} frustumCulled={false} onPointerMove={hover} onPointerOut={leave}/>
 </>
}

function BlockOutlines(){
 const geo=useMemo(makeAllOutlineGeometry,[])
 return <lineSegments geometry={geo} raycast={()=>{}} frustumCulled={false} renderOrder={3}>
  <lineBasicMaterial color="#8b919d" transparent opacity={.15} depthWrite={false} toneMapped={false}/>
 </lineSegments>
}

function TransitionBlock({transition}){
 const geo=useMemo(makeGeometry,[])
 const mat=useMemo(()=>{
  const m=glassMaterial(false)
  m.uniforms.uOpacity.value=transition.type==='in'?0:.69
  return m
 },[transition.id,transition.type])
 const {invalidate}=useThree()
 useFrame(()=>{
  const raw=Math.min(1,(performance.now()-transition.startedAt)/transition.duration)
  const t=raw*raw*(3-2*raw)
  const alpha=transition.type==='in'?t:1-t
  mat.uniforms.uOpacity.value=.69*Math.max(0,Math.min(1,alpha))
  invalidate()
 })
 return <mesh geometry={geo} position={[0,transition.level*STEP,0]} rotation={[0,transition.area*Math.PI/4,0]} raycast={()=>{}}>
  <primitive object={mat} attach="material"/>
 </mesh>
}

function TransitionBlocks({transitions}){return <>{transitions.map(t=><TransitionBlock key={t.id} transition={t}/>)}</>}

function HudTracker({labels,lines}){
 const {camera,size}=useThree()
 const anchors=useMemo(()=>Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return new THREE.Vector3(Math.cos(a)*NODE_R,.05,Math.sin(a)*NODE_R)}),[])
 const center=useMemo(()=>new THREE.Vector3(0,.05,0),[])

 useFrame(()=>{
  const c=center.clone().project(camera)
  const cx=(c.x*.5+.5)*size.width,cy=(-c.y*.5+.5)*size.height
  const centerDist=camera.position.distanceTo(center)
  const labelW=MOBILE?94:126
  const yPad=MOBILE?18:20
  const offset=MOBILE?18:24

  anchors.forEach((world,i)=>{
   const label=labels.current[i],line=lines.current[i]
   if(!label||!line)return
   const projected=world.clone().project(camera)
   const ax=(projected.x*.5+.5)*size.width,ay=(-projected.y*.5+.5)*size.height
   let dx=ax-cx,dy=ay-cy
   const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len
   const right=dx>=0
   let lx=ax+dx*offset,ly=ay+dy*offset

   if(right)lx=Math.max(8,Math.min(size.width-labelW-8,lx))
   else lx=Math.max(labelW+8,Math.min(size.width-8,lx))
   ly=Math.max(yPad,Math.min(size.height-yPad,ly))

   const front=camera.position.distanceTo(world)<centerDist
   label.style.display='flex'
   label.style.opacity=front?'0.94':'0.54'
   label.style.textAlign=right?'left':'right'
   label.dataset.side=right?'right':'left'
   label.style.transform=`translate3d(${lx}px,${ly}px,0) translate(${right?'0':'-100%'},-50%)`

   const ex=lx+(right?-6:6)
   line.style.display='block'
   line.style.opacity=front?'.54':'.24'
   line.setAttribute('x1',ax);line.setAttribute('y1',ay);line.setAttribute('x2',ex);line.setAttribute('y2',ly)
  })
 })
 return null
}

function Blueprint(){
 const rings=[INNER*.72,INNER,OUTER,OUTER+.42]
 return <group position={[0,.008,0]} raycast={()=>{}}>
  {rings.map((r,i)=><mesh key={r} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><ringGeometry args={[r-(i<3?.009:.006),r+(i<3?.009:.006),MOBILE?80:128]}/><meshBasicMaterial color={i===2?BRAND:'#9ca9bc'} transparent opacity={i===2?.26:i<3?.16:.10}/></mesh>)}
  {Array.from({length:8}).map((_,i)=>{const a=i*Math.PI/4,r1=INNER*.54,r2=NODE_R,x=Math.cos(a)*NODE_R,z=Math.sin(a)*NODE_R;return <group key={i}>
   <mesh position={[Math.cos(a)*(r1+r2)/2,.014,Math.sin(a)*(r1+r2)/2]} rotation={[0,-a,0]} raycast={()=>{}}><boxGeometry args={[.006,.006,r2-r1]}/><meshBasicMaterial color={BRAND} transparent opacity={.15}/></mesh>
   <mesh position={[x,.017,z]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><circleGeometry args={[.071,32]}/><meshBasicMaterial color="#f7f7f7" transparent opacity={.99}/></mesh>
   <mesh position={[x,.019,z]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><ringGeometry args={[.076,.113,40]}/><meshBasicMaterial color={BRAND} transparent opacity={.90}/></mesh>
   <mesh position={[x,.018,z]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><ringGeometry args={[.113,.119,40]}/><meshBasicMaterial color={BRAND} transparent opacity={.20}/></mesh>
  </group>})}
 </group>
}

function Floor(){return <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.035,0]} raycast={()=>{}}>
 <ringGeometry args={[OUTER_RING-.012,OUTER_RING+.012,128]}/>
 <meshBasicMaterial color="#9097a2" transparent opacity={.48}/>
 </mesh>}

const aoVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`
const aoFragment=`varying vec2 vUv;void main(){float r=distance(vUv,vec2(.5))*2.0;float ring=smoothstep(.26,.50,r)*(1.0-smoothstep(.64,.96,r));float broad=1.0-smoothstep(.28,1.0,r);float a=ring*.085+broad*.018;gl_FragColor=vec4(vec3(.12,.14,.18),a);}`

function AmbientOcclusion(){return <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.041,0]} raycast={()=>{}} renderOrder={-1}>
 <circleGeometry args={[OUTER*1.55,128]}/>
 <shaderMaterial vertexShader={aoVertex} fragmentShader={aoFragment} transparent depthWrite={false} depthTest={false}/>
 </mesh>}

function CameraControls({targetY,rotating,speed,onUserStart,onUserEnd}){
 const {invalidate}=useThree()
 return <OrbitControls
  makeDefault target={[0,targetY,0]} minDistance={MOBILE?12.5:9.5} maxDistance={MAX_DIST}
  enablePan={false} enableDamping={false} minPolarAngle={.72} maxPolarAngle={1.17}
  autoRotate={rotating} autoRotateSpeed={speed}
  onStart={onUserStart} onEnd={onUserEnd} onChange={invalidate}
 />
}

function Scene({progress,transitions,hovered,setHovered,rotating,speed,onUserStart,onUserEnd,hudLabels,hudLines}){
 const targetY=MOBILE?2.55:2.25
 const target=new THREE.Vector3(0,targetY,0),dir=new THREE.Vector3(1,.46,1.04).normalize(),pos=target.clone().add(dir.multiplyScalar(MAX_DIST))
 const camera={position:pos.toArray(),fov:MOBILE?27:29}
 return <Canvas dpr={MOBILE?[1,1.5]:[1,1.7]} gl={{antialias:true,powerPreference:'high-performance',alpha:true}} onCreated={({gl})=>gl.setClearColor(0x000000,0)} camera={camera} frameloop={rotating||transitions.length?'always':'demand'} onPointerMissed={()=>setHovered(null)}>
  <Floor/><AmbientOcclusion/><Blueprint/>
  <GlassTower progress={progress} transitions={transitions} hovered={hovered} setHovered={setHovered}/>
  <BlockOutlines/><TransitionBlocks transitions={transitions}/><HudTracker labels={hudLabels} lines={hudLines}/>
  <CameraControls targetY={targetY} rotating={rotating} speed={speed} onUserStart={onUserStart} onUserEnd={onUserEnd}/>
 </Canvas>
}

function App(){
 const[progress,setProgress]=useState(INITIAL),[open,setOpen]=useState(false)
 const[paused,setPaused]=useState(false),[interactionHold,setInteractionHold]=useState(false),[rotationSpeed,setRotationSpeed]=useState(.35)
 const[demoRunning,setDemoRunning]=useState(false),[transitions,setTransitions]=useState([]),[hovered,setHovered]=useState(null)
 const resumeTimer=useRef(null),demoToken=useRef(0),progressRef=useRef(INITIAL),transitionId=useRef(0)
 const hudLabels=useRef([]),hudLines=useRef([])
 const rotating=!paused&&!interactionHold

 useEffect(()=>{progressRef.current=progress},[progress])
 useEffect(()=>{document.body.style.cursor=hovered?'pointer':'';return()=>{document.body.style.cursor=''}},[hovered])
 const update=(i,v)=>setProgress(p=>p.map((x,n)=>n===i?+v:x))
 const clearResume=()=>{if(resumeTimer.current){clearTimeout(resumeTimer.current);resumeTimer.current=null}}
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))
 const cancelDemo=()=>{demoToken.current+=1;setDemoRunning(false);setTransitions([])}
 const handleUserStart=()=>{
  clearResume();setHovered(null)
  if(demoRunning)cancelDemo()
  if(!paused)setInteractionHold(true)
 }
 const handleUserEnd=()=>{clearResume();if(!paused){resumeTimer.current=setTimeout(()=>setInteractionHold(false),10000)}}
 const togglePause=()=>{
  clearResume()
  if(paused){setPaused(false);setInteractionHold(false)}
  else{setPaused(true);setInteractionHold(false)}
 }

 const buildPath=(from,to)=>{
  const state=[...from],path=[]
  let cursor=0,guard=0
  while(state.some((v,i)=>v!==to[i])&&guard<512){
   for(let n=0;n<8;n++){
    const i=(cursor+n)%8
    if(state[i]!==to[i]){
     state[i]+=state[i]<to[i]?1:-1
     path.push([...state]);cursor=(i+1)%8;break
    }
   }
   guard++
  }
  return path
 }
 const getChange=(from,to)=>{
  const area=from.findIndex((v,i)=>v!==to[i])
  if(area<0)return null
  const type=to[area]>from[area]?'in':'out'
  const level=type==='in'?from[area]:to[area]
  return {area,level,type}
 }

 const runDemo=async()=>{
  if(demoRunning)return
  const token=++demoToken.current
  const base=[...progressRef.current],zero=Array(8).fill(0),full=Array(8).fill(MAX)
  const path=[...buildPath(base,zero),...buildPath(zero,full),...buildPath(full,base)]
  let current=[...base]
  setHovered(null);setDemoRunning(true)

  for(const next of path){
   if(token!==demoToken.current)return
   const change=getChange(current,next)
   if(!change)continue
   const id=++transitionId.current
   const tr={...change,id,duration:145,startedAt:performance.now()}
   setTransitions(prev=>[...prev,tr])
   setProgress(next);progressRef.current=next;current=[...next]
   setTimeout(()=>setTransitions(prev=>prev.filter(t=>t.id!==id)),tr.duration+25)
   await wait(56)
  }

  await wait(180)
  if(token===demoToken.current){
   setProgress(base);progressRef.current=base;setTransitions([]);setDemoRunning(false)
  }
 }

 useEffect(()=>()=>{clearResume();demoToken.current+=1},[])

 return <main>
  <div className="backgroundFx"/>
  <div className="scene"><Scene progress={progress} transitions={transitions} hovered={hovered} setHovered={setHovered} rotating={rotating} speed={rotationSpeed} onUserStart={handleUserStart} onUserEnd={handleUserEnd} hudLabels={hudLabels} hudLines={hudLines}/></div>
  <div className="sceneGlow glowA"/><div className="sceneGlow glowB"/>

  <div className="hudScreen" aria-hidden="true">
   <svg className="hudLeaders">{AREAS.map((_,i)=><line key={i} ref={el=>hudLines.current[i]=el}/>)}</svg>
   {AREAS.map((area,i)=><div className="hudLabel" key={area} ref={el=>hudLabels.current[i]=el}>
    <div className="hudLabelNum">{String(i+1).padStart(2,'0')}</div>
    <div className="hudLabelCopy">
     <strong>{area}</strong>
     <span>POZIOM {progress[i]} / {MAX}</span>
     <div className="hudLabelBars">{Array.from({length:MAX}).map((_,n)=><i key={n} className={n<progress[i]?'on':''}/>)}</div>
    </div>
   </div>)}
  </div>

  <header><div className="micro">SW8 / MODEL 16</div><h1>SW8<br/>Wizualizacja strategii</h1><p>8 obszarów. Każdy ukończony blok buduje kolejny poziom strategii.</p></header>
  {!hovered&&<div className="meta">FROSTED GLASS / HUD SYSTEM<br/>8 OBSZARÓW / 6 POZIOMÓW</div>}

  {hovered&&<div className="hoverPanel">
   <div className="hoverPanelMicro">OBSZAR {String(hovered.area+1).padStart(2,'0')} · BLOK {String(hovered.level+1).padStart(2,'0')}</div>
   <h3>{AREAS[hovered.area]}</h3>
   <p className="hoverQuestion">{AREA_QUESTIONS[hovered.area]}</p>
   <div className="hoverFacts"><span>Poziom <b>{hovered.level+1}/{MAX}</b></span><span>Status <b>ukończony</b></span></div>
  </div>}

  <div className="bottomControls">
   <button className="pauseToggle" onClick={togglePause} aria-label={paused?'Włącz automatyczny obrót':'Zatrzymaj automatyczny obrót'} title={paused?'Play':'Pause'}>{paused?'▶':'Ⅱ'}</button>
   <button className="controlToggle" onClick={()=>setOpen(!open)}>{open?'ZAMKNIJ':'STEROWANIE'}</button>
   <button className={`demoToggle ${demoRunning?'isRunning':''}`} onClick={runDemo} disabled={demoRunning}>{demoRunning?'DEMO…':'DEMO'}</button>
  </div>

  {open&&<aside>
   <div className="buttons"><button onClick={()=>setProgress(Array(8).fill(MAX))}>Pełna wieża</button><button onClick={()=>setProgress(INITIAL)}>Reset</button></div>
   <div className="speedControl"><div><span>AUTO OBRÓT</span><b>{rotationSpeed.toFixed(2)}×</b></div><input type="range" min="0.10" max="1.00" step="0.05" value={rotationSpeed} onInput={e=>setRotationSpeed(+e.currentTarget.value)} onChange={e=>setRotationSpeed(+e.currentTarget.value)}/><small>{paused?'Pauza trwała':interactionHold?'Wznowienie za 10 s':'Aktywny'}</small></div>
   {AREAS.map((a,i)=><label key={a}><span>{String(i+1).padStart(2,'0')} / {a}</span><input type="range" min="0" max={MAX} value={progress[i]} onInput={e=>update(i,e.currentTarget.value)} onChange={e=>update(i,e.currentTarget.value)}/><b>{progress[i]}/{MAX}</b></label>)}
  </aside>}

  <div className="hint">DRAG → OBRÓT · PINCH / WHEEL → ZOOM</div>
 </main>
}

createRoot(document.getElementById('root')).render(<App/>)
