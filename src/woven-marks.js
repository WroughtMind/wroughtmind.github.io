// Rasterize only the two real project marks; the DOM buttons remain the hit areas.
export async function loadWovenMarks(parent) {
 const elements=[...parent.querySelectorAll('.flag-project-symbol > img')];
 if(elements.length!==2)return null;
 try{return await Promise.all(elements.map(async element=>{
  const image=new Image();image.src=element.currentSrc||element.src;await image.decode();
  const inks=[false,true].map(dark=>{
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
   const context=canvas.getContext('2d');if(!context)throw new Error('mark canvas');
   context.drawImage(image,0,0,256,256);
   if(dark){
    const pixels=context.getImageData(0,0,256,256),data=pixels.data;
    for(let i=0;i<data.length;i+=4){
     // Preserve cinnabar; lift neutral ink to the same warm white as the lettering.
     if(data[i]>data[i+1]*1.4&&data[i]>data[i+2]*1.3)continue;
     data[i]=241;data[i+1]=237;data[i+2]=228;
    }
    context.putImageData(pixels,0,0);
   }
   return canvas;
  });
  return{element,inks};
 }));}catch{return null;}
}

export function drawWovenMarks(context,marks,host,{x=0,y=0,width,height,dark=false}) {
 if(!marks)return false;
 const box=host.getBoundingClientRect();if(!box.width||!box.height)return false;
 for(const {element,inks} of marks){
  const rect=element.getBoundingClientRect();
  if(!rect.width||!rect.height)return false;
  // Bake the fixed printed angle, never a transient hover transform.
  const angle=(parseFloat(getComputedStyle(element.parentElement).getPropertyValue('--angle'))||0)*Math.PI/180;
  context.save();
  context.translate(x+(rect.left+rect.width/2-box.left)/box.width*width,y+(rect.top+rect.height/2-box.top)/box.height*height);
  context.rotate(angle);context.globalAlpha=.8;
  context.globalCompositeOperation=dark?'source-over':'multiply';
  const w=element.clientWidth/host.clientWidth*width,h=element.clientHeight/host.clientHeight*height;
  context.drawImage(inks[dark?1:0],-w/2,-h/2,w,h);context.restore();
 }
 return true;
}
