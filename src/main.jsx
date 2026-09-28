import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './styles.css'

const AREAS=['WHY','WHO','FOR WHOM','CONTEXT','OFFER','MESSAGE','CHANNELS','SYSTEM']
const INITIAL=[3,5,4,2,4,3,5,3], MAX=6
const MOBILE=typeof window!=='undefined'&&matchMedia('(max-width:700px)').matches
const INNER=MOBILE?1.7:2.05, OUTER=MOBILE?3.2:4.05, H=MOBILE?.86:.72, STEP=MOBILE?.89:.74

const vertex=`
varying vec3 vN; varying vec3 vW; varying float vY;
void main(){
  vec4 world=modelMatrix*instanceMatrix*vec4(position,1.0);
  vW=world.xyz; vN=normalize(mat3(modelMatrix*instanceMatrix)*normal); vY=position.y;
  gl_Position=projectionMatrix*viewMatrix*world;
}`
const fragment=`
uniform vec3 uBlue; uniform vec3 uIce; uniform vec3 uLight; uniform float uOpacity;
varying vec3 vN; varying vec3 vW; varying float vY;
void main(){
  vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW); vec3 L=normalize(uLight);
  float fres=pow(1.0-max(dot(N,V),0.0),2.7);
  float lam=.35+.65*max(dot(N,L),0.0);
  float top=smoothstep(.05,.82,vY);
  float rim=smoothstep(.18,.92,fres);
  vec3 col=mix(uBlue,uIce,top*.48+lam*.18);
  col+=vec3(.20,.48,1.0)*rim*.52;
  col+=vec3(.08,.25,.72)*(1.0-top)*.16;
  float alpha=uOpacity*(.70+rim*.25);
  gl_FragColor=vec4(col,alpha);
}`

function makeGeometry(){
  const shape=new THREE.Shape(), a0=-Math.PI/8+.014, a1=Math.PI/8-.014
  shape.moveTo(Math.cos(a0)*OUTER,Math.sin(a0)*OUTER)
  shape.absarc(0,0,OUTER,a0,a1,false)
  shape.lineTo(Math.cos(a1)*INNER,Math.sin(a1)*INNER)
  shape.absarc(0,0,INNER,a1,a0,true); shape.closePath()
  const g=new THREE.ExtrudeGeometry(shape,{depth:H,bevelEnabled:false,curveSegments:MOBILE?14:24})
  g.rotateX(-Math.PI/2); g.computeVertexNormals(); return g
}

function GlassTower({progress}){
  const active=useRef(), ghost=useRef()
  const geo=useMemo(makeGeometry,[])
  const activeMat=useMemo(()=>new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:true,side:THREE.DoubleSide,uniforms:{uBlue:{value:new THREE.Color('#075bd9')},uIce:{value:new THREE.Color('#dff3ff')},uLight:{value:new THREE.Vector3(5,9,6)},uOpacity:{value:.78}}}),[])
  const ghostMat=useMemo(()=>new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uBlue:{value:new THREE.Color('#9cc9ff')},uIce:{value:new THREE.Color('#ffffff')},uLight:{value:new THREE.Vector3(5,9,6)},uOpacity:{value:.075}}}),[])
  useLayoutEffect(()=>{
    const m=new THREE.Matrix4(), p=new THREE.Vector3(), q=new THREE.Quaternion(), s=new THREE.Vector3(1,1,1)
    let ai=0,gi=0
    for(let area=0;area<8;area++) for(let level=0;level<MAX;level++){
      p.set(0,level*STEP,0); q.setFromAxisAngle(new THREE.Vector3(0,1,0),area*Math.PI/4); m.compose(p,q,s)
      const mesh=level<progress[area]?active.current:ghost.current
      mesh.setMatrixAt(level<progress[area]?ai++:gi++,m)
    }
    active.current.count=ai; ghost.current.count=gi
    active.current.instanceMatrix.needsUpdate=true; ghost.current.instanceMatrix.needsUpdate=true
  },[progress])
  return <><instancedMesh ref={active} args={[geo,activeMat,48]} frustumCulled={false}/><instancedMesh ref={ghost} args={[geo,ghostMat,48]} frustumCulled={false}/></>
}

function Blueprint(){
  const rings=[INNER,OUTER,OUTER+1,OUTER+1.65]
  return <group position={[0,.008,0]}>
    {rings.map((r,i)=><mesh key={r} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[r-.012,r+.012,MOBILE?64:112]}/><meshBasicMaterial color={i<2?'#9aaabc':'#aebdce'} transparent opacity={i<2?.32:.2}/></mesh>)}
    {Array.from({length:8}).map((_,i)=>{const a=i*Math.PI/4,r=OUTER+1;return <group key={i}><mesh position={[Math.cos(a)*r,.01,Math.sin(a)*r]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.10,.145,24]}/><meshBasicMaterial color="#146cff"/></mesh><mesh position={[Math.cos(a)*(OUTER+.45),.008,Math.sin(a)*(OUTER+.45)]} rotation={[0,-a,0]}><planeGeometry args={[1.15,.012]}/><meshBasicMaterial color="#8fa4bb" transparent opacity={.24}/></mesh></group>})}
  </group>
}

function FloorGlow(){return <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.025,0]}><circleGeometry args={[OUTER+1.8,64]}/><meshBasicMaterial color="#eaf3ff" transparent opacity={.48}/></mesh>}

function Scene({progress}){
  const camera=MOBILE?{position:[10.7,7.0,11.2],fov:30}:{position:[10,6.8,10.5],fov:31}
  return <Canvas dpr={MOBILE?[1,1.45]:[1,1.6]} gl={{antialias:true,powerPreference:'high-performance',alpha:false}} camera={camera} frameloop="demand">
    <color attach="background" args={['#f6f8fb']}/><FloorGlow/><Blueprint/><GlassTower progress={progress}/>
    <OrbitControls makeDefault target={[0,MOBILE?2.15:1.9,0]} minDistance={MOBILE?13.2:9.5} maxDistance={22} enablePan={false} enableDamping={false} minPolarAngle={.68} maxPolarAngle={1.2}/>
  </Canvas>
}

function App(){
 const[progress,setProgress]=useState(INITIAL),[open,setOpen]=useState(false)
 const update=(i,v)=>setProgress(p=>p.map((x,n)=>n===i?+v:x))
 return <main><div className="scene"><Scene progress={progress}/></div><header><div className="micro">SW8 / MODEL 02</div><h1>Strategic<br/>Decision Tower</h1><p>8 obszarów. Każdy ukończony blok buduje kolejny poziom strategii.</p></header><div className="meta">REALTIME GLASS / INSTANCED<br/>8 NODES / 6 LEVELS</div><button className="controlToggle" onClick={()=>setOpen(!open)}>{open?'ZAMKNIJ':'STEROWANIE'}</button>{open&&<aside><div className="buttons"><button onClick={()=>setProgress(Array(8).fill(MAX))}>Pełna wieża</button><button onClick={()=>setProgress(INITIAL)}>Reset</button></div>{AREAS.map((a,i)=><label key={a}><span>{String(i+1).padStart(2,'0')} / {a}</span><input type="range" min="0" max={MAX} value={progress[i]} onChange={e=>update(i,e.target.value)}/><b>{progress[i]}/{MAX}</b></label>)}</aside>}<div className="hint">DRAG → OBRÓT · PINCH / WHEEL → ZOOM</div></main>
}
createRoot(document.getElementById('root')).render(<App/>)
