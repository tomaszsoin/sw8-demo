import * as THREE from 'three'

const originalPhysicalSetValues = THREE.MeshPhysicalMaterial.prototype.setValues

THREE.MeshPhysicalMaterial.prototype.setValues = function(values){
  if(values && typeof values === 'object' && 'transmission' in values){
    const next={...values}
    const mobile=typeof window!=='undefined'&&matchMedia('(max-width:700px)').matches
    next.transmission=Math.min(1,Math.max(next.transmission??0,mobile?.74:.90))
    if(typeof next.thickness==='number')next.thickness*=.80
    if(typeof next.attenuationDistance==='number')next.attenuationDistance=Math.max(next.attenuationDistance,24)
    values=next
  }
  return originalPhysicalSetValues.call(this,values)
}

// Give unfinished blocks a very light neutral fill so their volume remains readable,
// while the dashed outline still carries the primary "not completed" state.
const originalShaderSetValues = THREE.ShaderMaterial.prototype.setValues
THREE.ShaderMaterial.prototype.setValues = function(values){
  if(values && typeof values === 'object' && values.uniforms?.uGhost?.value>.5 && values.uniforms?.uOpacity){
    values={
      ...values,
      uniforms:{
        ...values.uniforms,
        uOpacity:{...values.uniforms.uOpacity,value:.08},
      },
    }
  }
  return originalShaderSetValues.call(this,values)
}

// Keep unfinished blocks clearly visible without competing with completed glass.
// Target only the ghost-outline dashed material used by the SW8 tower.
const originalDashedSetValues = THREE.LineDashedMaterial.prototype.setValues
THREE.LineDashedMaterial.prototype.setValues = function(values){
  if(values && typeof values === 'object'){
    const colorValue=values.color
    const isGhostOutline=colorValue==='#8b919d'||colorValue===0x8b919d||values.opacity===.22
    if(isGhostOutline){
      values={
        ...values,
        color:'#7f8ba6',
        opacity:.34,
        dashSize:.085,
        gapSize:.060,
      }
    }
  }
  return originalDashedSetValues.call(this,values)
}

function markVersion(){
  const el=document.querySelector('.micro')
  if(!el){requestAnimationFrame(markVersion);return}
  if(el.textContent?.includes('SW8 / MODEL'))el.textContent='SW8 / MODEL 29'
}
requestAnimationFrame(markVersion)
