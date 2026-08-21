(function () {
  const root = document.documentElement;
  let rafId = null;

  function getViewportHeight() {
    if (window.visualViewport && window.visualViewport.height) {
      return Math.round(window.visualViewport.height);
    }

    return window.innerHeight;
  }

  function updateViewportHeight() {
    root.style.setProperty('--app-height', `${getViewportHeight()}px`);
    rafId = null;
  }

  function scheduleViewportUpdate() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(updateViewportHeight);
  }

  updateViewportHeight();

  window.addEventListener('resize', scheduleViewportUpdate, { passive: true });
  window.addEventListener('pageshow', scheduleViewportUpdate, { passive: true });
  window.addEventListener('orientationchange', () => {
    scheduleViewportUpdate();
    window.setTimeout(scheduleViewportUpdate, 250);
  }, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleViewportUpdate, { passive: true });
    window.visualViewport.addEventListener('scroll', scheduleViewportUpdate, { passive: true });
  }
}());
