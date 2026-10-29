import { useLayoutEffect } from 'react';

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => value * value * (3 - 2 * value);

// Scroll schedules one paint; the existing material keeps its own visibility-aware clock.
// Transform the already-rendered flag instead of resizing/re-uploading its textures on scroll.
export function useFlagUnfold(sceneRef, motion) {
  useLayoutEffect(() => {
    const scene = sceneRef.current;
    const stage = scene.querySelector('.flag-stage');
    const field = scene.querySelector('.flag-field');
    const projects = scene.querySelector('.flag-projects');
    const cue = scene.querySelector('.scroll-cue');
    let frame = 0;
    let geometry;

    function measure() {
      const width = field.offsetWidth, height = field.offsetHeight;
      const overscan = 64; // Keep the blurred silhouette outside the viewport at full spread.
      const scale = Math.max((stage.clientWidth + overscan * 2) / width, (stage.clientHeight + overscan * 2) / height);
      geometry = {
        scale,
        x: (stage.clientWidth - width * scale) / 2 - field.offsetLeft,
        y: (stage.clientHeight - height * scale) / 2 - field.offsetTop,
        distance: stage.clientHeight * .85,
        top: scene.offsetTop,
      };
      schedule();
    }

    function paint() {
      frame = 0;
      const progress = clamp((window.scrollY - geometry.top) / geometry.distance);
      const spread = smooth(progress);
      const ink = 1 - smooth(clamp(progress / .6));
      field.style.transform = motion
        ? `translate3d(${geometry.x * spread}px, ${geometry.y * spread}px, 0) scale(${1 + (geometry.scale - 1) * spread})`
        : 'none';
      scene.style.setProperty('--flag-blur', `${26 * spread}px`);
      scene.style.setProperty('--flag-veil', `${.72 * spread}`);
      scene.style.setProperty('--flag-ink', `${ink}`);
      scene.style.setProperty('--flag-shadow', `${1 - spread}`);
      scene.style.setProperty('--scroll-cue-opacity', `${1 - clamp(progress * 4)}`);
      projects.inert = ink < .12;
      cue.inert = progress > .25;
      scene.dataset.unfurled = progress >= 1 ? 'true' : 'false';
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(paint);
    }
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(stage);
    resize.observe(field);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure, { passive: true });

    const passages = scene.querySelectorAll('[data-passage]');
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          reveal.unobserve(entry.target);
        }
      });
    }, { threshold: .15 });
    passages.forEach(element => reveal.observe(element));
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      reveal.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      projects.inert = false;
      cue.inert = false;
    };
  }, [sceneRef, motion]);
}
