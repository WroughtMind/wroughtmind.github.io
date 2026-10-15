import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { ArrowUpRight, ArrowDown, Sun, Moon, Desktop, ArrowUp, DownloadSimple, Pause, Play } from '@phosphor-icons/react';
const DreamSurface=lazy(()=>import('./DreamSurface.jsx'));
const asset=name=>'/assets/'+name;
function useAppearance(){
 const [preference,setPreference]=useState(()=>{try{return localStorage.getItem('wroughtmind-appearance')||'system';}catch{return 'system';}});
 const [systemDark,setSystemDark]=useState(()=>matchMedia('(prefers-color-scheme: dark)').matches);
 const theme=preference==='system'?(systemDark?'dark':'light'):preference;
 useEffect(()=>{const mq=matchMedia('(prefers-color-scheme: dark)'),change=e=>setSystemDark(e.matches);mq.addEventListener('change',change);return()=>mq.removeEventListener('change',change);},[]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#101318':'#f2ede3';try{localStorage.setItem('wroughtmind-appearance',preference);}catch{}},[theme,preference]);
 return {theme,preference,setPreference};
}
function Mark(){return <span className="brand-mark" aria-hidden="true"><img src={asset('wroughtmind-mark.png')} alt=""/></span>;}
function Wordmark(){return <span className="wordmark">wroughtmind</span>;}
function ThemeButton({theme,onClick}){return <button className="theme-button" onClick={onClick} aria-label={'Switch to '+(theme==='dark'?'light':'dark')+' mode'} title={'Switch to '+(theme==='dark'?'light':'dark')+' mode'}><Sun className={'theme-icon '+(theme==='light'?'shown':'')} size={19} weight="light"/><Moon className={'theme-icon '+(theme==='dark'?'shown':'')} size={19} weight="light"/></button>;}
function useReveals(){useEffect(()=>{const els=document.querySelectorAll('[data-reveal]');if(matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(e=>e.classList.add('revealed'));return;}const observer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');observer.unobserve(e.target);}}),{threshold:.08});els.forEach(e=>observer.observe(e));return()=>observer.disconnect();},[]);}
function useAtmosphere(motion){
 useEffect(()=>{
  const scene=document.querySelector('.page-atmosphere');if(!scene)return;
  let frame=0;
  const paint=()=>{frame=0;scene.style.setProperty('--drift',motion?Math.min(window.scrollY*.025,70)+'px':'0px');};
  const scroll=()=>{if(!frame)frame=requestAnimationFrame(paint);};
  paint();if(motion)window.addEventListener('scroll',scroll,{passive:true});
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll);};
 },[motion]);
}
const projects=[
{id:'weibei',name:'Weibei',description:'A workspace for reading and writing.',href:'https://wroughtmind.github.io/weibei/',repo:'https://github.com/WroughtMind/weibei',image:'weibei-workspace.webp',alt:'Weibei’s actual workspace, with reading, conversation and notes side by side.'},
{id:'creditia',name:'Creditia',description:'Credits for AI-assisted work.',href:'https://wroughtmind.github.io/creditia/',repo:'https://github.com/WroughtMind/creditia',image:'creditia-light.webp',darkImage:'creditia-dark.webp',alt:'Creditia’s actual gallery of project credits and visual exports.'}
];
export function App(){
 const {theme,preference,setPreference}=useAppearance();
 const [motion,setMotion]=useState(()=>!matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [assetsOpen,setAssetsOpen]=useState(false), dialogRef=useRef(null);
 useReveals();
 useAtmosphere(motion);
 useEffect(()=>{const mq=matchMedia('(prefers-reduced-motion: reduce)'),change=e=>setMotion(!e.matches);mq.addEventListener('change',change);return()=>mq.removeEventListener('change',change);},[]);
 useEffect(()=>{if(assetsOpen)dialogRef.current?.showModal();else dialogRef.current?.close();},[assetsOpen]);
 return <>
 <a className="skip-link" href="#work">Skip to work</a>
 <div className="site-scene">
 <div className="page-atmosphere" aria-hidden="true"><img src={asset('dream-light.png')} className={theme==='light'?'active':''} alt=""/><img src={asset('dream-dark.png')} className={theme==='dark'?'active':''} alt=""/></div>
 <main>
  <section className="hero" id="top" aria-label="WroughtMind">
   <div className="hero-backdrop" aria-hidden="true"><img className={'fallback-art '+(theme==='light'?'active':'')} src={asset('dream-light.png')} alt="" fetchPriority="high"/><img className={'fallback-art '+(theme==='dark'?'active':'')} src={asset('dream-dark.png')} alt="" fetchPriority="high"/><Suspense fallback={null}><DreamSurface theme={theme} motion={motion}/></Suspense></div>
   <header className="site-header"><a className="brand-lockup" href="#top" aria-label="WroughtMind home"><Mark/><Wordmark/></a><nav aria-label="Main navigation"><a href="#work">Work</a><a className="github-link" href="https://github.com/WroughtMind" target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={15}/></a><ThemeButton theme={theme} onClick={()=>setPreference(theme==='dark'?'light':'dark')}/></nav></header>
   <div className="hero-copy"><h1><span className="hero-prefix">experience a</span><span className="hero-dream">dream</span></h1><a className="underlined-link hero-cta" href="#work">Explore our work <ArrowDown size={19} weight="light"/></a></div>
   <div className="hero-bottom"><button className="motion-toggle" aria-label={motion?'Pause ambient motion':'Resume ambient motion'} title={motion?'Pause ambient motion':'Resume ambient motion'} onClick={()=>setMotion(v=>!v)}>{motion?<Pause size={15} weight="light"/>:<Play size={15} weight="light"/>}</button></div>
  </section>
  <section id="work" aria-labelledby="work-title">
  <div className="work-index" aria-label="Selected work index"><h2 id="work-title">Selected work</h2><i aria-hidden="true"/><a href="#weibei">Weibei <ArrowUpRight size={15}/></a><i aria-hidden="true"/><a href="#creditia">Creditia <ArrowUpRight size={15}/></a><i aria-hidden="true"/></div>
  <div className="work-section">
   {projects.map(p=><article id={p.id} className="project" key={p.id}>
    <div className="project-information" data-reveal><h3>{p.name}</h3><p className="project-description">{p.description}</p><div className="project-links"><a className="underlined-link" href={p.href} target="_blank" rel="noopener noreferrer">Visit website <ArrowUpRight size={18}/></a><a className="quiet-link" href={p.repo} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={13}/></a></div></div>
    <a className={'project-visual '+p.id} href={p.href} target="_blank" rel="noopener noreferrer" aria-label={'Visit '+p.name} data-reveal><div className="project-image-stack"><img className={p.darkImage&&theme==='dark'?'hidden-image':''} src={asset(p.image)} alt={p.alt} loading="lazy" width="1600" height="1000"/>{p.darkImage&&<img className={'project-dark-image '+(theme==='dark'?'':'hidden-image')} src={asset(p.darkImage)} alt="" loading="lazy" width="1600" height="1000"/>}</div></a>
   </article>)}
  </div>
  </section>

 </main>
 <footer className="site-footer"><div className="footer-top"><a className="brand-lockup" href="#top" aria-label="WroughtMind home"><Mark/><Wordmark/></a><a className="back-top" href="#top" aria-label="Back to top"><ArrowUp size={20}/></a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} WroughtMind</span><div className="footer-actions"><button onClick={()=>setAssetsOpen(true)}>Brand assets <DownloadSimple size={14}/></button><button className={preference==='system'?'system-active':''} onClick={()=>setPreference('system')} aria-pressed={preference==='system'}><Desktop size={15}/>{preference==='system'?'Following system':'Use device appearance'}</button></div></div></footer>
 </div>
 <dialog className="brand-dialog" ref={dialogRef} onCancel={()=>setAssetsOpen(false)} onClick={e=>{if(e.target===dialogRef.current)setAssetsOpen(false);}}><div className="brand-dialog-header"><h2>Brand assets</h2><button onClick={()=>setAssetsOpen(false)}>Close</button></div><div className="brand-downloads">{['light','dark'].map(mode=><div className="brand-download" key={mode}><img src={'/brand/wroughtmind-banner-'+mode+'.png'} alt={mode+' WroughtMind banner'}/><div><span>{mode==='light'?'Daylight':'After dark'}</span><a href={'/brand/wroughtmind-banner-'+mode+'.png'} download>Banner <DownloadSimple size={15}/></a><a href={'/brand/wroughtmind-poster-'+mode+'.png'} download>Poster <DownloadSimple size={15}/></a></div></div>)}</div></dialog>
 </>;
}
