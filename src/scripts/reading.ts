import { onPage, prefersReducedMotion, clamp } from '@/lib/page';

/**
 * Reader behaviours: progress bar, TOC tracking, paragraph reveal,
 * typography controls (persisted), sharing.
 */
onPage<HTMLElement>('[data-reader]', (reader) => {
  const article = reader.querySelector<HTMLElement>('[data-article]')!;
  const progress = reader.querySelector<HTMLElement>('[data-progress]');
  const toc = reader.querySelector<HTMLElement>('[data-toc]');
  const tocDetails = reader.querySelector<HTMLDetailsElement>('details[data-toc-details]');
  const reduced = prefersReducedMotion();
  const cleanups: Array<() => void> = [];

  /* --- progress --- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const r = article.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const done = clamp((-r.top + window.innerHeight * 0.2) / Math.max(1, total), 0, 1);
      if (progress) progress.style.transform = `scaleX(${done.toFixed(4)})`;
      reader.classList.toggle('is-reading', r.top < 0 && r.bottom > window.innerHeight * 0.3);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  cleanups.push(() => window.removeEventListener('scroll', onScroll));

  /* --- TOC active heading (scroll-based: the last heading above the reading line) --- */
  if (toc) {
    const links = Array.from(toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
    const heads = links.map((a) => document.getElementById(decodeURIComponent(a.getAttribute('href')!.slice(1)))).filter(Boolean) as HTMLElement[];
    let current = '';
    const setActive = (id: string) => {
      if (id === current) return;
      current = id;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
    };
    const track = () => {
      const line = window.innerHeight * 0.3;
      let id = heads[0]?.id ?? '';
      for (const h of heads) { if (h.getBoundingClientRect().top <= line) id = h.id; else break; }
      // before the first heading: nothing active
      if (heads[0] && heads[0].getBoundingClientRect().top > line) id = '';
      setActive(id);
    };
    let t2 = false;
    const onScroll2 = () => { if (t2) return; t2 = true; requestAnimationFrame(() => { track(); t2 = false; }); };
    window.addEventListener('scroll', onScroll2, { passive: true });
    window.addEventListener('resize', onScroll2);
    track();
    cleanups.push(() => { window.removeEventListener('scroll', onScroll2); window.removeEventListener('resize', onScroll2); });
    const onTocClick = (e: Event) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]');
      if (a && tocDetails && window.matchMedia('(max-width: 1000px)').matches) tocDetails.open = false;
    };
    toc.addEventListener('click', onTocClick);
    cleanups.push(() => toc.removeEventListener('click', onTocClick));
  }
  if (tocDetails) {
    const mq = window.matchMedia('(max-width: 1000px)');
    const sync = () => { tocDetails.open = !mq.matches; };
    sync();
    mq.addEventListener('change', sync);
    cleanups.push(() => mq.removeEventListener('change', sync));
  }

  /* --- paragraph reveal --- */
  const blocks = Array.from(article.children) as HTMLElement[];
  if (!reduced && 'IntersectionObserver' in window) {
    article.classList.add('prose--animate');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); e.target.classList.remove('is-pending'); io.unobserve(e.target); } }),
      { rootMargin: '0px 0px -6% 0px', threshold: 0.01 },
    );
    const vh = window.innerHeight;
    const below = blocks.map((b) => b.getBoundingClientRect().top >= vh);
    blocks.forEach((b, i) => {
      if (!below[i]) b.classList.add('is-in'); else { b.classList.add('is-pending'); io.observe(b); }
    });
    cleanups.push(() => io.disconnect());
  }

  /* --- typography controls --- */
  const scales = [0.9, 1, 1.12, 1.25];
  let scaleIdx = 1;
  let wide = false;
  try {
    scaleIdx = clamp(Number(localStorage.getItem('reader-scale') ?? 1), 0, scales.length - 1);
    wide = localStorage.getItem('reader-wide') === '1';
  } catch {}
  const applyType = () => {
    reader.style.setProperty('--reader-scale', String(scales[scaleIdx]));
    reader.style.setProperty('--reader-measure', wide ? 'var(--measure-wide)' : 'var(--measure)');
    reader.querySelector<HTMLElement>('[data-type-smaller]')?.toggleAttribute('disabled', scaleIdx === 0);
    reader.querySelector<HTMLElement>('[data-type-larger]')?.toggleAttribute('disabled', scaleIdx === scales.length - 1);
    reader.querySelector<HTMLElement>('[data-type-wide]')?.setAttribute('aria-pressed', String(wide));
    try { localStorage.setItem('reader-scale', String(scaleIdx)); localStorage.setItem('reader-wide', wide ? '1' : '0'); } catch {}
  };
  applyType();

  /* --- share --- */
  const shareBtn = reader.querySelector<HTMLElement>('[data-share]');
  if (shareBtn && !('share' in navigator)) shareBtn.hidden = true;

  const onClick = async (e: Event) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-type-smaller]')) { scaleIdx = Math.max(0, scaleIdx - 1); applyType(); }
    else if (t.closest('[data-type-larger]')) { scaleIdx = Math.min(scales.length - 1, scaleIdx + 1); applyType(); }
    else if (t.closest('[data-type-wide]')) { wide = !wide; applyType(); }
    else if (t.closest('[data-share]')) {
      try { await (navigator as any).share({ title: document.title, url: location.href.split('#')[0] }); } catch {}
    }
  };
  reader.addEventListener('click', onClick);
  cleanups.push(() => reader.removeEventListener('click', onClick));

  return () => cleanups.forEach((c) => c());
});
