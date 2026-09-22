import { onPage, prefersReducedMotion } from '@/lib/page';
import { layout, svgEl, debounce, type GNode, type GLink } from './graph-core';

/**
 * Concept map: nodes are concepts, edges are typed relations. The "spine"
 * (AI → Mind → Agency → Knowledge → Ethics → Responsibility → Technology)
 * can be followed step by step.
 */
interface CNode extends GNode { definition: string; spine: boolean; order: number }
interface CLink extends GLink { type: string; note: string }

const relationVerb: Record<string, string> = {
  grounds: 'grounds', requires: 'requires', constrains: 'constrains', extends: 'extends',
  challenges: 'challenges', mediates: 'mediates', presupposes: 'presupposes',
};

onPage<HTMLElement>('[data-concept-graph]', (root) => {
  const svg = root.querySelector<SVGSVGElement>('svg')!;
  const gEdges = svg.querySelector<SVGGElement>('.edges')!;
  const gLabels = svg.querySelector<SVGGElement>('.edge-labels')!;
  const gNodes = svg.querySelector<SVGGElement>('.nodes')!;
  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const panelDefault = root.querySelector<HTMLElement>('[data-panel-default]')!;
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-concept-panel]'));
  const threadBtn = root.querySelector<HTMLButtonElement>('[data-thread]');
  const threadOut = root.querySelector<HTMLElement>('[data-thread-out]');
  const data = JSON.parse(root.dataset.graph || '{}') as { nodes: CNode[]; links: { source: string; target: string; type: string; note: string }[] };
  const reduced = prefersReducedMotion();

  let nodes: CNode[] = [];
  let links: CLink[] = [];
  let selected: string | null = null;
  let hovered: string | null = null;
  let threadTimer = 0;
  const nodeEls = new Map<string, SVGGElement>();
  const edgeEls: { path: SVGPathElement; label: SVGTextElement; a: string; b: string; type: string }[] = [];
  const adj = new Map<string, Set<string>>();
  for (const l of data.links) {
    if (!adj.has(l.source)) adj.set(l.source, new Set());
    if (!adj.has(l.target)) adj.set(l.target, new Set());
    adj.get(l.source)!.add(l.target); adj.get(l.target)!.add(l.source);
  }
  const spine = data.nodes.filter((n) => n.spine).sort((a, b) => a.order - b.order).map((n) => n.id);

  function curve(a: CNode, b: CNode) {
    const dx = b.x! - a.x!, dy = b.y! - a.y!;
    const mx = (a.x! + b.x!) / 2, my = (a.y! + b.y!) / 2;
    const len = Math.hypot(dx, dy) || 1;
    const k = Math.min(40, len * 0.15);
    const cx = mx - (dy / len) * k, cy = my + (dx / len) * k;
    return { d: `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`, lx: 0.25 * a.x! + 0.5 * cx + 0.25 * b.x!, ly: 0.25 * a.y! + 0.5 * cy + 0.25 * b.y! };
  }

  function build() {
    const W = Math.max(320, stage.clientWidth);
    const narrow = W < 640;
    const H = narrow ? Math.round(W * 1.6) : Math.round(Math.min(720, Math.max(520, W * 0.66)));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.height = H + 'px';
    // spine nodes get hinted positions along a gentle arc; others fill around
    const nS = spine.length;
    nodes = data.nodes.map((n) => {
      const si = spine.indexOf(n.id);
      let hx = 0.5, hy = 0.5;
      if (si >= 0) {
        const t = si / (nS - 1);
        if (narrow) { hx = 0.5 + Math.sin(t * Math.PI * 2) * 0.28; hy = 0.08 + t * 0.84; }
        else { hx = 0.08 + t * 0.84; hy = 0.5 + Math.sin(t * Math.PI) * -0.22 + (si % 2 ? 0.1 : -0.05); }
      } else {
        const ang = (n.order * 2.4) % (Math.PI * 2);
        hx = 0.5 + Math.cos(ang) * 0.42; hy = 0.5 + Math.sin(ang) * 0.42;
      }
      return { ...n, x: undefined, y: undefined, hx, hy, r: n.spine ? (narrow ? 8 : 10) : narrow ? 5 : 6 };
    });
    links = data.links.map((l) => ({ ...l })) as unknown as CLink[];
    layout(nodes as GNode[], links, W, H, { linkDistance: narrow ? 90 : 150, charge: narrow ? -180 : -360, collide: narrow ? 34 : 50, hintStrength: narrow ? 0.35 : 0.3, pad: narrow ? 48 : 64, ticks: 320 });
    gEdges.replaceChildren(); gLabels.replaceChildren(); gNodes.replaceChildren();
    nodeEls.clear(); edgeEls.length = 0;
    for (const l of links) {
      const a = l.source as CNode, b = l.target as CNode;
      const { d, lx, ly } = curve(a, b);
      const path = svgEl('path', { d, class: 'edge', 'data-type': l.type }) as SVGPathElement;
      const label = svgEl('text', { x: lx, y: ly, class: 'edge-label', 'text-anchor': 'middle' }) as SVGTextElement;
      label.textContent = relationVerb[l.type] ?? l.type;
      gEdges.appendChild(path); gLabels.appendChild(label);
      edgeEls.push({ path, label, a: a.id, b: b.id, type: l.type });
    }
    for (const n of nodes) {
      const g = svgEl('g', { class: `node ${n.spine ? 'is-spine' : ''}`, transform: `translate(${n.x},${n.y})`, role: 'button', tabindex: 0, 'aria-label': `${n.label}: ${n.definition}`, 'data-id': n.id }) as SVGGElement;
      const halo = svgEl('circle', { r: n.r + 16, class: 'halo' });
      const ring = svgEl('circle', { r: n.r + 5, class: 'ring' });
      const core = svgEl('circle', { r: n.r, class: 'core' });
      const label = svgEl('text', { y: n.r + (narrow ? 16 : 20), 'text-anchor': 'middle', class: 'label' });
      label.textContent = n.label;
      g.append(halo, ring, core, label);
      gNodes.appendChild(g);
      nodeEls.set(n.id, g);
    }
    applyState();
  }

  function applyState() {
    const focus = hovered ?? selected;
    const near = focus ? adj.get(focus) ?? new Set() : null;
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
      e.path.classList.toggle('is-on', on);
      e.path.classList.toggle('is-dim', !!focus && !on);
      e.label.classList.toggle('is-on', on);
    }
  }

  function select(id: string | null, opts: { scroll?: boolean; hash?: boolean } = {}) {
    selected = id;
    applyState();
    panels.forEach((p) => { p.hidden = p.dataset.conceptPanel !== id; });
    panelDefault.hidden = !!id;
    if (opts.hash !== false) history.replaceState(null, '', id ? `#${id}` : location.pathname);
    if (id && opts.scroll && window.innerWidth < 900) panels.find((p) => p.dataset.conceptPanel === id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  function stopThread() { clearInterval(threadTimer); threadTimer = 0; threadBtn?.setAttribute('aria-pressed', 'false'); root.classList.remove('is-threading'); }
  function followThread() {
    if (threadTimer) { stopThread(); return; }
    let i = 0;
    threadBtn?.setAttribute('aria-pressed', 'true');
    root.classList.add('is-threading');
    const stepThread = () => {
      if (i >= spine.length) { stopThread(); return; }
      const id = spine[i];
      hovered = null;
      select(id, { hash: false });
      // show the relation to the next node
      const next = spine[i + 1];
      const rel = next ? data.links.find((l) => (l.source === id && l.target === next) || (l.source === next && l.target === id)) : null;
      const a = data.nodes.find((n) => n.id === id)!;
      const b = next ? data.nodes.find((n) => n.id === next)! : null;
      if (threadOut) threadOut.innerHTML = rel && b ? `<strong>${a.label}</strong> <em>${relationVerb[rel.type]}</em> <strong>${b.label}</strong> — ${rel.note}` : `<strong>${a.label}</strong> — ${a.definition}`;
      // pulse edge along the spine
      edgeEls.forEach((e) => e.path.classList.toggle('is-thread', !!next && ((e.a === id && e.b === next) || (e.b === id && e.a === next))));
      i++;
    };
    stepThread();
    threadTimer = window.setInterval(stepThread, reduced ? 2600 : 2200);
  }

  /* events */
  const idOf = (e: Event) => (e.target as Element).closest<SVGGElement>('.node')?.dataset.id ?? null;
  const onOver = (e: Event) => { const id = idOf(e); if (id !== hovered) { hovered = id; applyState(); } };
  const onOut = (e: Event) => { if (!((e as FocusEvent).relatedTarget as Element | null)?.closest?.('.node')) { hovered = null; applyState(); } };
  const onClick = (e: Event) => { const id = idOf(e); if (!id) return; stopThread(); select(selected === id ? null : id, { scroll: true }); };
  const onKey = (e: KeyboardEvent) => { const id = idOf(e); if (!id) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stopThread(); select(selected === id ? null : id, { scroll: true }); } };
  const onPanelClick = (e: Event) => {
    const t = e.target as HTMLElement;
    const b = t.closest<HTMLElement>('[data-select-concept]');
    if (b) { e.preventDefault(); stopThread(); select(b.dataset.selectConcept!, { scroll: false }); nodeEls.get(b.dataset.selectConcept!)?.focus({ preventScroll: true }); }
    if (t.closest('[data-panel-close]')) { stopThread(); select(null); }
  };
  const onHash = () => { const id = location.hash.replace('#', ''); if (id && nodeEls.has(id)) select(id, { hash: false, scroll: true }); };
  svg.addEventListener('pointerover', onOver);
  svg.addEventListener('pointerout', onOut);
  svg.addEventListener('click', onClick);
  svg.addEventListener('keydown', onKey);
  svg.addEventListener('focusin', onOver);
  svg.addEventListener('focusout', () => { hovered = null; applyState(); });
  root.addEventListener('click', onPanelClick);
  threadBtn?.addEventListener('click', followThread);
  window.addEventListener('hashchange', onHash);
  const ro = new ResizeObserver(debounce(() => build(), 120));
  ro.observe(stage);
  build();
  onHash();

  return () => {
    stopThread(); ro.disconnect();
    svg.removeEventListener('pointerover', onOver);
    svg.removeEventListener('pointerout', onOut);
    svg.removeEventListener('click', onClick);
    svg.removeEventListener('keydown', onKey);
    root.removeEventListener('click', onPanelClick);
    threadBtn?.removeEventListener('click', followThread);
    window.removeEventListener('hashchange', onHash);
  };
});
