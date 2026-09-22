import { onPage, prefersReducedMotion, finePointer, lerp } from '@/lib/page';

/**
 * A restrained custom cursor for fine pointers: a precise dot plus a lagging
 * ring that expands over interactive elements and can carry a short label
 * (data-cursor="Explore"). Disabled on touch and for reduced motion.
 */
onPage('body', () => {
  if (!finePointer() || prefersReducedMotion()) return;
  const html = document.documentElement;
  html.classList.add('has-cursor');

  let root = document.querySelector<HTMLElement>('.cursor');
  if (!root) {
    root = document.createElement('div');
    root.className = 'cursor';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = '<div class="cursor__dot"></div><div class="cursor__ring"><span class="cursor__label"></span></div>';
    document.body.appendChild(root);
  }
  const dot = root.querySelector<HTMLElement>('.cursor__dot')!;
  const ring = root.querySelector<HTMLElement>('.cursor__ring')!;
  const label = root.querySelector<HTMLElement>('.cursor__label')!;

  let x = window.innerWidth / 2, y = window.innerHeight / 2;
  let rx = x, ry = y;
  let visible = false;
  let raf = 0;

  const move = (e: PointerEvent) => {
    x = e.clientX;
    y = e.clientY;
    if (!visible) {
      visible = true;
      rx = x; ry = y;
      root!.classList.add('is-visible');
    }
  };
  const leave = () => { visible = false; root!.classList.remove('is-visible'); };
  const enter = () => { visible = true; root!.classList.add('is-visible'); };

  const over = (e: Event) => {
    const t = e.target as HTMLElement;
    const hit = t.closest<HTMLElement>('a, button, [role="button"], [data-cursor], input, textarea, select, summary, label');
    if (hit) {
      const text = hit.dataset.cursor;
      root!.classList.add('is-active');
      if (text) { label.textContent = text; root!.classList.add('has-label'); }
      else { root!.classList.remove('has-label'); }
      if (hit.matches('input[type="text"], input[type="search"], input[type="email"], input[type="url"], textarea')) root!.classList.add('is-text'); else root!.classList.remove('is-text');
    } else {
      root!.classList.remove('is-active', 'has-label', 'is-text');
    }
  };
  const down = () => root!.classList.add('is-down');
  const up = () => root!.classList.remove('is-down');

  const tick = () => {
    rx = lerp(rx, x, 0.18);
    ry = lerp(ry, y, 0.18);
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(var(--cs, 1))`;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  window.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('mouseleave', leave);
  document.addEventListener('mouseenter', enter);
  document.addEventListener('pointerover', over, { passive: true });
  document.addEventListener('pointerdown', down, { passive: true });
  document.addEventListener('pointerup', up, { passive: true });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', move);
    document.removeEventListener('mouseleave', leave);
    document.removeEventListener('mouseenter', enter);
    document.removeEventListener('pointerover', over);
    document.removeEventListener('pointerdown', down);
    document.removeEventListener('pointerup', up);
  };
});
