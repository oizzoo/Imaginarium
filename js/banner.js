document.addEventListener('DOMContentLoaded', () => {
  const motion = matchMedia('(min-width: 769px) and (prefers-reduced-motion: no-preference)');
  document.querySelectorAll('.video-banner').forEach((video) => {
    const source = video.querySelector('source[data-src]');
    if (!source) return;
    const update = () => {
      if (!motion.matches || document.hidden) {
        video.pause();
        if (source.hasAttribute('src')) {
          source.removeAttribute('src');
          video.load();
        }
        return;
      }
      if (!source.hasAttribute('src')) {
        source.src = source.dataset.src;
        video.load();
      }
      video.play().catch(() => {}); // Poster remains when autoplay is blocked.
    };
    motion.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    update();
  });
});
