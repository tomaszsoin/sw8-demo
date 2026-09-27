import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './styles.css'

const AREAS = ['WHY','WHO','FOR WHOM','CONTEXT','OFFER','MESSAGE','CHANNELS','SYSTEM']
const INITIAL = [3,5,4,2,4,3,5,3]
const MAX = 6
const MOBILE = typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches
const INNER = MOBILE ? 1.62 : 2.05
const OUTER = MOBILE ? 3.18 : 4.05
const BLOCK_HEIGHT = MOBILE ? .86 : .66
const LEVEL_STEP = MOBILE ? .88 : .68

function Wedge({ index, level, active }) {
  const geometry = useMemo(() => {
    const count = 8
    const gap = 0.018
    const step = (Math.PI * 2) / count
    const a0 = -Math.PI / 2 - step / 2 + index * step + gap
    const a1 = a0 + step - gap * 2
    const shape = new THREE.Shape()
    shape.moveTo(Math.cos(a0) * OUTER, Math.sin(a0) * OUTER)
    shape.absarc(0, 0, OUTER, a0, a1, false)
    shape.lineTo(Math.cos(a1) * INNER, Math.sin(a1) * INNER)
    shape.absarc(0, 0, INNER, a1, a0, true)
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: BLOCK_HEIGHT, bevelEnabled: false, curveSegments: MOBILE ? 10 : 18 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [index])

  const white = (index + level) % 4 === 0
  return (
    <mesh geometry={geometry} position={[0, level * LEVEL_STEP, 0]}>
      <meshPhysicalMaterial
        color={white ? '#edf6ff' : '#1670ff'}
        transparent
        opacity={active ? .7 : .055}
        transmission={MOBILE ? 0 : active ? .18 : .35}
        roughness={white ? .38 : .3}
        thickness={MOBILE ? 0 : .45}
        clearcoat={MOBILE ? .18 : .4}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function Blueprint() {
  const s = MOBILE ? .785 : 1
  const rings = [2.05*s, 4.15*s, 5.0*s, 5.7*s]
  return <group position={[0,.01,0]}>
    {rings.map((r,i) => <mesh key={r} rotation={[-Math.PI/2,0,0]}>
      <ringGeometry args={[r-.012,r+.012,MOBILE ? 48 : 96]} />
      <meshBasicMaterial color={i < 2 ? '#9eabbc' : '#b8c3d0'} transparent opacity={i < 2 ? .36 : .24} />
    </mesh>)}
    {Array.from({length:8}).map((_,i)=>{
      const a=i/8*Math.PI*2
      const r=5*s
      return <mesh key={i} position={[Math.cos(a)*r, .01, Math.sin(a)*r]} rotation={[-Math.PI/2,0,0]}>
        <ringGeometry args={[.105,.15,MOBILE ? 16 : 24]} />
        <meshBasicMaterial color="#1769ff" />
      </mesh>
    })}
  </group>
}

function Tower({ progress }) {
  return <>
    <Blueprint />
    <group>
      {progress.flatMap((value,i)=>Array.from({length:MAX}).map((_,level)=><Wedge key={`${i}-${level}`} index={i} level={level} active={level < value}/>))}
    </group>
  </>
}

function Scene({ progress }) {
  const camera = MOBILE
    ? { position:[10.8,6.4,11.2], fov:32 }
    : { position:[9.6,6.2,10], fov:32 }
  return <Canvas dpr={MOBILE ? 1 : [1,1.5]} gl={{ antialias: !MOBILE, powerPreference:'high-performance' }} camera={camera} frameloop="demand">
    <color attach="background" args={['#f6f8fb']} />
    <ambientLight intensity={1.8}/>
    <directionalLight position={[6,10,7]} intensity={3.1} />
    <directionalLight position={[-6,4,-4]} intensity={1.25} color="#83b7ff" />
    <Tower progress={progress}/>
    <OrbitControls makeDefault target={[0,MOBILE ? 2.05 : 1.7,0]} minDistance={MOBILE ? 13.5 : 9} maxDistance={22} enablePan={false} enableDamping={false} minPolarAngle={.66} maxPolarAngle={1.25}/>
  </Canvas>
}

function App(){
  const [progress,setProgress]=useState(INITIAL)
  const [open,setOpen]=useState(false)
  const update=(i,v)=>setProgress(p=>p.map((x,n)=>n===i?Number(v):x))
  return <main>
    <div className="scene"><Scene progress={progress}/></div>
    <header><div className="micro">SW8 / MODEL 01</div><h1>Strategic<br/>Decision Tower</h1><p>8 obszarów. Każdy ukończony blok buduje kolejny poziom strategii.</p></header>
    <div className="meta">FROSTED GLASS SYSTEM<br/>8 NODES / 6 LEVELS</div>
    <button className="controlToggle" onClick={()=>setOpen(!open)}>{open?'ZAMKNIJ':'STEROWANIE'}</button>
    {open && <aside>
      <div className="buttons"><button onClick={()=>setProgress(Array(8).fill(MAX))}>Pełna wieża</button><button onClick={()=>setProgress(INITIAL)}>Reset</button></div>
      {AREAS.map((a,i)=><label key={a}><span>{String(i+1).padStart(2,'0')} / {a}</span><input type="range" min="0" max={MAX} value={progress[i]} onChange={e=>update(i,e.target.value)}/><b>{progress[i]}/{MAX}</b></label>)}
    </aside>}
    <div className="hint">DRAG → OBRÓT · PINCH / WHEEL → ZOOM</div>
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
