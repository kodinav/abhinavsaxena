import { onPage, isTouch } from '@/lib/page';
import { gsap, ScrollTrigger, reduced, onPageCleanup } from '@/scripts/motion/core';
import { mountKinetic } from '@/scripts/motion/kinetic';
import { field } from '@/scripts/field/field';

interface GNode { id: string; label: string; primary: boolean; definition: string }
interface GLink { a: string; b: string; note: string }

/* ============================================================ HERO */
onPage<HTMLElement>('[data-hero]', (hero) => {
  const graph = JSON.parse(hero.dataset.graph || '{"nodes":[],"links":[]}') as { nodes: GNode[]; links: GLink[] };
  const els = graph.nodes.map((n) => hero.querySelector<HTMLElement>(`[data-concept="${n.id}"]`)).filter(Boolean) as HTMLElement[];
  const ids = els.map((el) => el.dataset.concept!);
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const bridge = hero.querySelector<HTMLElement>('[data-bridge]');
  const bridgeDefault = bridge?.dataset.default ?? '';
  const linksOf = (id: string) => graph.links.filter((l) => l.a === id || l.b === id);
  const relatedIdx = (id: string) => linksOf(id).map((l) => ids.indexOf(l.a === id ? l.b : l.a)).filter((i) => i >= 0);
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

  /* anchors → field (positions follow the page as it scrolls) */
  let base: { x: number; y: number }[] = [];
  const measure = () => {
    base = els.map((el) => {
      const a = el.querySelector<HTMLElement>('[data-anchor]') ?? el;
      const r = a.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 + window.scrollY };
    });
    push();
  };
  const push = () => {
    const sy = window.scrollY;
    field.setAnchors(base.map((b, i) => ({ x: b.x, y: b.y - sy, strength: els[i].classList.contains('hero__float') ? 0.8 : 1, related: relatedIdx(ids[i]) })));
  };
  let active: number | null = null;
  const setActive = (i: number | null) => {
    if (active === i) return;
    active = i;
    field.setActive(i);
    const id = i == null ? null : ids[i];
    const rel = id ? new Set(linksOf(id).map((l) => (l.a === id ? l.b : l.a))) : new Set<string>();
    els.forEach((el, k) => { el.classList.toggle('is-active', k === i); el.classList.toggle('is-related', !!id && rel.has(ids[k])); });
    hero.classList.toggle('has-active', i != null);
    if (!bridge) return;
    if (id) {
      const n = nodeById.get(id)!;
      const first = linksOf(id)[0];
      const other = first ? nodeById.get(first.a === id ? first.b : first.a) : null;
      bridge.innerHTML = `<span class="hero__bridge-def">${esc(n.definition)}</span>` + (other ? `<span class="hero__bridge-rel"><span class="hero__bridge-pair">${esc(n.label)} ↔ ${esc(other.label)}</span> ${esc(first.note)}</span>` : '');
    } else bridge.innerHTML = bridgeDefault;
  };

  /* pointer / touch semantics: hover activates; first tap activates, second follows */
  let lastType = isTouch() ? 'touch' : 'mouse'; let downActive: number | null = null; let downOnConcept = false;
  const isTap = () => lastType === 'touch' || lastType === 'pen';
  const onDown = (e: PointerEvent) => { lastType = e.pointerType || lastType; downActive = active; downOnConcept = !!(e.target as Element).closest?.('[data-concept]'); };
  const handlers = els.map((el, i) => {
    const enter = (e: PointerEvent) => { if (e.pointerType !== 'touch') setActive(i); };
    const leave = (e: PointerEvent) => { if (e.pointerType !== 'touch') setActive(null); };
    const focus = () => setActive(i);
    const blur = () => { if (!isTap()) setActive(null); };
    const click = (e: Event) => { if (isTap() && downActive !== i) { e.preventDefault(); setActive(i); } };
    el.addEventListener('pointerenter', enter); el.addEventListener('pointerleave', leave);
    el.addEventListener('focus', focus); el.addEventListener('blur', blur); el.addEventListener('click', click);
    return () => { el.removeEventListener('pointerenter', enter); el.removeEventListener('pointerleave', leave); el.removeEventListener('focus', focus); el.removeEventListener('blur', blur); el.removeEventListener('click', click); };
  });
  const onHeroTap = (e: Event) => { if (isTap() && !downOnConcept && !(e.target as HTMLElement).closest('[data-concept]')) setActive(null); };
  hero.addEventListener('pointerdown', onDown, { capture: true, passive: true });
  hero.addEventListener('click', onHeroTap);
  const ro = new ResizeObserver(() => measure());
  ro.observe(hero);
  window.addEventListener('scroll', push, { passive: true });
  measure();

  /* kinetic name */
  const name = hero.querySelector<HTMLElement>('[data-kinetic]');
  const stopKinetic = name ? mountKinetic(name) : () => {};

  /* entrance + scroll */
  const letters = Array.from(hero.querySelectorAll<HTMLElement>('[data-hero-letter]'));
  const ins = Array.from(hero.querySelectorAll<HTMLElement>('[data-hero-in]'));
  const entrance = () => {
    if (reduced) { gsap.set([letters, ins], { clearProps: 'all' }); return; }
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo(letters, { yPercent: 115 }, { yPercent: 0, duration: 1.3, stagger: { each: 0.035, from: 'start' } }, 0)
      .fromTo(ins, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09, clearProps: 'transform' }, 0.45);
    field.setIntensity(1);
  };
  if (document.documentElement.classList.contains('is-ready')) entrance();
  else document.addEventListener('intro:done', entrance, { once: true });

  let st: ScrollTrigger | undefined;
  if (!reduced) {
    const inner = hero.querySelector<HTMLElement>('.hero__inner');
    st = ScrollTrigger.create({
      trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4,
      onUpdate: (self) => { field.setScroll(self.progress); if (inner) gsap.set(inner, { y: -self.progress * 90, opacity: 1 - self.progress * 1.15 }); },
    });
  }

  return () => {
    handlers.forEach((h) => h());
    hero.removeEventListener('pointerdown', onDown, { capture: true } as any);
    hero.removeEventListener('click', onHeroTap);
    window.removeEventListener('scroll', push);
    ro.disconnect(); stopKinetic(); st?.kill();
    document.removeEventListener('intro:done', entrance);
    field.setAnchors([]); field.setActive(null); field.setScroll(0);
  };
});

