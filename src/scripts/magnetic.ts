import { onPage, prefersReducedMotion, finePointer, clamp } from '@/lib/page';

/** Slight magnetic pull on [data-magnetic] elements (fine pointers only). */
onPage('body', () => {
  if (!finePointer() || prefersReducedMotion()) return;
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-magnetic]'));
  if (!els.length) return;
  const handlers: Array<() => void> = [];
  for (const el of els) {
    const strength = Number(el.dataset.magnetic || 0.3);
    const max = Number(el.dataset.magneticMax || 6);
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const tx = clamp(dx * strength, -max, max);
      const ty = clamp(dy * strength, -max, max);
      el.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
    };
    const onLeave = () => { el.style.transform = ''; };
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    handlers.push(() => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.style.transform = '';
    });
  }
  return () => handlers.forEach((h) => h());
});
