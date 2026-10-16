import { useEffect, useRef } from 'react';
import { startCanvasSurface } from './canvas-surface.js';
const vertex='attribute vec3 position;attribute vec2 uv;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}';
const fragment=`
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
  let disposed=false,frame=0,gl=null,program=null,buffers=[],textures=[],ro,io,visible=true,last=0,time=0,rippleAt=-100,fallbackCleanup;
  let mix=preferences.current.theme==='dark'?1:0, moving=preferences.current.motion?1:0;
  let px=.5,py=.5,tx=.5,ty=.5,rx=.5,ry=.5;
  const move=e=>{const r=parent.getBoundingClientRect();tx=(e.clientX-r.left)/r.width;ty=1-(e.clientY-r.top)/r.height;};
  const touch=e=>{move(e);rx=tx;ry=ty;rippleAt=time;};
  const leave=()=>{tx=.5;ty=.5;};
  const damp=(from,to,lambda,dt)=>from+(to-from)*(1-Math.exp(-lambda*dt));
  const free=()=>{if(!gl)return;textures.forEach(t=>gl.deleteTexture(t));buffers.forEach(b=>gl.deleteBuffer(b));if(program)gl.deleteProgram(program);textures=[];buffers=[];program=null;gl=null;};
  async function start(){try{
   const glCanvas=document.createElement('canvas');
   gl=glCanvas.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'low-power'});
   if(!gl){fallbackCleanup=startCanvasSurface(host,preferences,parent);return;}
   host.dataset.engine='webgl';
   const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader)||'shader');return shader;};
   program=gl.createProgram();
   gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));
   gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));
   gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'link');
   gl.useProgram(program);
   const uniform={};for(const name of ['uLight','uDark','uResolution','uPointer','uRipple','uTime','uTheme','uRippleTime','uMotion'])uniform[name]=gl.getUniformLocation(program,name);
   // One fullscreen strip; vUv grows upward like the previous PlaneGeometry setup.
   const quad=gl.createBuffer();buffers.push(quad);gl.bindBuffer(gl.ARRAY_BUFFER,quad);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,0,0,0, 1,-1,0,1,0, -1,1,0,0,1, 1,1,0,1,1]),gl.STATIC_DRAW);
   const aPosition=gl.getAttribLocation(program,'position'),aUv=gl.getAttribLocation(program,'uv');
   gl.enableVertexAttribArray(aPosition);gl.vertexAttribPointer(aPosition,3,gl.FLOAT,false,20,0);
   gl.enableVertexAttribArray(aUv);gl.vertexAttribPointer(aUv,2,gl.FLOAT,false,20,12);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   const loadImage=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(src));img.src=src;});
   const images=await Promise.all(['/assets/dream-light.webp','/assets/dream-dark.webp'].map(loadImage));
   if(disposed)return;
   images.forEach((img,i)=>{
    const texture=gl.createTexture();textures.push(texture);
    gl.activeTexture(i?gl.TEXTURE1:gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.uniform1i(uniform[i?'uDark':'uLight'],i);
   });
   gl.uniform2f(uniform.uResolution,1440,900);
   gl.uniform1f(uniform.uTheme,mix);gl.uniform1f(uniform.uMotion,moving);gl.uniform1f(uniform.uRippleTime,100);
   gl.uniform2f(uniform.uPointer,px,py);gl.uniform2f(uniform.uRipple,rx,ry);
   glCanvas.setAttribute('aria-hidden','true');host.appendChild(glCanvas);
   const resize=()=>{const r=host.getBoundingClientRect(),pr=Math.min(devicePixelRatio,1.65);glCanvas.width=Math.max(1,Math.floor(r.width*pr));glCanvas.height=Math.max(1,Math.floor(r.height*pr));gl.viewport(0,0,glCanvas.width,glCanvas.height);gl.uniform2f(uniform.uResolution,r.width,r.height);};
   ro=new ResizeObserver(resize);ro.observe(host);resize();
   io=new IntersectionObserver(es=>{visible=es[0].isIntersecting;},{rootMargin:'120px'});io.observe(host);
   parent.addEventListener('pointermove',move,{passive:true});parent.addEventListener('pointerdown',touch,{passive:true});parent.addEventListener('pointerleave',leave,{passive:true});
   let rendered=false;
   function render(now){
    if(disposed)return;frame=requestAnimationFrame(render);const elapsed=last?Math.min((now-last)/1000,1):.016,dt=Math.min(elapsed,.05);last=now;
    if(!visible||document.hidden)return;
    const next=preferences.current.theme==='dark'?1:0, movingTo=preferences.current.motion?1:0;
    const changing=Math.abs(mix-next)>.0001||Math.abs(moving-movingTo)>.0001;
    if(!movingTo&&!changing&&rendered)return;
    time+=dt*moving;mix=damp(mix,next,3.6,elapsed);moving=damp(moving,movingTo,3.6,elapsed);
    const k=1-Math.exp(-3*dt);px+=(tx-px)*k;py+=(ty-py)*k;
    gl.uniform1f(uniform.uTime,time);gl.uniform1f(uniform.uTheme,mix);gl.uniform1f(uniform.uMotion,moving);gl.uniform1f(uniform.uRippleTime,time-rippleAt);
    gl.uniform2f(uniform.uPointer,px,py);gl.uniform2f(uniform.uRipple,rx,ry);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);rendered=true;host.classList.add('ready');
   }frame=requestAnimationFrame(render);
  }catch(error){free();if(!disposed)fallbackCleanup=startCanvasSurface(host,preferences,parent);}}
  start();
  return()=>{disposed=true;fallbackCleanup?.();cancelAnimationFrame(frame);ro?.disconnect();io?.disconnect();parent.removeEventListener('pointermove',move);parent.removeEventListener('pointerdown',touch);parent.removeEventListener('pointerleave',leave);const context=gl;free();context?.getExtension('WEBGL_lose_context')?.loseContext();host.replaceChildren();};
 },[]);
 return <div ref={hostRef} className="dream-canvas"/>;
}
