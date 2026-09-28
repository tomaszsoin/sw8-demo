import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './styles.css'

const AREAS=['WHY','WHO','FOR WHOM','CONTEXT','OFFER','MESSAGE','CHANNELS','SYSTEM']
const INITIAL=[3,5,4,2,4,3,5,3], MAX=6
const MOBILE=typeof window!=='undefined'&&matchMedia('(max-width:700px)').matches
const INNER=MOBILE?1.5:1.9, OUTER=MOBILE?2.72:3.65, H=MOBILE?1.02:.82, STEP=MOBILE?1.045:.845
const MAX_DIST=MOBILE?26:27
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
 float ndv=max(dot(N,V),0.0),fres=pow(1.0-ndv,3.4),diffuse=max(dot(N,L),0.0);
 float top=smoothstep(.03,.98,vY),edge=smoothstep(.08,.90,fres),facing=smoothstep(.12,.92,ndv);
 float n=hash(floor(vObj*34.0))*2.0-1.0;
 float glow=pow(max(dot(N,L),0.0),3.0);
 float band=.5+.5*sin(vW.y*3.1+vW.x*.34-vW.z*.25);
 vec3 deep=vec3(.025,.12,.72);
 vec3 cyan=vec3(.08,.66,1.0);
 vec3 col=mix(deep,uBlue,.48+diffuse*.22);
 col=mix(col,cyan,glow*.40+band*.06);
 col=mix(col,uIce,top*.36+edge*.50);
 col+=n*.016;
 col+=vec3(.03,.17,.66)*(1.0-top)*.075;
 if(uGhost>.5) col=mix(col,vec3(.955,.985,1.0),.89);
 float alpha=uOpacity*(.62+edge*.31+facing*.05);
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
 g.rotateX(-Math.PI/2)
 g.computeVertexNormals()
 return g
}

function mat(ghost=false){
 return new THREE.ShaderMaterial({
  vertexShader:vertex,
  fragmentShader:fragment,
  transparent:true,
  depthWrite:!ghost,
  side:THREE.DoubleSide,
  uniforms:{
   uBlue:{value:new THREE.Color(ghost?'#c8d9ff':ULTRAMARINE)},
   uIce:{value:new THREE.Color('#ffffff')},
   uLight:{value:new THREE.Vector3(-4,10,7)},
   uOpacity:{value:ghost?.06:.69},
   uGhost:{value:ghost?1:0}
  }
 })
}

function GlassTower({progress}){
 const active=useRef(),ghost=useRef()
 const geo=useMemo(makeGeometry,[]),activeMat=useMemo(()=>mat(false),[]),ghostMat=useMemo(()=>mat(true),[])
 const {invalidate}=useThree()
 useLayoutEffect(()=>{
  const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1),axis=new THREE.Vector3(0,1,0)
  let ai=0,gi=0
  for(let area=0;area<8;area++) for(let level=0;level<MAX;level++){
   p.set(0,level*STEP,0)
   q.setFromAxisAngle(axis,area*Math.PI/4)
   m.compose(p,q,s)
   const on=level<progress[area],mesh=on?active.current:ghost.current
   mesh.setMatrixAt(on?ai++:gi++,m)
  }
  active.current.count=ai
  ghost.current.count=gi
  active.current.instanceMatrix.needsUpdate=true
  ghost.current.instanceMatrix.needsUpdate=true
  invalidate()
 },[progress,invalidate])
 return <>
  <instancedMesh ref={ghost} args={[geo,ghostMat,48]} frustumCulled={false}/>
  <instancedMesh ref={active} args={[geo,activeMat,48]} frustumCulled={false}/>
 </>
}

function HudNode({i,progress}){
 const a=i*Math.PI/4
 const r=OUTER+1.5
 const x=Math.cos(a)*r,z=Math.sin(a)*r
 return <Html position={[x,.14,z]} center distanceFactor={MOBILE?13:14} zIndexRange={[4,1]}>
  <div className="hud3d">
   <div className="hud3dNum">{String(i+1).padStart(2,'0')}</div>
   <div className="hud3dCopy">
    <strong>NODE {String(i+1).padStart(2,'0')}</strong>
    <span>LEVEL {progress[i]}</span>
    <small>Q{i+1}</small>
    <div className="hud3dBars">{Array.from({length:MAX}).map((_,n)=><i key={n} className={n<progress[i]?'on':''}/>)}</div>
   </div>
  </div>
 </Html>
}

