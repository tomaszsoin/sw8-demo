import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './styles.css'

const AREAS=['WHY','WHO','FOR WHOM','CONTEXT','OFFER','MESSAGE','CHANNELS','SYSTEM']
const INITIAL=[3,5,4,2,4,3,5,3], MAX=6
const MOBILE=typeof window!=='undefined'&&matchMedia('(max-width:700px)').matches
const INNER=MOBILE?1.5:1.9, OUTER=MOBILE?2.72:3.65, H=MOBILE?1.02:.82, STEP=MOBILE?1.045:.845
const MAX_DIST=MOBILE?26:27
const NODE_R=OUTER+.86

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
uniform vec3 uBase;uniform vec3 uAccent;uniform vec3 uIce;uniform vec3 uLight;
uniform float uOpacity;uniform float uGhost;uniform float uIceBias;
varying vec3 vN;varying vec3 vW;varying float vY;varying vec3 vObj;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
void main(){
 vec3 N=normalize(vN),V=normalize(cameraPosition-vW),L=normalize(uLight);
 float ndv=max(dot(N,V),0.0),fres=pow(1.0-ndv,3.25),diffuse=max(dot(N,L),0.0);
 float top=smoothstep(.03,.98,vY),edge=smoothstep(.07,.90,fres),facing=smoothstep(.12,.92,ndv);
 float n=hash(floor(vObj*38.0))*2.0-1.0;
 float key=pow(diffuse,3.2);
 float band=.5+.5*sin(vW.y*3.15+vW.x*.34-vW.z*.24);
 float cloud=.5+.5*sin(vObj.x*2.2+vObj.z*2.7-vObj.y*1.4);
 vec3 col=mix(uBase,uAccent,key*.48+band*.08);
 col=mix(col,uIce,clamp(uIceBias+top*.31+edge*.52+cloud*.025,0.0,.92));
 col+=n*.014;
 col+=uAccent*(1.0-top)*.045;
 if(uGhost>.5) col=mix(col,vec3(.96,.987,1.0),.90);
 float alpha=uOpacity*(.60+edge*.33+facing*.05);
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

function glassMaterial(kind){
 const cfg={
  deep:{base:'#071d9f',accent:'#087cf7',opacity:.80,iceBias:.03},
  blue:{base:'#1648f2',accent:'#17a9ff',opacity:.72,iceBias:.09},
  ice:{base:'#b9ddff',accent:'#62c6ff',opacity:.54,iceBias:.30},
  ghost:{base:'#d5e8ff',accent:'#9ed8ff',opacity:.055,iceBias:.50}
 }[kind]
 return new THREE.ShaderMaterial({
  vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:kind!=='ghost',side:THREE.DoubleSide,
  uniforms:{
   uBase:{value:new THREE.Color(cfg.base)},uAccent:{value:new THREE.Color(cfg.accent)},uIce:{value:new THREE.Color('#ffffff')},
   uLight:{value:new THREE.Vector3(-4,10,7)},uOpacity:{value:cfg.opacity},uGhost:{value:kind==='ghost'?1:0},uIceBias:{value:cfg.iceBias}
  }
 })
}

function GlassTower({progress}){
 const deep=useRef(),blue=useRef(),ice=useRef(),ghost=useRef()
 const geo=useMemo(makeGeometry,[])
 const mats=useMemo(()=>({deep:glassMaterial('deep'),blue:glassMaterial('blue'),ice:glassMaterial('ice'),ghost:glassMaterial('ghost')}),[])
 const {invalidate}=useThree()
 useLayoutEffect(()=>{
  const refs={deep:deep.current,blue:blue.current,ice:ice.current,ghost:ghost.current}
  const counts={deep:0,blue:0,ice:0,ghost:0}
  const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1),axis=new THREE.Vector3(0,1,0)
  for(let area=0;area<8;area++) for(let level=0;level<MAX;level++){
   p.set(0,level*STEP,0);q.setFromAxisAngle(axis,area*Math.PI/4);m.compose(p,q,s)
   let kind='ghost'
   if(level<progress[area]){
    const selector=(area*3+level*2)%7
    kind=selector===0||selector===4?'ice':selector===1||selector===5?'blue':'deep'
   }
   refs[kind].setMatrixAt(counts[kind]++,m)
  }
  Object.keys(refs).forEach(k=>{refs[k].count=counts[k];refs[k].instanceMatrix.needsUpdate=true})
  invalidate()
 },[progress,invalidate])
 return <>
  <instancedMesh ref={ghost} args={[geo,mats.ghost,48]} frustumCulled={false}/>
  <instancedMesh ref={ice} args={[geo,mats.ice,48]} frustumCulled={false}/>
  <instancedMesh ref={blue} args={[geo,mats.blue,48]} frustumCulled={false}/>
  <instancedMesh ref={deep} args={[geo,mats.deep,48]} frustumCulled={false}/>
 </>
}

