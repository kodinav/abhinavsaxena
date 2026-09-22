import { onPage, prefersReducedMotion } from '@/lib/page';
import { layout, svgEl, debounce, type GNode, type GLink } from './graph-core';

/**
 * Research constellation: research areas as stars, relationships as
 * hairlines. Hover shows the neighbourhood; select opens the area's panel.
 */
interface AreaNode extends GNode { short: string; href: string; weight: number }

onPage<HTMLElement>('[data-constellation]', (root) => {
  const svg = root.querySelector<SVGSVGElement>('svg')!;
  const gEdges = svg.querySelector<SVGGElement>('.edges')!;
  const gNodes = svg.querySelector<SVGGElement>('.nodes')!;
  const stage = root.querySelector<HTMLElement>('.constellation__stage')!;
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-area-panel]'));
  const panelDefault = root.querySelector<HTMLElement>('[data-panel-default]');
  const data = JSON.parse(root.dataset.graph || '{}') as { nodes: AreaNode[]; links: { source: string; target: string }[] };
  const reduced = prefersReducedMotion();

  let nodes: AreaNode[] = data.nodes.map((n) => ({ ...n }));
  let links: GLink[] = data.links.map((l) => ({ ...l }));
  let selected: string | null = null;
  let hovered: string | null = null;
  let raf = 0;
  let t0 = performance.now();
  const nodeEls = new Map<string, SVGGElement>();
  const edgeEls: { el: SVGLineElement; a: string; b: string }[] = [];
  const neighbours = new Map<string, Set<string>>();
  for (const l of data.links) {
    if (!neighbours.has(l.source)) neighbours.set(l.source, new Set());
    if (!neighbours.has(l.target)) neighbours.set(l.target, new Set());
    neighbours.get(l.source)!.add(l.target);
    neighbours.get(l.target)!.add(l.source);
  }

  function build() {
    const W = Math.max(320, stage.clientWidth);
    const narrow = W < 640;
    const H = narrow ? Math.round(W * 1.15) : Math.round(Math.min(620, Math.max(420, W * 0.62)));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.height = H + 'px';
    nodes = data.nodes.map((n) => ({ ...n, x: undefined, y: undefined, r: narrow ? 6 + n.weight * 1.2 : 7 + n.weight * 1.6 }));
    links = data.links.map((l) => ({ ...l }));
    layout(nodes as GNode[], links, W, H, {
      linkDistance: narrow ? 110 : 170,
      charge: narrow ? -260 : -480,
      collide: narrow ? 48 : 62,
      hintStrength: 0.16,
      pad: narrow ? 56 : 70,
    });
    gEdges.replaceChildren();
    gNodes.replaceChildren();
    nodeEls.clear();
    edgeEls.length = 0;
    for (const l of links) {
      const a = l.source as AreaNode, b = l.target as AreaNode;
      const el = svgEl('line', { x1: a.x!, y1: a.y!, x2: b.x!, y2: b.y!, class: 'edge' });
      gEdges.appendChild(el);
      edgeEls.push({ el, a: a.id, b: b.id });
    }
    for (const n of nodes) {
      const g = svgEl('g', { class: 'node', transform: `translate(${n.x},${n.y})`, role: 'button', tabindex: 0, 'aria-label': `${n.label}: ${n.short}`, 'data-id': n.id });
      const inner = svgEl('g', { class: 'node__inner' });
      const halo = svgEl('circle', { r: n.r + 14, class: 'halo' });
      const ring = svgEl('circle', { r: n.r + 5, class: 'ring' });
      const core = svgEl('circle', { r: n.r, class: 'core' });
      const label = svgEl('text', { y: n.r + 20, 'text-anchor': 'middle', class: 'label' });
      label.textContent = n.label;
      inner.append(halo, ring, core, label);
      g.append(inner);
      (inner as SVGGElement).style.setProperty('--i', String(nodeEls.size));
      gNodes.appendChild(g);
      nodeEls.set(n.id, g as SVGGElement);
    }
    applyState();
  }

  function applyState() {
    const focus = hovered ?? selected;
    const near = focus ? neighbours.get(focus) ?? new Set() : null;
    root.classList.toggle('has-focus', !!focus);
    for (const [id, g] of nodeEls) {
      g.classList.toggle('is-selected', id === selected);
      g.classList.toggle('is-hover', id === hovered);
      g.classList.toggle('is-near', !!focus && id !== focus && !!near?.has(id));
      g.classList.toggle('is-dim', !!focus && id !== focus && !near?.has(id));
      g.setAttribute('aria-pressed', String(id === selected));
    }
    for (const e of edgeEls) {
      const on = !!focus && (e.a === focus || e.b === focus);
      e.el.classList.toggle('is-on', on);
      e.el.classList.toggle('is-dim', !!focus && !on);
    }
  }

  function select(id: string | null, focusPanel = false) {
    selected = id;
    applyState();
    panels.forEach((p) => { p.hidden = p.dataset.areaPanel !== id; });
    if (panelDefault) panelDefault.hidden = !!id;
    root.classList.toggle('has-selection', !!id);
    if (id && focusPanel) {
      const p = panels.find((x) => x.dataset.areaPanel === id);
      p?.querySelector<HTMLElement>('h3, [data-panel-title]')?.focus?.();
      if (window.innerWidth < 900) p?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  // gentle drift, only while visible
  let running = false;
  function tick(now: number) {
    if (!running) return;
    const t = (now - t0) / 1000;
    nodes.forEach((n, i) => {
      const dx = Math.sin(t * 0.35 + i * 1.7) * 2.2;
      const dy = Math.cos(t * 0.29 + i * 1.3) * 2.2;
      const g = nodeEls.get(n.id);
      if (g) g.setAttribute('transform', `translate(${(n.x! + dx).toFixed(2)},${(n.y! + dy).toFixed(2)})`);
      (n as any)._dx = dx; (n as any)._dy = dy;
    });
    for (const e of edgeEls) {
      const a = nodes.find((n) => n.id === e.a)!, b = nodes.find((n) => n.id === e.b)!;
      e.el.setAttribute('x1', (a.x! + (a as any)._dx).toFixed(2)); e.el.setAttribute('y1', (a.y! + (a as any)._dy).toFixed(2));
      e.el.setAttribute('x2', (b.x! + (b as any)._dx).toFixed(2)); e.el.setAttribute('y2', (b.y! + (b as any)._dy).toFixed(2));
    }
    raf = requestAnimationFrame(tick);
  }
  let inView = false, hovering = false;
  const start = () => { if (running || reduced || !inView || hovering) return; running = true; raf = requestAnimationFrame(tick); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  // the constellation holds still while the pointer is over it, so nodes are easy to catch
  const onEnterSvg = () => { hovering = true; stop(); };
  const onLeaveSvg = () => { hovering = false; start(); };
  svg.addEventListener('pointerenter', onEnterSvg);
  svg.addEventListener('pointerleave', onLeaveSvg);

  /* events (delegated) */
  const idOf = (e: Event) => (e.target as Element).closest<SVGGElement>('.node')?.dataset.id ?? null;
  const onOver = (e: Event) => { const id = idOf(e); if (id !== hovered) { hovered = id; applyState(); } };
  const onOut = (e: Event) => { if (!((e as FocusEvent).relatedTarget as Element | null)?.closest?.('.node')) { hovered = null; applyState(); } };
  const onClick = (e: Event) => { const id = idOf(e); if (!id) return; select(selected === id ? null : id, true); };
  const onKey = (e: KeyboardEvent) => {
    const id = idOf(e); if (!id) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(selected === id ? null : id, true); }
  };
  const onFocusIn = (e: Event) => { hovered = idOf(e); applyState(); };
  const onFocusOut = () => { hovered = null; applyState(); };
  const onPanelClick = (e: Event) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-select-area]');
    if (b) { e.preventDefault(); select(b.dataset.selectArea!, false); nodeEls.get(b.dataset.selectArea!)?.focus(); }
    const c = (e.target as HTMLElement).closest('[data-panel-close]');
    if (c) select(null);
  };
  svg.addEventListener('pointerover', onOver);
  svg.addEventListener('pointerout', onOut);
  svg.addEventListener('click', onClick);
  svg.addEventListener('keydown', onKey);
  svg.addEventListener('focusin', onFocusIn);
  svg.addEventListener('focusout', onFocusOut);
  root.addEventListener('click', onPanelClick);

  const io = new IntersectionObserver((en) => { inView = en[0].isIntersecting; inView ? start() : stop(); }, { threshold: 0.05 });
  io.observe(root);
  const ro = new ResizeObserver(debounce(() => build(), 120));
  ro.observe(stage);
  build();
  // entrance: play once the constellation scrolls into view
  if (reduced) root.classList.add('is-visible');
  else {
    const vis = new IntersectionObserver((en) => { if (en[0].isIntersecting) { root.classList.add('is-visible'); vis.disconnect(); } }, { threshold: 0.2 });
    vis.observe(root);
  }
  // deep link: /research#area
  const hash = location.hash.replace('#', '');
  if (hash && nodeEls.has(hash)) select(hash);

  return () => {
    stop(); io.disconnect(); ro.disconnect();
    svg.removeEventListener('pointerover', onOver);
    svg.removeEventListener('pointerout', onOut);
    svg.removeEventListener('click', onClick);
    svg.removeEventListener('keydown', onKey);
    svg.removeEventListener('focusin', onFocusIn);
    svg.removeEventListener('focusout', onFocusOut);
    svg.removeEventListener('pointerenter', onEnterSvg);
    svg.removeEventListener('pointerleave', onLeaveSvg);
    root.removeEventListener('click', onPanelClick);
  };
});
