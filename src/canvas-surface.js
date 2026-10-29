// A genuine two-pass image refraction path for browsers without WebGL.
import { startSurfaceMotion } from './surface-motion.js';
import { loadWovenMarks, drawWovenMarks } from './woven-marks.js';

export function startCanvasSurface(host, preferences, parent) {
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)return{refresh(){},dispose(){}};
 host.appendChild(canvas);host.dataset.engine='canvas';canvas.setAttribute('aria-hidden','true');
 let dead=false,w=0,h=0,motion,marks=null,marksReady=false;
 const images=['/assets/dream-light.webp','/assets/dream-dark.webp'].map(src=>{const i=new Image();i.src=src;return i;});
 const source=[document.createElement('canvas'),document.createElement('canvas')];
 const pass=document.createElement('canvas'),passCtx=pass.getContext('2d',{alpha:false});
 const pad=28;
 function resize(){
  const box=host.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.15,1400/box.width);
  w=Math.max(1,Math.round(box.width*dpr));h=Math.max(1,Math.round(box.height*dpr));canvas.width=w;canvas.height=h;canvas.style.width='100%';canvas.style.height='100%';
  pass.width=w+pad*2;pass.height=h+pad*2;
  marksReady=!!marks;delete host.dataset.marks;
  source.forEach((c,i)=>{c.width=w+pad*2;c.height=h+pad*2;const context=c.getContext('2d');const im=images[i];if(!im.naturalWidth)return;
   // Proportional overscan prevents seams without stretching the original mark.
   const scale=Math.max(c.width/im.naturalWidth,c.height/im.naturalHeight);const iw=im.naturalWidth*scale,ih=im.naturalHeight*scale;
   context.drawImage(im,(c.width-iw)/2,(c.height-ih)/2,iw,ih);
   try{marksReady=drawWovenMarks(context,marks,host,{x:pad,y:pad,width:w,height:h,dark:!!i})&&marksReady;}catch{marksReady=false;}
  });motion?.refresh();
 }
 function renderMaterial(index,alpha,state){
  if(alpha<.0001)return;
  const {time,moving,x,interaction,rippleY,rippleAge}=state;
  const scale=Math.min(w,h)/700,amp=moving*scale;
  const src=source[index],bw=pass.width,bh=pass.height;
  passCtx.fillStyle=index?'#101318':'#f2ede3';passCtx.fillRect(0,0,bw,bh);
  // Long fabric folds, or shorter layered water waves. Columns bend vertically.
  for(let cx=0;cx<bw;cx+=6){const px=cx/bw,proximity=Math.exp(-Math.pow((px-x)*3,2));
   const cloth=Math.sin(px*7+time*.27)*3.3+Math.sin(px*14-time*.18)*1.5;
   const water=Math.sin(px*15+time*.4)*2+Math.cos(px*27-time*.3)*.85;
   const dy=((index?water:cloth)+(px-x)*proximity*interaction*3)*amp;
   passCtx.drawImage(src,cx,0,6,bh,cx,dy,6,bh);
  }
  ctx.globalAlpha=alpha;
  // Rows complete the two-dimensional refraction. Adjacent strips move subpixel amounts.
  for(let cy=0;cy<h;cy+=3){const py=cy/h;
   const cloth=Math.sin(py*8-time*.32)*7.5+Math.sin(py*15-time*.2)*1.8;
   const water=Math.sin(py*18-time*.49+Math.sin(py*6+time*.18))*3.3+Math.sin(py*31+time*.32)*1.25;
   const ripple=Math.sin(Math.abs(py-rippleY)*45-rippleAge*7)*Math.exp(-rippleAge*.7)*Math.exp(-Math.pow((Math.abs(py-rippleY)-rippleAge*.15)*8,2))*3;
   const dx=((index?water:cloth)+ripple)*amp;
   ctx.drawImage(pass,pad+dx,cy+pad,w,Math.min(3,h-cy),0,cy,w,Math.min(3,h-cy));
  }
 }
 function render(state){
  const {mix}=state;
  ctx.globalAlpha=1;ctx.fillStyle=mix>.5?'#101318':'#f2ede3';ctx.fillRect(0,0,w,h);
  if(mix===1)renderMaterial(1,1,state);else if(mix===0)renderMaterial(0,1,state);else{renderMaterial(0,1,state);renderMaterial(1,mix,state);}
  if(marksReady)host.dataset.marks='woven';
 }
 const ro=new ResizeObserver(resize);
 Promise.all([Promise.all(images.map(i=>i.decode())),loadWovenMarks(parent)]).then(([,loadedMarks])=>{if(dead)return;marks=loadedMarks;resize();ro.observe(host);motion=startSurfaceMotion(host,parent,preferences,render,1000/30);}).catch(()=>{delete host.dataset.marks;host.dataset.engine='static';});
 return{refresh(){motion?.refresh();},dispose(){dead=true;delete host.dataset.marks;motion?.dispose();ro.disconnect();canvas.remove();}};
}
