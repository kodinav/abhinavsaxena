import { onPage, prefersReducedMotion } from '@/lib/page';

/**
 * Scroll reveal. Elements with [data-reveal] fade/rise in once when they
 * enter the viewport. Siblings inside [data-reveal-group] are staggered.
 */
onPage('body', () => {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (!els.length) return;
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  // stagger within groups
  document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
    const step = Number(group.dataset.revealGroup || 70);
    group.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el, i) => {
      el.style.setProperty('--reveal-delay', `${Math.min(i * step, 600)}ms`);
    });
  });
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          en.target.classList.remove('is-pending');
          io.unobserve(en.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  // Only elements below the fold are hidden and observed; anything already on
  // screen stays visible, so content never depends on the observer firing.
  // Read all layout first, then write classes, to avoid forced reflows.
  const limit = window.innerHeight * 0.92;
  const below = els.map((el) => el.getBoundingClientRect().top >= limit);
  els.forEach((el, i) => {
    if (!below[i]) el.classList.add('is-in');
    else { el.classList.add('is-pending'); io.observe(el); }
  });
  return () => io.disconnect();
});
