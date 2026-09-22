import { onPage } from '@/lib/page';

/** [data-copy="text"] buttons copy to clipboard and flash a confirmation. */
onPage('body', () => {
  const handler = async (e: Event) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-copy]');
    if (!btn) return;
    const text = btn.dataset.copy === 'url' ? location.href.split('#')[0] : btn.dataset.copy!;
    try {
      await navigator.clipboard.writeText(text);
      const prev = btn.dataset.label ?? btn.textContent ?? '';
      btn.dataset.label = prev;
      btn.classList.add('is-copied');
      const lbl = btn.querySelector<HTMLElement>('[data-copy-label]');
      if (lbl) { const p = lbl.textContent; lbl.textContent = 'Copied'; setTimeout(() => { lbl.textContent = p; btn.classList.remove('is-copied'); }, 1600); }
      else setTimeout(() => btn.classList.remove('is-copied'), 1600);
    } catch {
      /* clipboard unavailable — nothing to do */
    }
  };
  document.addEventListener('click', handler);
  return () => document.removeEventListener('click', handler);
});
