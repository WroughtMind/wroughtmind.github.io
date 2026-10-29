import { useEffect, useLayoutEffect, useRef, useState, lazy, Suspense } from 'react';
import { ArrowUpRight, Sun, Moon, X, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { WebiExhibit, CreditiaExhibit } from './ProjectExhibits.jsx';
import stats from './project-stats.json';
import { BrandStory } from './BrandStory.jsx';
import { useFlagUnfold } from './useFlagUnfold.js';

const DreamSurface = lazy(() => import('./DreamSurface.jsx'));
const asset = name => `/assets/${name}`;
const projects = [
  {
    id: 'weibei', name: 'Weibei', logo: 'projects/weibei-mark.svg',
    title: 'Room for your\nnext thought.',
    story: 'A page becomes a question. A question becomes a note. Weibei keeps them together, so you can follow an idea without losing where it came from.',
    philosophy: 'Your materials stay close. AI joins when you need it. The thinking is yours.',
    href: 'https://wroughtmind.github.io/weibei/', repo: 'https://github.com/WroughtMind/weibei',
    platform: 'Native macOS',
  },
  {
    id: 'creditia', name: 'Creditia', logo: 'projects/creditia-mark.svg',
    title: 'Good work has\na whole cast.',
    story: 'There is a story behind every line of code. Creditia reads Git history and local agent logs to trace the tools and models that helped make it.',
    philosophy: 'Give that collaboration a shape. A film credit. A receipt. Something worth keeping.',
    href: 'https://wroughtmind.github.io/creditia/', repo: 'https://github.com/WroughtMind/creditia',
    platform: 'Local-first',
  },
];
const projectFromHash = () => projects.find(p => `#${p.id}` === location.hash)?.id || null;
const dateLabel = value => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Shanghai' }).format(new Date(value));

function useAppearance() {
  const [preference, setPreference] = useState(() => {
    try { const stored = localStorage.getItem('wroughtmind-appearance'); return ['light', 'dark'].includes(stored) ? stored : 'system'; } catch { return 'system'; }
  });
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const change = event => setSystemDark(event.matches);
    mq.addEventListener('change', change);
    return () => mq.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#101318' : '#f2ede3';
    try { localStorage.setItem('wroughtmind-appearance', preference); } catch { /* Browser storage may be unavailable. */ }
  }, [theme, preference]);
  return { theme, setPreference };
}

function useMotion() {
  const [motion, setMotion] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const change = event => setMotion(!event.matches);
    mq.addEventListener('change', change);
    return () => mq.removeEventListener('change', change);
  }, []);
  return motion;
}

function ProjectMark({ project, woven = false, ...props }) {
  return <img className={`project-mark ${project.id}-mark`} src={asset(woven && project.id === 'creditia' ? 'projects/creditia-ink.svg' : project.logo)} alt="" {...props} />;
}

function ProjectFacts({ project }) {
  const facts = stats.projects[project.id];
  return <div className="project-facts">
    <dl>
      <div><dt>First commit</dt><dd><a href={`${project.repo}/commit/${facts.firstCommit}`} target="_blank" rel="noreferrer">{dateLabel(facts.firstCommitAt)}</a></dd></div>
      <div><dt>Commits on {facts.branch}</dt><dd><a href={`${project.repo}/commits/${facts.revision}`} target="_blank" rel="noreferrer">{facts.commits.toLocaleString('en-US')}</a></dd></div>
      <div><dt>At heart</dt><dd>{project.platform}</dd></div>
    </dl>
    <p className="snapshot-date">As of {dateLabel(stats.updatedAt)}</p>
  </div>;
}

