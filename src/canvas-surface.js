// A genuine two-pass image refraction path for browsers without WebGL.
export function startCanvasSurface(host, preferences, parent) {
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)return()=>{};
 host.appendChild(canvas);host.dataset.engine='canvas';canvas.setAttribute('aria-hidden','true');
 let dead=false,frame=0,visible=true,w=0,h=0,time=0,last=0,drawn=false,mix=preferences.current.theme==='dark'?1:0,moving=preferences.current.motion?1:0;
 let x=.5,y=.5,tx=.5,ty=.5,rippleAge=100;
 const images=['/assets/dream-light.png','/assets/dream-dark.png'].map(src=>{const i=new Image();i.src=src;return i;});
 const source=[document.createElement('canvas'),document.createElement('canvas')];
 const pass=document.createElement('canvas'),passCtx=pass.getContext('2d',{alpha:false});
 const pad=28;
 function resize(){
  const box=host.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.15,1400/box.width);
  w=Math.max(1,Math.round(box.width*dpr));h=Math.max(1,Math.round(box.height*dpr));canvas.width=w;canvas.height=h;canvas.style.width='100%';canvas.style.height='100%';
  pass.width=w+pad*2;pass.height=h+pad*2;
  source.forEach((c,i)=>{c.width=w+pad*2;c.height=h+pad*2;const context=c.getContext('2d');const im=images[i];if(!im.naturalWidth)return;
   // Proportional overscan prevents seams without stretching the original mark.
   const scale=Math.max(c.width/im.naturalWidth,c.height/im.naturalHeight);const iw=im.naturalWidth*scale,ih=im.naturalHeight*scale;
   context.drawImage(im,(c.width-iw)/2,(c.height-ih)/2,iw,ih);
  });drawn=false;
 }
 function renderMaterial(index,alpha){
  if(alpha<.0001)return;
  const scale=Math.min(w,h)/700,amp=moving*scale;
  const src=source[index],bw=pass.width,bh=pass.height;
  passCtx.fillStyle=index?'#101318':'#f2ede3';passCtx.fillRect(0,0,bw,bh);
  // Long fabric folds, or shorter layered water waves. Columns bend vertically.
  for(let cx=0;cx<bw;cx+=6){const px=cx/bw,proximity=Math.exp(-Math.pow((px-x)*3,2));
   const cloth=Math.sin(px*7+time*.27)*3.3+Math.sin(px*14-time*.18)*1.5;
   const water=Math.sin(px*15+time*.4)*2+Math.cos(px*27-time*.3)*.85;
   const dy=((index?water:cloth)+Math.sin(time*.4+px*5)*proximity*.55)*amp;
   passCtx.drawImage(src,cx,0,6,bh,cx,dy,6,bh);
  }
  ctx.globalAlpha=alpha;
  // Rows complete the two-dimensional refraction. Adjacent strips move subpixel amounts.
  for(let cy=0;cy<h;cy+=3){const py=cy/h;
   const cloth=Math.sin(py*8-time*.32)*7.5+Math.sin(py*15-time*.2)*1.8;
   const water=Math.sin(py*18-time*.49+Math.sin(py*6+time*.18))*3.3+Math.sin(py*31+time*.32)*1.25;
   const ripple=Math.sin(Math.abs(py-y)*45-rippleAge*7)*Math.exp(-rippleAge*.7)*Math.exp(-Math.pow((Math.abs(py-y)-rippleAge*.15)*8,2))*3;
   const dx=((index?water:cloth)+ripple)*amp;
   ctx.drawImage(pass,pad+dx,cy+pad,w,Math.min(3,h-cy),0,cy,w,Math.min(3,h-cy));
  }
 }
 function render(now){
  if(dead)return;frame=requestAnimationFrame(render);
  if(now-last<32||!visible||document.hidden)return;
  const elapsed=last?Math.min((now-last)/1000,1):.033,dt=Math.min(elapsed,.06);last=now;
  const target=preferences.current.theme==='dark'?1:0,moveTo=preferences.current.motion?1:0;
  const changed=Math.abs(target-mix)>.0001||Math.abs(moving-moveTo)>.0001;
  if(!moveTo&&!changed&&drawn)return;
  mix+=(target-mix)*(1-Math.exp(-elapsed*3.6));moving+=(moveTo-moving)*(1-Math.exp(-elapsed*3.6));time+=dt*moving;rippleAge+=dt*moving;
  x+=(tx-x)*(1-Math.exp(-dt*3));y+=(ty-y)*(1-Math.exp(-dt*3));
  ctx.globalAlpha=1;ctx.fillStyle=mix>.5?'#101318':'#f2ede3';ctx.fillRect(0,0,w,h);
  if(mix>.9999)renderMaterial(1,1);else if(mix<.0001)renderMaterial(0,1);else{renderMaterial(0,1);renderMaterial(1,mix);}
  drawn=true;host.classList.add('ready');
 }
 const move=e=>{const r=parent.getBoundingClientRect();tx=(e.clientX-r.left)/r.width;ty=(e.clientY-r.top)/r.height;};
 const down=e=>{move(e);rippleAge=0;};const leave=()=>{tx=.5;ty=.5;};
 const ro=new ResizeObserver(resize),io=new IntersectionObserver(es=>{visible=es[0].isIntersecting;},{rootMargin:'120px'});
 Promise.all(images.map(i=>i.decode())).then(()=>{if(dead)return;resize();ro.observe(host);io.observe(host);parent.addEventListener('pointermove',move,{passive:true});parent.addEventListener('pointerdown',down,{passive:true});parent.addEventListener('pointerleave',leave,{passive:true});frame=requestAnimationFrame(render);}).catch(()=>{host.dataset.engine='static';});
 return()=>{dead=true;cancelAnimationFrame(frame);ro.disconnect();io.disconnect();parent.removeEventListener('pointermove',move);parent.removeEventListener('pointerdown',down);parent.removeEventListener('pointerleave',leave);canvas.remove();};
}
