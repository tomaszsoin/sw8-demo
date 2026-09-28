import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './styles.css'

const AREAS=['WHY','WHO','FOR WHOM','CONTEXT','OFFER','MESSAGE','CHANNELS','SYSTEM']
const INITIAL=[3,5,4,2,4,3,5,3], MAX=6
const MOBILE=typeof window!=='undefined'&&matchMedia('(max-width:700px)').matches
const INNER=MOBILE?1.5:1.9, OUTER=MOBILE?2.72:3.65, H=MOBILE?1.02:.82, STEP=MOBILE?1.045:.845

const vertex=`
varying vec3 vN; varying vec3 vW; varying float vY;
void main(){vec4 world=modelMatrix*instanceMatrix*vec4(position,1.0);vW=world.xyz;vN=normalize(mat3(modelMatrix*instanceMatrix)*normal);vY=position.y;gl_Position=projectionMatrix*viewMatrix*world;}`
const fragment=`
uniform vec3 uBlue;uniform vec3 uIce;uniform vec3 uLight;uniform float uOpacity;uniform float uGhost;
varying vec3 vN;varying vec3 vW;varying float vY;
void main(){
 vec3 N=normalize(vN),V=normalize(cameraPosition-vW),L=normalize(uLight);
 float ndv=max(dot(N,V),0.0), fres=pow(1.0-ndv,3.45), diffuse=max(dot(N,L),0.0);
 float top=smoothstep(.08,.94,vY), edge=smoothstep(.12,.92,fres), facing=smoothstep(.18,.88,ndv);
 vec3 col=mix(uBlue,uIce,.28+top*.29+diffuse*.31);
 col=mix(col,uIce,edge*.66);
 col+=vec3(.07,.22,.58)*(1.0-top)*.09;
 if(uGhost>.5) col=mix(col,vec3(.96,.99,1.0),.80);
 float alpha=uOpacity*(.69+edge*.23+facing*.05);
 gl_FragColor=vec4(col,alpha);
}`
function makeGeometry(){const shape=new THREE.Shape(),a0=-Math.PI/8+.006,a1=Math.PI/8-.006;shape.moveTo(Math.cos(a0)*OUTER,Math.sin(a0)*OUTER);shape.absarc(0,0,OUTER,a0,a1,false);shape.lineTo(Math.cos(a1)*INNER,Math.sin(a1)*INNER);shape.absarc(0,0,INNER,a1,a0,true);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:H,bevelEnabled:false,curveSegments:MOBILE?20:30});g.rotateX(-Math.PI/2);g.computeVertexNormals();return g}
function mat(ghost=false){return new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:!ghost,side:THREE.DoubleSide,uniforms:{uBlue:{value:new THREE.Color(ghost?'#a7d4ff':'#1764c5')},uIce:{value:new THREE.Color('#f7fcff')},uLight:{value:new THREE.Vector3(-4,10,7)},uOpacity:{value:ghost?.085:.62},uGhost:{value:ghost?1:0}}})}
function GlassTower({progress}){const active=useRef(),ghost=useRef(),geo=useMemo(makeGeometry,[]),activeMat=useMemo(()=>mat(false),[]),ghostMat=useMemo(()=>mat(true),[]);useLayoutEffect(()=>{const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1),axis=new THREE.Vector3(0,1,0);let ai=0,gi=0;for(let area=0;area<8;area++)for(let level=0;level<MAX;level++){p.set(0,level*STEP,0);q.setFromAxisAngle(axis,area*Math.PI/4);m.compose(p,q,s);const on=level<progress[area],mesh=on?active.current:ghost.current;mesh.setMatrixAt(on?ai++:gi++,m)}active.current.count=ai;ghost.current.count=gi;active.current.instanceMatrix.needsUpdate=true;ghost.current.instanceMatrix.needsUpdate=true},[progress]);return <><instancedMesh ref={ghost} args={[geo,ghostMat,48]} frustumCulled={false}/><instancedMesh ref={active} args={[geo,activeMat,48]} frustumCulled={false}/></>}
function Blueprint(){const rings=[INNER,OUTER,OUTER+.72,OUTER+1.25];return <group position={[0,.008,0]}>{rings.map((r,i)=><mesh key={r} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[r-.009,r+.009,MOBILE?72:120]}/><meshBasicMaterial color={i<2?'#9ba9b8':'#b7c2ce'} transparent opacity={i<2?.26:.14}/></mesh>)}{Array.from({length:8}).map((_,i)=>{const a=i*Math.PI/4,r=OUTER+.72;return <mesh key={i} position={[Math.cos(a)*r,.012,Math.sin(a)*r]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.085,.125,28]}/><meshBasicMaterial color="#438cff" transparent opacity={.82}/></mesh>})}</group>}
function Floor(){return <><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.035,0]}><circleGeometry args={[OUTER+1.45,72]}/><meshBasicMaterial color="#f1f7ff" transparent opacity={.52}/></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.045,0]}><ringGeometry args={[OUTER-.05,OUTER+.28,72]}/><meshBasicMaterial color="#a9ceff" transparent opacity={.075}/></mesh></>}
function Scene({progress}){const camera=MOBILE?{position:[12.7,8.25,13.2],fov:27}:{position:[12.3,8.35,12.9],fov:29};return <Canvas dpr={MOBILE?[1,1.5]:[1,1.7]} gl={{antialias:true,powerPreference:'high-performance',alpha:false}} camera={camera} frameloop="demand"><color attach="background" args={['#f8fafc']}/><Floor/><Blueprint/><GlassTower progress={progress}/><OrbitControls makeDefault target={[0,MOBILE?2.55:2.25,0]} minDistance={MOBILE?12.5:9.5} maxDistance={MOBILE?24:25} enablePan={false} enableDamping={false} minPolarAngle={.72} maxPolarAngle={1.17}/></Canvas>}
function App(){const[progress,setProgress]=useState(INITIAL),[open,setOpen]=useState(false);const update=(i,v)=>setProgress(p=>p.map((x,n)=>n===i?+v:x));return <main><div className="scene"><Scene progress={progress}/></div><header><div className="micro">SW8 / MODEL 04</div><h1>Strategic<br/>Decision Tower</h1><p>8 obszarów. Każdy ukończony blok buduje kolejny poziom strategii.</p></header><div className="meta">FROSTED GLASS / INSTANCED<br/>8 NODES / 6 LEVELS</div><button className="controlToggle" onClick={()=>setOpen(!open)}>{open?'ZAMKNIJ':'STEROWANIE'}</button>{open&&<aside><div className="buttons"><button onClick={()=>setProgress(Array(8).fill(MAX))}>Pełna wieża</button><button onClick={()=>setProgress(INITIAL)}>Reset</button></div>{AREAS.map((a,i)=><label key={a}><span>{String(i+1).padStart(2,'0')} / {a}</span><input type="range" min="0" max={MAX} value={progress[i]} onChange={e=>update(i,e.target.value)}/><b>{progress[i]}/{MAX}</b></label>)}</aside>}<div className="hint">DRAG → OBRÓT · PINCH / WHEEL → ZOOM</div></main>}
createRoot(document.getElementById('root')).render(<App/>)
