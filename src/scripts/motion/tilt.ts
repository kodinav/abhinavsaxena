import { gsap, reduced, touch } from './core';

/** 3D tilt + glare for [data-tilt] cards (fine pointers only). */
export function mountTilt(root: ParentNode = document) {
  if (reduced || touch) return;
  root.querySelectorAll<HTMLElement>('[data-tilt]:not([data-tilt-ready])').forEach((el) => {
    el.dataset.tiltReady = '1';
    const max = Number(el.dataset.tilt || 6);
    let glare = el.querySelector<HTMLElement>('.tilt-glare');
    if (!glare) { glare = document.createElement('span'); glare.className = 'tilt-glare'; glare.setAttribute('aria-hidden', 'true'); el.appendChild(glare); }
    const qx = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    const qy = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const gx = gsap.quickTo(glare, '--gx', { duration: 0.6, ease: 'power3.out' } as any);
    const gy = gsap.quickTo(glare, '--gy', { duration: 0.6, ease: 'power3.out' } as any);
    gsap.set(el, { transformPerspective: 900, transformStyle: 'preserve-3d' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      qx((px - 0.5) * max * 2); qy(-(py - 0.5) * max * 2);
      gx(px * 100 as any); gy(py * 100 as any);
    };
    const leave = () => { qx(0); qy(0); };
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerleave', leave);
  });
}
