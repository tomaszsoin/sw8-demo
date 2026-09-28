import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './styles.css'

const AREAS=['WHY','WHO','FOR WHOM','CONTEXT','OFFER','MESSAGE','CHANNELS','SYSTEM']
const INITIAL=[3,5,4,2,4,3,5,3], MAX=6
const MOBILE=typeof window!=='undefined'&&matchMedia('(max-width:700px)').matches
const INNER=MOBILE?1.5:1.9, OUTER=MOBILE?2.72:3.65, H=MOBILE?1.02:.82, STEP=MOBILE?1.045:.845
const MAX_DIST=MOBILE?26:27
const NODE_R=OUTER+.86
const OUTER_RING=NODE_R
const ULTRAMARINE='#244DFF'

const vertex=`
varying vec3 vN;varying vec3 vW;varying float vY;varying vec3 vObj;
void main(){
 vec4 world=modelMatrix*instanceMatrix*vec4(position,1.0);
 vW=world.xyz;
 vN=normalize(mat3(modelMatrix*instanceMatrix)*normal);
 vY=position.y;
 vObj=position;
 gl_Position=projectionMatrix*viewMatrix*world;
}`

const fragment=`
uniform vec3 uBlue;uniform vec3 uIce;uniform vec3 uLight;uniform float uOpacity;uniform float uGhost;
varying vec3 vN;varying vec3 vW;varying float vY;varying vec3 vObj;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
void main(){
 vec3 N=normalize(vN),V=normalize(cameraPosition-vW),L=normalize(uLight);
 float ndv=max(dot(N,V),0.0),fres=pow(1.0-ndv,3.6),diffuse=max(dot(N,L),0.0);
 float top=smoothstep(.04,.96,vY),edge=smoothstep(.09,.91,fres),facing=smoothstep(.14,.90,ndv);
 float n=hash(floor(vObj*32.0))*2.0-1.0;
 float glow=pow(diffuse,3.0);
 float band=.5+.5*sin(vW.y*2.9+vW.x*.31-vW.z*.22);
 vec3 deep=vec3(.035,.11,.62);
 vec3 cyan=vec3(.08,.58,1.0);
 vec3 col=mix(deep,uBlue,.52+diffuse*.18);
 col=mix(col,cyan,glow*.28+band*.045);
 col=mix(col,uIce,top*.32+edge*.48);
 col+=n*.012;
 col+=vec3(.04,.14,.48)*(1.0-top)*.055;
 if(uGhost>.5) col=mix(col,vec3(.965,.985,1.0),.90);
 float alpha=uOpacity*(.61+edge*.31+facing*.05);
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
 g.rotateX(-Math.PI/2);g.computeVertexNormals();return g
}

function glassMaterial(ghost=false){
 return new THREE.ShaderMaterial({
  vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:!ghost,side:THREE.DoubleSide,
  uniforms:{
   uBlue:{value:new THREE.Color(ghost?'#c9d8ff':ULTRAMARINE)},
   uIce:{value:new THREE.Color('#ffffff')},
   uLight:{value:new THREE.Vector3(-4,10,7)},
   uOpacity:{value:ghost?.055:.68},
   uGhost:{value:ghost?1:0}
  }
 })
}

function GlassTower({progress,fade}){
 const active=useRef(),ghost=useRef()
 const geo=useMemo(makeGeometry,[])
 const activeMat=useMemo(()=>glassMaterial(false),[]),ghostMat=useMemo(()=>glassMaterial(true),[])
 const {invalidate}=useThree()

 useEffect(()=>{
  activeMat.uniforms.uOpacity.value=.68*(1-fade*.32)
  ghostMat.uniforms.uOpacity.value=.055*(1-fade*.22)
  invalidate()
 },[fade,activeMat,ghostMat,invalidate])

 useLayoutEffect(()=>{
  const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1),axis=new THREE.Vector3(0,1,0)
  let ai=0,gi=0
  for(let area=0;area<8;area++)for(let level=0;level<MAX;level++){
   p.set(0,level*STEP,0);q.setFromAxisAngle(axis,area*Math.PI/4);m.compose(p,q,s)
   const on=level<progress[area],mesh=on?active.current:ghost.current
   mesh.setMatrixAt(on?ai++:gi++,m)
  }
  active.current.count=ai;ghost.current.count=gi
  active.current.instanceMatrix.needsUpdate=true;ghost.current.instanceMatrix.needsUpdate=true
  invalidate()
 },[progress,invalidate])

 return <>
  <instancedMesh ref={ghost} args={[geo,ghostMat,48]} frustumCulled={false}/>
  <instancedMesh ref={active} args={[geo,activeMat,48]} frustumCulled={false}/>
 </>
}

function HudTracker({labels,lines}){
 const {camera,size}=useThree()
 const anchors=useMemo(()=>Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return new THREE.Vector3(Math.cos(a)*NODE_R,.05,Math.sin(a)*NODE_R)}),[])
 const center=useMemo(()=>new THREE.Vector3(0,.05,0),[])

 useFrame(()=>{
  const c=center.clone().project(camera)
  const cx=(c.x*.5+.5)*size.width,cy=(-c.y*.5+.5)*size.height
  const centerDist=camera.position.distanceTo(center)
  const labelW=MOBILE?84:100
  const yPad=MOBILE?17:19
  const offset=MOBILE?12:15

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
   label.style.opacity=front?'0.92':'0.58'
   label.style.textAlign=right?'left':'right'
   label.dataset.side=right?'right':'left'
   label.style.transform=`translate3d(${lx}px,${ly}px,0) translate(${right?'0':'-100%'},-50%)`

   const ex=lx+(right?-4:4)
   line.style.display='block'
   line.style.opacity=front?'.56':'.26'
   line.setAttribute('x1',ax)
   line.setAttribute('y1',ay)
   line.setAttribute('x2',ex)
   line.setAttribute('y2',ly)
  })
 })
 return null
}

function Blueprint(){
 const rings=[INNER*.72,INNER,OUTER,OUTER+.42]
 return <group position={[0,.008,0]}>
  {rings.map((r,i)=><mesh key={r} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[r-(i<3?.009:.006),r+(i<3?.009:.006),MOBILE?80:128]}/><meshBasicMaterial color={i===2?'#4b8edc':'#9bbde3'} transparent opacity={i===2?.28:i<3?.19:.11}/></mesh>)}
  {Array.from({length:8}).map((_,i)=>{const a=i*Math.PI/4,r1=INNER*.54,r2=NODE_R;return <group key={i}>
   <mesh position={[Math.cos(a)*(r1+r2)/2,.014,Math.sin(a)*(r1+r2)/2]} rotation={[0,-a,0]}><boxGeometry args={[.006,.006,r2-r1]}/><meshBasicMaterial color="#6d9fd7" transparent opacity={.20}/></mesh>
   <mesh position={[Math.cos(a)*NODE_R,.019,Math.sin(a)*NODE_R]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.085,.125,32]}/><meshBasicMaterial color="#1676df" transparent opacity={.80}/></mesh>
   <mesh position={[Math.cos(a)*NODE_R,.020,Math.sin(a)*NODE_R]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.032,24]}/><meshBasicMaterial color="#1676df" transparent opacity={.84}/></mesh>
  </group>})}
 </group>
}

function Floor(){return <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.035,0]}>
 <ringGeometry args={[OUTER_RING-.012,OUTER_RING+.012,128]}/>
 <meshBasicMaterial color="#aebdce" transparent opacity={.56}/>
 </mesh>}

function CameraControls({targetY,rotating,speed,onUserStart,onUserEnd}){
 const {invalidate}=useThree()
 return <OrbitControls
  makeDefault
  target={[0,targetY,0]}
  minDistance={MOBILE?12.5:9.5}
  maxDistance={MAX_DIST}
  enablePan={false}
  enableDamping={false}
  minPolarAngle={.72}
  maxPolarAngle={1.17}
  autoRotate={rotating}
  autoRotateSpeed={speed}
  onStart={onUserStart}
  onEnd={onUserEnd}
  onChange={invalidate}
 />
}

function Scene({progress,fade,rotating,speed,onUserStart,onUserEnd,hudLabels,hudLines}){
 const targetY=MOBILE?2.55:2.25
 const target=new THREE.Vector3(0,targetY,0),dir=new THREE.Vector3(1,.46,1.04).normalize(),pos=target.clone().add(dir.multiplyScalar(MAX_DIST))
 const camera={position:pos.toArray(),fov:MOBILE?27:29}
 return <Canvas dpr={MOBILE?[1,1.5]:[1,1.7]} gl={{antialias:true,powerPreference:'high-performance',alpha:false}} camera={camera} frameloop={rotating?'always':'demand'}>
  <color attach="background" args={['#fcfdff']}/>
  <Floor/><Blueprint/><GlassTower progress={progress} fade={fade}/><HudTracker labels={hudLabels} lines={hudLines}/>
  <CameraControls targetY={targetY} rotating={rotating} speed={speed} onUserStart={onUserStart} onUserEnd={onUserEnd}/>
 </Canvas>
}

function App(){
 const[progress,setProgress]=useState(INITIAL),[open,setOpen]=useState(false)
 const[paused,setPaused]=useState(false),[interactionHold,setInteractionHold]=useState(false),[rotationSpeed,setRotationSpeed]=useState(.35)
 const[demoRunning,setDemoRunning]=useState(false),[fade,setFade]=useState(0)
 const resumeTimer=useRef(null),demoToken=useRef(0),progressRef=useRef(INITIAL)
 const hudLabels=useRef([]),hudLines=useRef([])
 const rotating=!paused&&!interactionHold

 useEffect(()=>{progressRef.current=progress},[progress])
 const update=(i,v)=>setProgress(p=>p.map((x,n)=>n===i?+v:x))
 const clearResume=()=>{if(resumeTimer.current){clearTimeout(resumeTimer.current);resumeTimer.current=null}}
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))
 const handleUserStart=()=>{
  clearResume()
  if(demoRunning){demoToken.current+=1;setDemoRunning(false);setFade(0)}
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
   let changed=false
   for(let n=0;n<8;n++){
    const i=(cursor+n)%8
    if(state[i]!==to[i]){
     state[i]+=state[i]<to[i]?1:-1
     path.push([...state])
     cursor=(i+1)%8
     changed=true
     break
    }
   }
   if(!changed)break
   guard++
  }
  return path
 }

 const runDemo=async()=>{
  if(demoRunning)return
  const token=++demoToken.current
  const base=[...progressRef.current]
  const zero=Array(8).fill(0),full=Array(8).fill(MAX)
  const path=[...buildPath(base,zero),...buildPath(zero,full),...buildPath(full,base)]
  setDemoRunning(true)

  for(const next of path){
   if(token!==demoToken.current)return
   setFade(1)
   await wait(70)
   if(token!==demoToken.current)return
   setProgress(next)
   await wait(18)
   setFade(0)
   await wait(112)
  }

  if(token===demoToken.current){
   setProgress(base)
   setFade(0)
   setDemoRunning(false)
  }
 }

 useEffect(()=>()=>{clearResume();demoToken.current+=1},[])

 return <main>
  <div className="scene"><Scene progress={progress} fade={fade} rotating={rotating} speed={rotationSpeed} onUserStart={handleUserStart} onUserEnd={handleUserEnd} hudLabels={hudLabels} hudLines={hudLines}/></div>
  <div className="sceneGlow glowA"/><div className="sceneGlow glowB"/>

  <div className="hudScreen" aria-hidden="true">
   <svg className="hudLeaders">{AREAS.map((_,i)=><line key={i} ref={el=>hudLines.current[i]=el}/>)}</svg>
   {AREAS.map((area,i)=><div className="hudLabel" key={area} ref={el=>hudLabels.current[i]=el}>
    <div className="hudLabelNum">{String(i+1).padStart(2,'0')}</div>
    <div className="hudLabelCopy"><strong>NODE {String(i+1).padStart(2,'0')}</strong><span>LEVEL {progress[i]}</span><small>Q{i+1}</small><div className="hudLabelBars">{Array.from({length:MAX}).map((_,n)=><i key={n} className={n<progress[i]?'on':''}/>)}</div></div>
   </div>)}
  </div>

  <header><div className="micro">SW8 / MODEL 13</div><h1>SW8<br/>Wizualizacja strategii</h1><p>8 obszarów. Każdy ukończony blok buduje kolejny poziom strategii.</p></header>
  <div className="meta">FROSTED GLASS / HUD SYSTEM<br/>8 NODES / 6 LEVELS</div>

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