function HudOverlay({progress}){
 const {camera,size}=useThree()
 const labels=useRef([]),lines=useRef([])
 const anchors=useMemo(()=>Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return new THREE.Vector3(Math.cos(a)*NODE_R,.05,Math.sin(a)*NODE_R)}),[])
 const center=useMemo(()=>new THREE.Vector3(0,.05,0),[])
 useFrame(()=>{
  const c=center.clone().project(camera)
  const cx=(c.x*.5+.5)*size.width,cy=(-c.y*.5+.5)*size.height
  const camCenterDist=camera.position.distanceTo(center)
  const safeX=MOBILE?54:76,safeY=MOBILE?38:52
  const offset=MOBILE?58:82
  anchors.forEach((world,i)=>{
   const projected=world.clone().project(camera)
   const ax=(projected.x*.5+.5)*size.width,ay=(-projected.y*.5+.5)*size.height
   let dx=ax-cx,dy=ay-cy
   const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len
   let lx=ax+dx*offset,ly=ay+dy*offset
   lx=Math.max(safeX,Math.min(size.width-safeX,lx));ly=Math.max(safeY,Math.min(size.height-safeY,ly))
   const front=camera.position.distanceTo(world)<camCenterDist
   const opacity=front?1:.54
   const label=labels.current[i],line=lines.current[i]
   if(label){label.style.transform=`translate3d(${lx}px,${ly}px,0) translate(-50%,-50%)`;label.style.opacity=opacity;label.dataset.front=front?'1':'0'}
   if(line){
    const ex=ax+(lx-ax)*.72,ey=ay+(ly-ay)*.72
    line.setAttribute('x1',ax);line.setAttribute('y1',ay);line.setAttribute('x2',ex);line.setAttribute('y2',ey);line.style.opacity=front?.72:.28
   }
  })
 })
 return <Html fullscreen zIndexRange={[5,1]}>
  <div className="hudScreen" aria-hidden="true">
   <svg className="hudLeaders">{AREAS.map((_,i)=><line key={i} ref={el=>lines.current[i]=el}/>)}</svg>
   {AREAS.map((area,i)=><div className="hudLabel" key={area} ref={el=>labels.current[i]=el}>
    <div className="hudLabelNum">{String(i+1).padStart(2,'0')}</div>
    <div className="hudLabelCopy"><strong>NODE {String(i+1).padStart(2,'0')}</strong><span>LEVEL {progress[i]}</span><small>Q{i+1}</small><div className="hudLabelBars">{Array.from({length:MAX}).map((_,n)=><i key={n} className={n<progress[i]?'on':''}/>)}</div></div>
   </div>)}
  </div>
 </Html>
}

