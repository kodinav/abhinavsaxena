import { onPage, prefersReducedMotion, isTouch } from '@/lib/page';
import { registry } from './registry';

onPage<HTMLElement>('[data-experiment]', (root) => {
  const key = root.dataset.experiment!;
  const loader = registry[key];
  let cleanup: void | (() => void);
  let cancelled = false;
  if (!loader) {
    root.innerHTML = `<p class="lab-note serif">Experiment "${key}" is not registered yet.</p>`;
    return;
  }
  root.classList.add('is-loading');
  loader()
    .then((mod) => {
      if (cancelled) return;
      root.classList.remove('is-loading');
      root.innerHTML = '';
      cleanup = mod.default.mount(root, { reduced: prefersReducedMotion(), touch: isTouch() });
      root.classList.add('is-ready');
    })
    .catch((err) => {
      console.error(err);
      root.classList.remove('is-loading');
      root.innerHTML = `<p class="lab-note serif">The experiment failed to load. Please refresh.</p>`;
    });
  return () => { cancelled = true; if (typeof cleanup === 'function') cleanup(); };
});
