import * as THREE from 'three'

const originalSetValues = THREE.MeshPhysicalMaterial.prototype.setValues

THREE.MeshPhysicalMaterial.prototype.setValues = function(values){
  if(values && typeof values === 'object' && 'transmission' in values){
    const next={...values}
    const mobile=typeof window!=='undefined'&&matchMedia('(max-width:700px)').matches
    next.transmission=Math.min(1,Math.max(next.transmission??0,mobile?.74:.90))
    if(typeof next.thickness==='number')next.thickness*=.80
    if(typeof next.attenuationDistance==='number')next.attenuationDistance=Math.max(next.attenuationDistance,24)
    values=next
  }
  return originalSetValues.call(this,values)
}

function markVersion(){
  const el=document.querySelector('.micro')
  if(!el){requestAnimationFrame(markVersion);return}
  if(el.textContent?.includes('SW8 / MODEL'))el.textContent='SW8 / MODEL 29'
}
requestAnimationFrame(markVersion)
