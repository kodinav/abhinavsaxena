import { onPage, prefersReducedMotion } from '@/lib/page';
import { lockScroll } from '@/scripts/motion/core';

onPage<HTMLElement>('.site-nav', (nav) => {
  const toggle = nav.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const overlay = document.querySelector<HTMLElement>('[data-menu]');
  const closeBtn = overlay?.querySelector<HTMLButtonElement>('[data-menu-close]');
  let open = false;
  let lastFocus: HTMLElement | null = null;

  /* --- scroll behaviour: condense + hide on scroll down --- */
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 24);
      if (!open) {
        if (y > lastY + 6 && y > 160) nav.classList.add('is-hidden');
        else if (y < lastY - 6) nav.classList.remove('is-hidden');
      }
      lastY = y;
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- active link --- */
  const path = location.pathname.replace(/\/$/, '') || '/';
  nav.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
    const href = a.getAttribute('href')!.replace(/\/$/, '') || '/';
    const active = href === '/' ? path === '/' : path === href || path.startsWith(href + '/');
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  /* --- menu overlay --- */
  const focusables = () =>
    overlay
      ? Array.from(
          overlay.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
        ).filter((el) => el.offsetParent !== null)
      : [];

  const setOpen = (v: boolean) => {
    if (!overlay || !toggle) return;
    open = v;
    overlay.hidden = false;
    // allow transition
    requestAnimationFrame(() => {
      overlay.classList.toggle('is-open', v);
      nav.classList.toggle('menu-open', v);
    });
    toggle.setAttribute('aria-expanded', String(v));
    lockScroll(v);
    if (v) {
      lastFocus = document.activeElement as HTMLElement;
      nav.classList.remove('is-hidden');
      setTimeout(() => focusables()[0]?.focus(), prefersReducedMotion() ? 0 : 200);
    } else {
      const done = () => { overlay.hidden = true; };
      if (prefersReducedMotion()) done(); else setTimeout(done, 450);
      lastFocus?.focus();
    }
  };

  const onToggle = () => setOpen(!open);
  const onClose = () => setOpen(false);
  const onKey = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
    if (e.key === 'Tab') {
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  const onOverlayClick = (e: Event) => {
    const t = e.target as HTMLElement;
    if (t.closest('a[href]')) setOpen(false);
    if (t === overlay) setOpen(false);
  };

  toggle?.addEventListener('click', onToggle);
  closeBtn?.addEventListener('click', onClose);
  overlay?.addEventListener('click', onOverlayClick);
  document.addEventListener('keydown', onKey);

  return () => {
    window.removeEventListener('scroll', onScroll);
    toggle?.removeEventListener('click', onToggle);
    closeBtn?.removeEventListener('click', onClose);
    overlay?.removeEventListener('click', onOverlayClick);
    document.removeEventListener('keydown', onKey);
    lockScroll(false);
  };
});