function Blueprint({progress}){
 const rings=[INNER*.72,INNER,OUTER,OUTER+.46,OUTER+.86,OUTER+1.25]
 return <group position={[0,.008,0]}>
  {rings.map((r,i)=><mesh key={r} rotation={[-Math.PI/2,0,0]}>
   <ringGeometry args={[r-(i<3?.011:.007),r+(i<3?.011:.007),MOBILE?80:128]}/>
   <meshBasicMaterial color={i===2?'#0d67d8':'#78a9df'} transparent opacity={i===2?.50:i<3?.29:.18}/>
  </mesh>)}
  {Array.from({length:8}).map((_,i)=>{
   const a=i*Math.PI/4,r1=INNER*.42,r2=OUTER+1.48,rn=OUTER+.86
   return <group key={i}>
    <mesh position={[Math.cos(a)*(r1+r2)/2,.014,Math.sin(a)*(r1+r2)/2]} rotation={[0,-a,0]}>
     <boxGeometry args={[.009,.009,r2-r1]}/>
     <meshBasicMaterial color="#176fda" transparent opacity={i%2===0?.50:.34}/>
    </mesh>
    <mesh position={[Math.cos(a)*rn,.019,Math.sin(a)*rn]} rotation={[-Math.PI/2,0,0]}>
     <ringGeometry args={[.105,.15,32]}/><meshBasicMaterial color="#0870df" transparent opacity={.94}/>
    </mesh>
    <mesh position={[Math.cos(a)*rn,.020,Math.sin(a)*rn]} rotation={[-Math.PI/2,0,0]}>
     <circleGeometry args={[.043,24]}/><meshBasicMaterial color="#0870df"/>
    </mesh>
    <HudNode i={i} progress={progress}/>
   </group>
  })}
 </group>
}

function Floor(){return <>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.035,0]}><circleGeometry args={[OUTER+1.5,96]}/><meshBasicMaterial color="#fbfdff" transparent opacity={.76}/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.044,0]}><ringGeometry args={[OUTER-.04,OUTER+.30,96]}/><meshBasicMaterial color="#6aabff" transparent opacity={.085}/></mesh>
 </>}

function Scene({progress}){
 const targetY=MOBILE?2.55:2.25
 const target=new THREE.Vector3(0,targetY,0),dir=new THREE.Vector3(1,.46,1.04).normalize(),pos=target.clone().add(dir.multiplyScalar(MAX_DIST))
 const camera={position:pos.toArray(),fov:MOBILE?27:29}
 return <Canvas dpr={MOBILE?[1,1.5]:[1,1.7]} gl={{antialias:true,powerPreference:'high-performance',alpha:false}} camera={camera} frameloop="demand">
  <color attach="background" args={['#fcfdff']}/>
  <Floor/><Blueprint progress={progress}/><GlassTower progress={progress}/>
  <OrbitControls makeDefault target={[0,targetY,0]} minDistance={MOBILE?12.5:9.5} maxDistance={MAX_DIST} enablePan={false} enableDamping={false} minPolarAngle={.72} maxPolarAngle={1.17}/>
 </Canvas>
}

function App(){
 const[progress,setProgress]=useState(INITIAL),[open,setOpen]=useState(false)
 const update=(i,v)=>setProgress(p=>p.map((x,n)=>n===i?+v:x))
 return <main>
  <div className="scene"><Scene progress={progress}/></div>
  <div className="sceneGlow glowA"/><div className="sceneGlow glowB"/>
  <header><div className="micro">SW8 / MODEL 09</div><h1>Strategic<br/>Decision Tower</h1><p>8 obszarów. Każdy ukończony blok buduje kolejny poziom strategii.</p></header>
  <div className="meta">FROSTED GLASS / HUD SYSTEM<br/>8 NODES / 6 LEVELS</div>
  <button className="controlToggle" onClick={()=>setOpen(!open)}>{open?'ZAMKNIJ':'STEROWANIE'}</button>
  {open&&<aside><div className="buttons"><button onClick={()=>setProgress(Array(8).fill(MAX))}>Pełna wieża</button><button onClick={()=>setProgress(INITIAL)}>Reset</button></div>{AREAS.map((a,i)=><label key={a}><span>{String(i+1).padStart(2,'0')} / {a}</span><input type="range" min="0" max={MAX} value={progress[i]} onInput={e=>update(i,e.currentTarget.value)} onChange={e=>update(i,e.currentTarget.value)}/><b>{progress[i]}/{MAX}</b></label>)}</aside>}
  <div className="hint">DRAG → OBRÓT · PINCH / WHEEL → ZOOM</div>
 </main>
}

createRoot(document.getElementById('root')).render(<App/>)