/* ============================================================ THE THREAD (pinned chapter) */
onPage<HTMLElement>('[data-thread]', (section) => {
  const steps = Array.from(section.querySelectorAll<HTMLElement>('[data-thread-step]'));
  const index = section.querySelector<HTMLElement>('[data-thread-index]');
  const bar = section.querySelector<HTMLElement>('[data-thread-progress]');
  const n = steps.length;
  if (!n) return;
  let current = -1;
  const apply = (i: number) => {
    if (i === current) return;
    current = i;
    steps.forEach((s, k) => s.classList.toggle('is-current', k === i));
    if (index) index.textContent = String(i + 1).padStart(2, '0');
    field.setPreset(steps[i].dataset.preset ?? 'ambient');
  };
  if (reduced) { steps.forEach((s) => s.classList.add('is-static')); section.classList.add('is-init'); return; }

  const tl = gsap.timeline({ paused: true });
  steps.forEach((step, i) => {
    const word = step.querySelector<HTMLElement>('[data-thread-word]');
    const lines = step.querySelectorAll<HTMLElement>('[data-thread-line]');
    const at = i;
    tl.fromTo(word, { yPercent: 150, rotateZ: 1.2 }, { yPercent: 0, rotateZ: 0, duration: 0.55, ease: 'expo.out' }, at)
      .fromTo(lines, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }, at + 0.12);
    if (i < n - 1) {
      tl.to(word, { yPercent: -150, rotateZ: -1.2, duration: 0.45, ease: 'expo.in' }, at + 0.72)
        .to(lines, { opacity: 0, y: -18, duration: 0.3, ease: 'power3.in' }, at + 0.72);
    }
  });
  const dur = tl.duration();
  const st = ScrollTrigger.create({
    trigger: section, start: 'top top', end: () => `+=${n * 100}%`, pin: true, anticipatePin: 1,
    onUpdate: (self) => {
      const p = self.progress;
      tl.time(p * (n - 1 + 0.7)); // step i lives at time i; the last step holds at the end
      const i = Math.min(n - 1, Math.floor(p * n + 0.0001));
      apply(i);
      if (bar) bar.style.transform = `scaleX(${p})`;
    },
    onEnter: () => apply(0),
    onLeave: () => { field.setPreset('ambient'); },
    onEnterBack: () => apply(n - 1),
    onLeaveBack: () => { field.setPreset('ambient'); current = -1; },
  });
  section.classList.add('is-init');
  (window as any).__thread = { st, tl, dur };
  return () => { st.kill(); tl.kill(); field.setPreset('ambient'); delete (window as any).__thread; };
});