function Blueprint(){
 const rings=[INNER*.72,INNER,OUTER,OUTER+.46,OUTER+.86,OUTER+1.25]
 return <group position={[0,.008,0]}>
  {rings.map((r,i)=><mesh key={r} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[r-(i<3?.011:.007),r+(i<3?.011:.007),MOBILE?80:128]}/><meshBasicMaterial color={i===2?'#0d67d8':'#78a9df'} transparent opacity={i===2?.50:i<3?.29:.18}/></mesh>)}
  {Array.from({length:8}).map((_,i)=>{const a=i*Math.PI/4,r1=INNER*.42,r2=OUTER+1.48;return <group key={i}>
   <mesh position={[Math.cos(a)*(r1+r2)/2,.014,Math.sin(a)*(r1+r2)/2]} rotation={[0,-a,0]}><boxGeometry args={[.009,.009,r2-r1]}/><meshBasicMaterial color="#176fda" transparent opacity={i%2===0?.50:.34}/></mesh>
   <mesh position={[Math.cos(a)*NODE_R,.019,Math.sin(a)*NODE_R]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.105,.15,32]}/><meshBasicMaterial color="#0870df" transparent opacity={.94}/></mesh>
   <mesh position={[Math.cos(a)*NODE_R,.020,Math.sin(a)*NODE_R]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.043,24]}/><meshBasicMaterial color="#0870df"/></mesh>
  </group>})}
 </group>
}

function Floor(){return <>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.035,0]}><circleGeometry args={[OUTER+1.5,96]}/><meshBasicMaterial color="#fbfdff" transparent opacity={.76}/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.044,0]}><ringGeometry args={[OUTER-.04,OUTER+.30,96]}/><meshBasicMaterial color="#6aabff" transparent opacity={.085}/></mesh>
 </>}

function CameraControls({targetY}){const {invalidate}=useThree();return <OrbitControls makeDefault target={[0,targetY,0]} minDistance={MOBILE?12.5:9.5} maxDistance={MAX_DIST} enablePan={false} enableDamping={false} minPolarAngle={.72} maxPolarAngle={1.17} onChange={invalidate}/>}

function Scene({progress}){
 const targetY=MOBILE?2.55:2.25
 const target=new THREE.Vector3(0,targetY,0),dir=new THREE.Vector3(1,.46,1.04).normalize(),pos=target.clone().add(dir.multiplyScalar(MAX_DIST))
 const camera={position:pos.toArray(),fov:MOBILE?27:29}
 return <Canvas dpr={MOBILE?[1,1.5]:[1,1.7]} gl={{antialias:true,powerPreference:'high-performance',alpha:false}} camera={camera} frameloop="demand">
  <color attach="background" args={['#fcfdff']}/>
  <Floor/><Blueprint/><GlassTower progress={progress}/><HudOverlay progress={progress}/><CameraControls targetY={targetY}/>
 </Canvas>
}

function App(){
 const[progress,setProgress]=useState(INITIAL),[open,setOpen]=useState(false)
 const update=(i,v)=>setProgress(p=>p.map((x,n)=>n===i?+v:x))
 return <main>
  <div className="scene"><Scene progress={progress}/></div>
  <div className="sceneGlow glowA"/><div className="sceneGlow glowB"/>
  <header><div className="micro">SW8 / MODEL 10</div><h1>Strategic<br/>Decision Tower</h1><p>8 obszarów. Każdy ukończony blok buduje kolejny poziom strategii.</p></header>
  <div className="meta">FROSTED GLASS / HUD SYSTEM<br/>8 NODES / 6 LEVELS</div>
  <button className="controlToggle" onClick={()=>setOpen(!open)}>{open?'ZAMKNIJ':'STEROWANIE'}</button>
  {open&&<aside><div className="buttons"><button onClick={()=>setProgress(Array(8).fill(MAX))}>Pełna wieża</button><button onClick={()=>setProgress(INITIAL)}>Reset</button></div>{AREAS.map((a,i)=><label key={a}><span>{String(i+1).padStart(2,'0')} / {a}</span><input type="range" min="0" max={MAX} value={progress[i]} onInput={e=>update(i,e.currentTarget.value)} onChange={e=>update(i,e.currentTarget.value)}/><b>{progress[i]}/{MAX}</b></label>)}</aside>}
  <div className="hint">DRAG → OBRÓT · PINCH / WHEEL → ZOOM</div>
 </main>
}

createRoot(document.getElementById('root')).render(<App/>)
