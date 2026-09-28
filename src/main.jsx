import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './styles.css'

const AREAS=['WHY','WHO','FOR WHOM','CONTEXT','OFFER','MESSAGE','CHANNELS','SYSTEM']
const INITIAL=[3,5,4,2,4,3,5,3], MAX=6
const MOBILE=typeof window!=='undefined'&&matchMedia('(max-width:700px)').matches
const INNER=MOBILE?1.5:1.9, OUTER=MOBILE?2.72:3.65, H=MOBILE?1.02:.82, STEP=MOBILE?1.045:.845
const MAX_DIST=MOBILE?26:27
const ULTRAMARINE='#304FFE'

const vertex=`
varying vec3 vN;varying vec3 vW;varying float vY;varying vec3 vObj;
void main(){vec4 world=modelMatrix*instanceMatrix*vec4(position,1.0);vW=world.xyz;vN=normalize(mat3(modelMatrix*instanceMatrix)*normal);vY=position.y;vObj=position;gl_Position=projectionMatrix*viewMatrix*world;}`
const fragment=`
uniform vec3 uBlue;uniform vec3 uIce;uniform vec3 uLight;uniform float uOpacity;uniform float uGhost;
varying vec3 vN;varying vec3 vW;varying float vY;varying vec3 vObj;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
void main(){
 vec3 N=normalize(vN),V=normalize(cameraPosition-vW),L=normalize(uLight);
 float ndv=max(dot(N,V),0.0),fres=pow(1.0-ndv,3.7),diffuse=max(dot(N,L),0.0);
 float top=smoothstep(.05,.96,vY),edge=smoothstep(.10,.91,fres),facing=smoothstep(.16,.90,ndv);
 float n=hash(floor(vObj*28.0))*2.0-1.0;
 float softBand=.5+.5*sin(vW.y*2.7+vW.x*.28-vW.z*.22);
 vec3 col=mix(uBlue,uIce,.31+top*.31+diffuse*.30);
 col=mix(col,uIce,edge*.72);
 col=mix(col,vec3(.82,.86,1.0),softBand*.055);
 col+=n*.012;
 col+=vec3(.13,.16,.72)*(1.0-top)*.055;
 if(uGhost>.5) col=mix(col,vec3(.965,.975,1.0),.83);
 float alpha=uOpacity*(.66+edge*.27+facing*.045);
 gl_FragColor=vec4(col,alpha);
}`
function makeGeometry(){const shape=new THREE.Shape(),a0=-Math.PI/8+.006,a1=Math.PI/8-.006;shape.moveTo(Math.cos(a0)*OUTER,Math.sin(a0)*OUTER);shape.absarc(0,0,OUTER,a0,a1,false);shape.lineTo(Math.cos(a1)*INNER,Math.sin(a1)*INNER);shape.absarc(0,0,INNER,a1,a0,true);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:H,bevelEnabled:false,curveSegments:MOBILE?20:30});g.rotateX(-Math.PI/2);g.computeVertexNormals();return g}
function mat(ghost=false){return new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:!ghost,side:THREE.DoubleSide,uniforms:{uBlue:{value:new THREE.Color(ghost?'#bdc7ff':ULTRAMARINE)},uIce:{value:new THREE.Color('#fbfcff')},uLight:{value:new THREE.Vector3(-4,10,7)},uOpacity:{value:ghost?.075:.61},uGhost:{value:ghost?1:0}}})}
function GlassTower({progress}){const active=useRef(),ghost=useRef(),geo=useMemo(makeGeometry,[]),activeMat=useMemo(()=>mat(false),[]),ghostMat=useMemo(()=>mat(true),[]),{invalidate}=useThree();useLayoutEffect(()=>{const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1),axis=new THREE.Vector3(0,1,0);let ai=0,gi=0;for(let area=0;area<8;area++)for(let level=0;level<MAX;level++){p.set(0,level*STEP,0);q.setFromAxisAngle(axis,area*Math.PI/4);m.compose(p,q,s);const on=level<progress[area],mesh=on?active.current:ghost.current;mesh.setMatrixAt(on?ai++:gi++,m)}active.current.count=ai;ghost.current.count=gi;active.current.instanceMatrix.needsUpdate=true;ghost.current.instanceMatrix.needsUpdate=true;invalidate()},[progress,invalidate]);return <><instancedMesh ref={ghost} args={[geo,ghostMat,48]} frustumCulled={false}/><instancedMesh ref={active} args={[geo,activeMat,48]} frustumCulled={false}/></>}
function Blueprint(){const rings=[INNER,OUTER,OUTER+.72,OUTER+1.25];return <group position={[0,.008,0]}>{rings.map((r,i)=><mesh key={r} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[r-.009,r+.009,MOBILE?72:120]}/><meshBasicMaterial color={i<2?'#a6b2bf':'#c0c9d3'} transparent opacity={i<2?.22:.12}/></mesh>)}{Array.from({length:8}).map((_,i)=>{const a=i*Math.PI/4,r=OUTER+.72;return <mesh key={i} position={[Math.cos(a)*r,.012,Math.sin(a)*r]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.085,.125,28]}/><meshBasicMaterial color={ULTRAMARINE} transparent opacity={.72}/></mesh>})}</group>}
function Floor(){return <><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.035,0]}><circleGeometry args={[OUTER+1.45,72]}/><meshBasicMaterial color="#f5f7fd" transparent opacity={.48}/></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.045,0]}><ringGeometry args={[OUTER-.05,OUTER+.28,72]}/><meshBasicMaterial color="#c4ccff" transparent opacity={.065}/></mesh></>}
function Scene({progress}){const targetY=MOBILE?2.55:2.25;const target=new THREE.Vector3(0,targetY,0);const dir=new THREE.Vector3(1,.46,1.04).normalize();const pos=target.clone().add(dir.multiplyScalar(MAX_DIST));const camera={position:pos.toArray(),fov:MOBILE?27:29};return <Canvas dpr={MOBILE?[1,1.5]:[1,1.7]} gl={{antialias:true,powerPreference:'high-performance',alpha:false}} camera={camera} frameloop="demand"><color attach="background" args={['#fafbfe']}/><Floor/><Blueprint/><GlassTower progress={progress}/><OrbitControls makeDefault target={[0,targetY,0]} minDistance={MOBILE?12.5:9.5} maxDistance={MAX_DIST} enablePan={false} enableDamping={false} minPolarAngle={.72} maxPolarAngle={1.17}/></Canvas>}
function App(){const[progress,setProgress]=useState(INITIAL),[open,setOpen]=useState(false);const update=(i,v)=>setProgress(p=>p.map((x,n)=>n===i?+v:x));return <main><div className="scene"><Scene progress={progress}/></div><header><div className="micro">SW8 / MODEL 06</div><h1>Strategic<br/>Decision Tower</h1><p>8 obszarów. Każdy ukończony blok buduje kolejny poziom strategii.</p></header><div className="meta">FROSTED GLASS / INSTANCED<br/>8 NODES / 6 LEVELS</div><button className="controlToggle" onClick={()=>setOpen(!open)}>{open?'ZAMKNIJ':'STEROWANIE'}</button>{open&&<aside><div className="buttons"><button onClick={()=>setProgress(Array(8).fill(MAX))}>Pełna wieża</button><button onClick={()=>setProgress(INITIAL)}>Reset</button></div>{AREAS.map((a,i)=><label key={a}><span>{String(i+1).padStart(2,'0')} / {a}</span><input type="range" min="0" max={MAX} value={progress[i]} onInput={e=>update(i,e.currentTarget.value)} onChange={e=>update(i,e.currentTarget.value)}/><b>{progress[i]}/{MAX}</b></label>)}</aside>}<div className="hint">DRAG → OBRÓT · PINCH / WHEEL → ZOOM</div></main>}
createRoot(document.getElementById('root')).render(<App/>)
