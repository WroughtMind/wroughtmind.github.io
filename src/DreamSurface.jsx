import { useEffect, useRef } from 'react';
import { startCanvasSurface } from './canvas-surface.js';
import { startSurfaceMotion } from './surface-motion.js';
import { loadWovenMarks, drawWovenMarks } from './woven-marks.js';
const vertex='attribute vec3 position;attribute vec2 uv;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}';
const fragment=`
precision highp float;
uniform sampler2D uLight; uniform sampler2D uDark;
uniform vec2 uResolution; uniform vec2 uPointer; uniform vec2 uRipple;
uniform float uTime; uniform float uTheme; uniform float uRippleTime; uniform float uMotion; uniform float uInteraction;
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
 vec2 gesture=-(uv-uPointer)*.014*exp(-dot(delta,delta)*5.0)*uInteraction;
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
 const hostRef=useRef(null), runtime=useRef(null), preferences=useRef({theme,motion}); preferences.current={theme,motion};
 useEffect(()=>{
  const host=hostRef.current, parent=host.closest('.flag-field')||host.closest('.hero');
  let disposed=false,gl=null,program=null,buffers=[],textures=[],shaders=[],ro,glCanvas,marksReady=false;
  const contextLost=()=>{delete host.dataset.marks;host.classList.remove('ready');runtime.current?.dispose();};
  const free=()=>{if(!gl)return;textures.forEach(t=>gl.deleteTexture(t));buffers.forEach(b=>gl.deleteBuffer(b));shaders.forEach(s=>gl.deleteShader(s));if(program)gl.deleteProgram(program);textures=[];buffers=[];shaders=[];program=null;gl=null;};
  async function start(){try{
   glCanvas=document.createElement('canvas');
   gl=glCanvas.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'low-power'});
   if(!gl){runtime.current=startCanvasSurface(host,preferences,parent);return;}
   host.dataset.engine='webgl';
   const compile=(type,source)=>{const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader)||'shader');return shader;};
   program=gl.createProgram();
   gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));
   gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));
   gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'link');
   gl.useProgram(program);
   const uniform={};for(const name of ['uLight','uDark','uResolution','uPointer','uRipple','uTime','uTheme','uRippleTime','uMotion','uInteraction'])uniform[name]=gl.getUniformLocation(program,name);
   // One fullscreen strip; vUv grows upward like the previous PlaneGeometry setup.
   const quad=gl.createBuffer();buffers.push(quad);gl.bindBuffer(gl.ARRAY_BUFFER,quad);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,0,0,0, 1,-1,0,1,0, -1,1,0,0,1, 1,1,0,1,1]),gl.STATIC_DRAW);
   const aPosition=gl.getAttribLocation(program,'position'),aUv=gl.getAttribLocation(program,'uv');
   gl.enableVertexAttribArray(aPosition);gl.vertexAttribPointer(aPosition,3,gl.FLOAT,false,20,0);
   gl.enableVertexAttribArray(aUv);gl.vertexAttribPointer(aUv,2,gl.FLOAT,false,20,12);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   const loadImage=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(src));img.src=src;});
   const [images,marks]=await Promise.all([Promise.all(['/assets/dream-light.webp','/assets/dream-dark.webp'].map(loadImage)),loadWovenMarks(parent)]);
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
   glCanvas.setAttribute('aria-hidden','true');glCanvas.addEventListener('webglcontextlost',contextLost);host.appendChild(glCanvas);
   const material=document.createElement('canvas'),context=material.getContext('2d');
   const resize=()=>{
    const r=host.getBoundingClientRect(),pr=Math.min(devicePixelRatio,1.65),a=r.width/r.height;
    glCanvas.width=Math.max(1,Math.floor(r.width*pr));glCanvas.height=Math.max(1,Math.floor(r.height*pr));
    gl.viewport(0,0,glCanvas.width,glCanvas.height);gl.uniform2f(uniform.uResolution,r.width,r.height);
    marksReady=!!(marks&&context);delete host.dataset.marks;
    if(context){images.forEach((img,i)=>{
     material.width=img.naturalWidth;material.height=img.naturalHeight;context.drawImage(img,0,0);
     const width=material.width*Math.min(a/1.5,1),height=material.height*Math.min(1.5/a,1);
     try{marksReady=drawWovenMarks(context,marks,host,{x:(material.width-width)/2,y:(material.height-height)/2,width,height,dark:!!i})&&marksReady;}catch{marksReady=false;}
     gl.activeTexture(i?gl.TEXTURE1:gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,textures[i]);
     gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,material);
    });}
    runtime.current?.refresh();
   };
   ro=new ResizeObserver(resize);ro.observe(host);resize();
   runtime.current=startSurfaceMotion(host,parent,preferences,s=>{
    gl.uniform1f(uniform.uTime,s.time);gl.uniform1f(uniform.uTheme,s.mix);gl.uniform1f(uniform.uMotion,s.moving);gl.uniform1f(uniform.uRippleTime,s.rippleAge);gl.uniform1f(uniform.uInteraction,s.interaction);
    gl.uniform2f(uniform.uPointer,s.x,1-s.y);gl.uniform2f(uniform.uRipple,s.rippleX,1-s.rippleY);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    if(marksReady&&!gl.isContextLost())host.dataset.marks='woven';
   });
  }catch(error){delete host.dataset.marks;ro?.disconnect();runtime.current?.dispose();glCanvas?.remove();free();if(!disposed)runtime.current=startCanvasSurface(host,preferences,parent);}}
  start();
  return()=>{disposed=true;delete host.dataset.marks;runtime.current?.dispose();runtime.current=null;ro?.disconnect();glCanvas?.removeEventListener('webglcontextlost',contextLost);const context=gl;free();context?.getExtension('WEBGL_lose_context')?.loseContext();host.replaceChildren();};
 },[]);
 useEffect(()=>{runtime.current?.refresh();},[theme,motion]);
 return <div ref={hostRef} className="dream-canvas"/>;
}