function ProjectSheet({ selected, motion, origin, returnContext, onSelect, onClose }) {
  const dialogRef = useRef(null);
  const bodyRef = useRef(null);
  const animationRef = useRef(null);
  const closingRef = useRef(false);
  const motionRef = useRef(motion);
  motionRef.current = motion;
  const [displayed, setDisplayed] = useState(selected);
  const project = projects.find(p => p.id === (selected || displayed));

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (selected) {
      setDisplayed(selected);
      closingRef.current = false;
      animationRef.current?.cancel();
      document.body.classList.add('sheet-open');
      if (!origin.current) origin.current = document.querySelector(`[data-project-entry="${returnContext.current.trigger || `flag-${selected}`}"]`);
      if (!dialog.open) {
        dialog.showModal();
        dialog.querySelector('#project-title').focus({ preventScroll: true });
        const rect = origin.current?.getBoundingClientRect();
        const box = dialog.getBoundingClientRect();
        const dx = rect ? rect.left + rect.width / 2 - (box.left + box.width / 2) : 0;
        const dy = rect ? rect.top + rect.height / 2 - (box.top + box.height / 2) : 30;
        animationRef.current = dialog.animate([
          { opacity: 0, transform: `translate(${dx * .14}px, ${dy * .14}px) scale(.965)` },
          { opacity: 1, transform: 'translate(0, 0) scale(1)' },
        ], { duration: motionRef.current ? 440 : 0, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
    } else if (dialog.open) {
      closingRef.current = true;
      animationRef.current?.cancel();
      const animation = dialog.animate([
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'translateY(8px) scale(.985)' },
      ], { duration: motionRef.current ? 180 : 0, easing: 'cubic-bezier(.4,0,1,1)' });
      animationRef.current = animation;
      animation.finished.then(() => {
        if (!closingRef.current) return;
        dialog.close();
        document.body.classList.remove('sheet-open');
        const currentUrl = location.pathname + location.search + location.hash;
        if (currentUrl === returnContext.current.url) {
          window.scrollTo({ top: returnContext.current.scrollY, behavior: 'instant' });
          origin.current?.focus({ preventScroll: true });
        }
        setDisplayed(null);
      }).catch(() => {});
    }
  }, [selected, origin, returnContext]);

  useEffect(() => {
    if (!motion && animationRef.current?.playState === 'running') animationRef.current.finish();
  }, [motion]);

  useEffect(() => () => {
    animationRef.current?.cancel();
    document.body.classList.remove('sheet-open');
  }, []);

  const backdropPointer = useRef(false);
  return <dialog ref={dialogRef} className="project-sheet" aria-labelledby="project-title"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onPointerDown={event => { backdropPointer.current = event.target === event.currentTarget; }}
    onClick={event => { if (event.target === event.currentTarget && backdropPointer.current) onClose(); }}>
    <div className="sheet-shell">
      <header className="sheet-header">
        <nav className="project-switcher" aria-label="Projects">
          {projects.map(p => <button key={p.id} className="project-switch" aria-pressed={project?.id === p.id}
            onClick={() => onSelect(p.id)}><ProjectMark project={p}/><span>{p.name}</span></button>)}
        </nav>
        <button className="icon-button close-sheet" onClick={onClose} aria-label="Close project"><X size={22} weight="light"/></button>
      </header>
      {project && <>
        <div className="sheet-body" ref={bodyRef}>
          <article className="project-story" key={project.id}>
            <div className="story-opening">
              <div className="story-title"><span className="project-kicker">{project.name}</span><h2 id="project-title" tabIndex={-1}>{project.title}</h2></div>
              <div className="story-prose"><p>{project.story}</p><p>{project.philosophy}</p></div>
            </div>
            {project.id === 'weibei' ? <WebiExhibit motion={motion}/> : <CreditiaExhibit motion={motion}/>}
            <ProjectFacts project={project}/>
            {project.id === 'weibei' && <figure className="workspace-preview">
              <img src={asset('weibei-workspace.webp')} width="1600" height="1000" loading="lazy" alt="Weibei: reading, conversation and notes in one workspace."/>
              <figcaption>Read. Ask. Make it your own.</figcaption>
            </figure>}
          </article>
        </div>
        <footer className="sheet-footer"><a className="source-link" href={project.repo} target="_blank" rel="noreferrer">Source <ArrowUpRight size={15}/></a><a className="visit-link" href={project.href} target="_blank" rel="noreferrer">Visit {project.name}<ArrowUpRight size={18}/></a></footer>
      </>}
    </div>
  </dialog>;
}

