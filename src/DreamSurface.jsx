import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { startCanvasSurface } from './canvas-surface.js';
const vertex = 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}';
const fragment = `
precision highp float;
uniform sampler2D uLight; uniform sampler2D uDark;
uniform vec2 uResolution; uniform vec2 uPointer; uniform vec2 uRipple;
uniform float uTime; uniform float uTheme; uniform float uRippleTime; uniform float uMotion;
varying vec2 vUv;
vec2 coverUV(vec2 uv){
 float a=uResolution.x/uResolution.y;
 return (uv-.5)*vec2(min(a/1.5,1.0),min(1.5/a,1.0))+.5;
}
void main(){
 vec2 uv=vUv; float t=uTime; vec2 p=uv*vec2(uResolution.x/uResolution.y,1.0);
 float w1=sin(p.x*11.0+p.y*6.0-t*.47+sin(p.y*8.0+t*.19));
 float w2=sin(p.x*5.0-p.y*14.0+t*.36);
 vec2 water=vec2(w1*.0047+w2*.0022,cos(p.x*12.0+p.y*8.0+t*.31)*.004);
 float fold=sin(uv.y*8.0+uv.x*3.0-t*.3);
 float fold2=sin(uv.y*15.0-uv.x*4.0-t*.21);
 vec2 fabric=vec2(fold*.012+fold2*.003,cos(uv.x*7.0+uv.y*3.0-t*.26)*.006);
 vec2 delta=(uv-uPointer)*vec2(uResolution.x/uResolution.y,1.0);
 vec2 gesture=vec2(sin(t*.5+delta.y*4.0),cos(t*.4+delta.x*3.0))*.0018*exp(-dot(delta,delta)*4.0);
 vec2 rd=(uv-uRipple)*vec2(uResolution.x/uResolution.y,1.0); float dist=length(rd); float age=max(uRippleTime,0.0);
 float envelope=exp(-age*.75)*exp(-pow((dist-age*.18)*7.0,2.0));
 vec2 ripple=normalize(rd+vec2(.0001))*sin(dist*42.0-age*7.0)*envelope*.006;
 vec2 base=coverUV(uv);
 vec3 light=texture2D(uLight,clamp(base+(fabric+gesture+ripple*.45)*uMotion,vec2(.001),vec2(.999))).rgb;
 vec3 dark=texture2D(uDark,clamp(base+(water+gesture+ripple)*uMotion,vec2(.001),vec2(.999))).rgb;
 light*=1.0+(fold*.014+fold2*.005)*uMotion;
 dark*=1.0+(w1*.035+w2*.018)*uMotion;
 gl_FragColor=vec4(mix(light,dark,uTheme),1.0);
}`;
export default function DreamSurface({theme,motion}){
 const hostRef=useRef(null), preferences=useRef({theme,motion}); preferences.current={theme,motion};
 useEffect(()=>{
  const host=hostRef.current, parent=host.closest('.hero');
  let disposed=false,frame=0,renderer,geometry,material,textures=[],ro,io,visible=true,last=0,time=0,rippleAt=-100,fallbackCleanup;
  let mix=preferences.current.theme==='dark'?1:0, moving=preferences.current.motion?1:0;
  const target=new THREE.Vector2(.5,.5),pointer=new THREE.Vector2(.5,.5),ripple=new THREE.Vector2(.5,.5);
  const move=e=>{const r=parent.getBoundingClientRect();target.set((e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height);};
  const touch=e=>{move(e);ripple.copy(target);rippleAt=time;};
  const leave=()=>target.set(.5,.5);
  async function start(){try{
   const glCanvas=document.createElement('canvas');
   const gl=glCanvas.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'low-power'});
   if(!gl){fallbackCleanup=startCanvasSurface(host,preferences,parent);return;}
   host.dataset.engine='webgl';
   renderer=new THREE.WebGLRenderer({canvas:glCanvas,context:gl,antialias:false,alpha:false,powerPreference:'low-power'});
   renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
   const loader=new THREE.TextureLoader();
   textures=await Promise.all(['/assets/dream-light.png','/assets/dream-dark.png'].map(p=>loader.loadAsync(p)));
   if(disposed){textures.forEach(t=>t.dispose());renderer.dispose();return;}
   textures.forEach(t=>{t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;});
   const u={uLight:{value:textures[0]},uDark:{value:textures[1]},uResolution:{value:new THREE.Vector2(1440,900)},uTime:{value:0},uTheme:{value:mix},uPointer:{value:pointer},uRipple:{value:ripple},uRippleTime:{value:100},uMotion:{value:moving}};
   material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:u,depthTest:false,depthWrite:false});
   geometry=new THREE.PlaneGeometry(2,2);const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);scene.add(new THREE.Mesh(geometry,material));
   renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
   const resize=()=>{const r=host.getBoundingClientRect();renderer.setSize(r.width,r.height);u.uResolution.value.set(r.width,r.height);};
   ro=new ResizeObserver(resize);ro.observe(host);resize();io=new IntersectionObserver(es=>{visible=es[0].isIntersecting;},{rootMargin:'120px'});io.observe(host);
   parent.addEventListener('pointermove',move,{passive:true});parent.addEventListener('pointerdown',touch,{passive:true});parent.addEventListener('pointerleave',leave,{passive:true});
   let rendered=false;
   function render(now){
    if(disposed)return;frame=requestAnimationFrame(render);const elapsed=last?Math.min((now-last)/1000,1):.016,dt=Math.min(elapsed,.05);last=now;
    if(!visible||document.hidden)return;
    const next=preferences.current.theme==='dark'?1:0, movingTo=preferences.current.motion?1:0;
    const changing=Math.abs(mix-next)>.0001||Math.abs(moving-movingTo)>.0001;
    if(!movingTo&&!changing&&rendered)return;
    time+=dt*moving;mix=THREE.MathUtils.damp(mix,next,3.6,elapsed);moving=THREE.MathUtils.damp(moving,movingTo,3.6,elapsed);pointer.lerp(target,1-Math.exp(-3*dt));
    u.uTime.value=time;u.uTheme.value=mix;u.uMotion.value=moving;u.uRippleTime.value=time-rippleAt;
    renderer.render(scene,camera);rendered=true;host.classList.add('ready');
   }frame=requestAnimationFrame(render);
  }catch(error){renderer?.dispose();if(!disposed)fallbackCleanup=startCanvasSurface(host,preferences,parent);}}
  start();
  return()=>{disposed=true;fallbackCleanup?.();cancelAnimationFrame(frame);ro?.disconnect();io?.disconnect();parent.removeEventListener('pointermove',move);parent.removeEventListener('pointerdown',touch);parent.removeEventListener('pointerleave',leave);geometry?.dispose();material?.dispose();textures.forEach(t=>t.dispose());renderer?.dispose();host.replaceChildren();};
 },[]);
 return <div ref={hostRef} className="dream-canvas"/>;
}
