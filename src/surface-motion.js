// The WebGL and Canvas renderers share one clock, theme fade and input response.
export function startSurfaceMotion(host, parent, preferences, draw, frameInterval = 0) {
  const state = {
    time: 0, mix: preferences.current.theme === 'dark' ? 1 : 0,
    moving: preferences.current.motion ? 1 : 0,
    x: .5, y: .5, interaction: 0, rippleX: .5, rippleY: .5, rippleAge: 100,
  };
  const themeLayer = parent.querySelectorAll('.fallback-art')[1];
  let frame = 0, last = 0, visible = false, disposed = false;
  let targetX = .5, targetY = .5, inside = false;
  let syncTheme = true;

  function wake() {
    if (!disposed && visible && !document.hidden && !frame) frame = requestAnimationFrame(render);
  }
  function pause() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  }
  function refresh() {
    syncTheme = true;
    wake();
  }
  function render(now) {
    frame = 0;
    if (disposed || !visible || document.hidden) { last = 0; return; }
    if (last && now - last < frameInterval - 1) { wake(); return; }
    const dt = last ? Math.min((now - last) / 1000, .05) : 0;
    last = now;
    state.moving = preferences.current.motion ? 1 : 0;
    if (syncTheme) {
      const target = preferences.current.theme === 'dark' ? 1 : 0;
      // Follow the actual CSS fade, including interrupted transitions. Read only
      // while changing, so the ambient animation does not recalculate styles.
      state.mix = state.moving ? Number(getComputedStyle(themeLayer).opacity) : target;
      syncTheme = state.mix !== target;
    }
    state.time += dt * state.moving;
    state.rippleAge += dt * state.moving;
    const response = 1 - Math.exp(-8 * dt);
    state.x += (targetX - state.x) * response;
    state.y += (targetY - state.y) * response;
    state.interaction += ((inside ? 1 : 0) - state.interaction) * response;
    draw(state);
    host.classList.add('ready');
    if (state.moving || syncTheme) wake();
  }
  function setPointer(event) {
    const box = parent.getBoundingClientRect();
    targetX = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
    targetY = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));
  }
  function move(event) {
    if (!preferences.current.motion || event.pointerType === 'touch') return;
    setPointer(event);
    inside = true;
  }
  function down(event) {
    if (!preferences.current.motion || event.target.closest('a, button')) return;
    setPointer(event);
    state.rippleX = targetX;
    state.rippleY = targetY;
    state.rippleAge = 0;
  }
  function leave() { inside = false; targetX = .5; targetY = .5; }
  function visibilityChange() { if (document.hidden) pause(); else refresh(); }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) refresh(); else pause();
  });
  observer.observe(host);
  document.addEventListener('visibilitychange', visibilityChange);
  parent.addEventListener('pointermove', move, { passive: true });
  parent.addEventListener('pointerdown', down, { passive: true });
  parent.addEventListener('pointerleave', leave, { passive: true });
  return {
    refresh,
    dispose() {
      disposed = true;
      pause();
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibilityChange);
      parent.removeEventListener('pointermove', move);
      parent.removeEventListener('pointerdown', down);
      parent.removeEventListener('pointerleave', leave);
    },
  };
}