export function App() {
  const { theme, setPreference } = useAppearance();
  const motion = useMotion();
  const sceneRef = useRef(null);
  useFlagUnfold(sceneRef, motion);
  const [selected, setSelected] = useState(projectFromHash);
  const origin = useRef(null);
  const returnContext = useRef(history.state?.wroughtmindReturn || { url: location.pathname + location.search, scrollY: 0, trigger: null });
  useEffect(() => {
    const sync = () => {
      const id = projectFromHash();
      if (id && history.state?.wroughtmindReturn) {
        returnContext.current = history.state.wroughtmindReturn;
        origin.current = document.querySelector(`[data-project-entry="${returnContext.current.trigger}"]`);
      }
      setSelected(id);
    };
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => { window.removeEventListener('popstate', sync); window.removeEventListener('hashchange', sync); };
  }, []);
  function selectProject(id, event) {
    if (id === selected) return;
    if (!selected) {
      origin.current = event?.currentTarget || document.querySelector(`[data-project="${id}"]`);
      returnContext.current = { url: location.pathname + location.search + location.hash, scrollY: window.scrollY, trigger: origin.current?.dataset.projectEntry };
      history.pushState({ wroughtmindSheet: true, wroughtmindReturn: returnContext.current }, '', `#${id}`);
    } else {
      history.replaceState(history.state, '', `#${id}`);
    }
    setSelected(id);
  }
  function closeProject() {
    if (!selected) return;
    if (history.state?.wroughtmindSheet) history.back();
    else { history.replaceState(null, '', returnContext.current.url); setSelected(null); }
  }
  return <>
    <a className="skip-link" href="#work">Skip to projects</a>
    <svg className="flag-geometry" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="flag-edge" clipPathUnits="objectBoundingBox">
          <path d="M .032 .012 C .26 -.005 .62 .02 .963 .006 Q .995 .004 .995 .057 C .996 .35 .99 .7 .981 .94 Q .979 .989 .945 .99 C .67 .978 .32 1 .04 .982 Q .006 .98 .008 .932 C .013 .65 .004 .3 .007 .062 Q .009 .016 .032 .012 Z"/>
        </clipPath>
        <clipPath id="flag-edge-portrait" clipPathUnits="objectBoundingBox">
          <path d="M .075 .008 C .32 .002 .66 .018 .925 .008 Q .985 .006 .986 .05 C .996 .34 .977 .66 .982 .946 Q .983 .989 .925 .99 C .64 .982 .32 .996 .075 .982 Q .014 .98 .014 .941 C .02 .65 .004 .32 .012 .05 Q .013 .01 .075 .008 Z"/>
        </clipPath>
      </defs>
    </svg>
    <div className="site-scene" ref={sceneRef} data-motion={motion}>
      <header className="site-header">
        <a className="brand-lockup" href="#top" aria-label="WroughtMind home"><img className="brand-mark" src={asset('wroughtmind-mark.svg')} alt=""/><span className="wordmark">wroughtmind</span></a>
        <nav aria-label="Main navigation"><a className="github-link" href="https://github.com/WroughtMind" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={15}/></a>
          <button className="icon-button theme-button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={() => setPreference(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Moon size={21} weight="light"/> : <Sun size={21} weight="light"/>}
          </button>
        </nav>
      </header>
      <main id="top">
        <div className="flag-stage">
        <section className="hero" aria-label="WroughtMind flag">
          <div className="flag-field">
            <div className="hero-backdrop" aria-hidden="true">
              <img className={`fallback-art ${theme === 'light' ? 'active' : ''}`} src={asset('dream-light.webp')} alt="" fetchPriority={theme === 'light' ? 'high' : 'low'}/>
              <img className={`fallback-art ${theme === 'dark' ? 'active' : ''}`} src={asset('dream-dark.webp')} alt="" fetchPriority={theme === 'dark' ? 'high' : 'low'}/>
              <Suspense fallback={null}><DreamSurface theme={theme} motion={motion}/></Suspense>
            </div>
            <div className="fabric-light" aria-hidden="true"/>
            <div className="hero-copy"><h1><span className="hero-prefix">experience a</span><span className="hero-dream">dream</span></h1></div>
            <div className="flag-projects" id="work" role="group" aria-label="Our projects">
              {projects.map(p => <button key={p.id} data-project={p.id} data-project-entry={`flag-${p.id}`} className={`flag-project flag-project-${p.id}`} aria-haspopup="dialog" aria-label={`Explore ${p.name}`} onClick={event => selectProject(p.id, event)}>
                <span className="flag-project-symbol"><ProjectMark project={p} woven/></span>
                <span className="flag-project-name">{p.name}<ArrowUpRight size={14}/></span>
              </button>)}
            </div>
          </div>
          <a className="scroll-cue icon-button" href="#approach" aria-label="Our approach"><ArrowDown size={19} weight="light"/></a>
        </section>
        </div>
        <BrandStory/>
        <footer className="site-footer"><span>© {new Date().getFullYear()} WroughtMind</span><a className="back-top icon-button" href="#top" aria-label="Back to top"><ArrowUp size={18}/></a></footer>
      </main>
    </div>
    <ProjectSheet selected={selected} motion={motion} origin={origin} returnContext={returnContext} onSelect={selectProject} onClose={closeProject}/>
  </>;
}
