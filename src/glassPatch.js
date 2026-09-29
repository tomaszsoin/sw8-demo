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

// Give unfinished blocks a subtle cool-gray body that is readable against the
// light scene background, while remaining much quieter than completed blocks.
const originalShaderSetValues = THREE.ShaderMaterial.prototype.setValues
THREE.ShaderMaterial.prototype.setValues = function(values){
  if(values && typeof values === 'object' && values.uniforms?.uGhost?.value>.5 && values.uniforms?.uOpacity){
    const ghostSource='if(uGhost>.5){col=mix(vec3(.955,.958,.968),uBlue,.075);col=mix(col,vec3(1.0),top*.08+edge*.11);}'
    const ghostFill='if(uGhost>.5){col=mix(vec3(.84,.86,.90),uBlue,.18);col=mix(col,vec3(.97,.975,.985),top*.05+edge*.08);}'
    values={
      ...values,
      fragmentShader:typeof values.fragmentShader==='string'?values.fragmentShader.replace(ghostSource,ghostFill):values.fragmentShader,
      uniforms:{
        ...values.uniforms,
        uOpacity:{...values.uniforms.uOpacity,value:.16},
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

// Mobile-only polish: keep HUD labels outside the tower, stack their content
// vertically, and soften the full-screen vignette.
function installMobilePolish(){
  if(typeof document==='undefined')return
  const style=document.createElement('style')
  style.setAttribute('data-sw8-mobile-polish','')
  style.textContent=`
    @media (max-width:700px){
      .backgroundFx{
        background:radial-gradient(ellipse at 50% 47%,rgba(255,255,255,.26) 0%,rgba(247,247,247,.04) 48%,rgba(235,236,239,.10) 72%,rgba(214,216,222,.24) 100%)!important;
      }
      .backgroundFx::before{
        background:radial-gradient(ellipse at 50% 50%,transparent 58%,rgba(184,188,197,.04) 80%,rgba(158,163,174,.09) 100%)!important;
      }
      .hudLabel{
        flex-direction:column!important;
        gap:2px!important;
        max-width:78px!important;
        align-items:flex-start!important;
        margin-left:12px;
      }
      .hudLabel[data-side="left"]{
        flex-direction:column!important;
        align-items:flex-end!important;
        margin-left:-12px;
      }
      .hudLabelNum{font-size:9px!important;line-height:1!important;}
      .hudLabelCopy{min-width:0!important;max-width:76px!important;gap:1px!important;}
      .hudLabel[data-side="left"] .hudLabelCopy{text-align:right!important;align-items:flex-end!important;}
      .hudLabelCopy strong{font-size:4.8px!important;max-width:76px!important;line-height:1.18!important;}
      .hudLabelCopy span{font-size:4.6px!important;}
      .hudLabelBars{margin-top:1px!important;}
      .hudLabelBars i{width:3px!important;height:3px!important;}
    }
  `
  document.head.appendChild(style)
}
installMobilePolish()

function markVersion(){
  const el=document.querySelector('.micro')
  if(!el){requestAnimationFrame(markVersion);return}
  if(el.textContent?.includes('SW8 / MODEL'))el.textContent='SW8 / MODEL 29'
}
requestAnimationFrame(markVersion)
