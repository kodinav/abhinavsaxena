import { onPage, prefersReducedMotion, deviceBudget, isTouch, clamp, lerp } from '@/lib/page';
import { createNoise3D } from '@/lib/noise';
import { readThemeColors, rgba } from '@/lib/theme-colors';

/**
 * The hero "concept field".
 *
 * A canvas of ink particles drifts along a slowly evolving flow field. The
 * concepts in the tagline and in the field are anchors in that space. When a
 * visitor hovers/focuses/taps a concept, the field bends toward it, threads
 * are drawn to its related concepts, and a one-line bridge appears. The point
 * is to make the intellectual territory feel like a space you move through
 * rather than a list you read.
 */
interface GNode { id: string; label: string; primary: boolean; x: number; y: number; px?: number; py?: number; definition: string }
interface GLink { a: string; b: string; note: string }
interface Graph { nodes: GNode[]; links: GLink[] }

onPage<HTMLElement>('[data-hero]', (hero) => {
  const canvas = hero.querySelector<HTMLCanvasElement>('[data-hero-canvas]');
  const bridge = hero.querySelector<HTMLElement>('[data-bridge]');
  const bridgeDefault = bridge?.dataset.default ?? '';
  const graph: Graph = JSON.parse(hero.dataset.graph || '{"nodes":[],"links":[]}');
  const wordEls = Array.from(hero.querySelectorAll<HTMLElement>('[data-concept]'));
  const fieldLabels = hero.querySelector<HTMLElement>('[data-field-labels]');
  if (!canvas) return;
  const ctx0 = canvas.getContext('2d', { alpha: true });
  if (!ctx0) return;
  const ctx: CanvasRenderingContext2D = ctx0;

  const reduced = prefersReducedMotion();
  const touch = isTouch();
  const noise = createNoise3D(7);
  let colors = readThemeColors();

  /* ---------- sizing ---------- */
  let W = 0, H = 0, dpr = 1;
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const resize = () => {
    const r = hero.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    dpr = clamp(window.devicePixelRatio || 1, 1, 1.5);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // resolve node pixel positions
    for (const n of graph.nodes) {
      const el = hero.querySelector<HTMLElement>(`[data-concept="${n.id}"]`);
      if (el && el.offsetParent !== null) {
        const b = (el.querySelector<HTMLElement>('[data-anchor]') ?? el).getBoundingClientRect();
        n.px = b.left + b.width / 2 - r.left;
        n.py = b.top + b.height / 2 - r.top;
      } else {
        n.px = n.x * W;
        n.py = n.y * H;
      }
    }
    // position floating field labels (desktop only; CSS hides them on narrow screens)
    fieldLabels?.querySelectorAll<HTMLElement>('[data-concept]').forEach((el) => {
      const n = nodeById.get(el.dataset.concept!);
      if (!n) return;
      el.style.left = `${(n.x * 100).toFixed(2)}%`;
      el.style.top = `${(n.y * 100).toFixed(2)}%`;
    });
    // re-measure after positioning
    for (const n of graph.nodes) {
      const el = hero.querySelector<HTMLElement>(`[data-concept="${n.id}"]`);
      if (el && el.offsetParent !== null) {
        const b = (el.querySelector<HTMLElement>('[data-anchor]') ?? el).getBoundingClientRect();
        n.px = b.left + b.width / 2 - r.left;
        n.py = b.top + b.height / 2 - r.top;
      }
    }
    seed();
    if (reduced) drawStatic();
  };

  /* ---------- particles ---------- */
  const budget = deviceBudget();
  let N = 0;
  let px: Float32Array, py: Float32Array, pl: Float32Array; // pos + life
  const seed = () => {
    N = Math.round(clamp((W * H) / 1800, 220, 1400) * budget);
    px = new Float32Array(N); py = new Float32Array(N); pl = new Float32Array(N);
    for (let i = 0; i < N; i++) { px[i] = Math.random() * W; py[i] = Math.random() * H; pl[i] = Math.random() * 200; }
    ctx.clearRect(0, 0, W, H);
  };

  /* ---------- interaction state ---------- */
  let active: GNode | null = null;
  let activeT = 0;          // 0..1 eased presence of the active state
  let threadT = 0;          // 0..1 thread drawing progress
  let pointer = { x: -9999, y: -9999, on: false };
  let t = 0;
  let raf = 0;
  let running = false;
  let lastFrame = 0;

  const linkedTo = (id: string) => graph.links.filter((l) => l.a === id || l.b === id);

  const setActive = (n: GNode | null) => {
    if (active === n) return;
    active = n;
    threadT = 0;
    wordEls.forEach((el) => {
      const on = !!n && el.dataset.concept === n.id;
      el.classList.toggle('is-active', on);
      const rel = !!n && linkedTo(n.id).some((l) => (l.a === el.dataset.concept || l.b === el.dataset.concept) && el.dataset.concept !== n.id);
      el.classList.toggle('is-related', rel);
    });
    hero.classList.toggle('has-active', !!n);
    if (bridge) {
      if (n) {
        const links = linkedTo(n.id);
        const first = links[0];
        const other = first ? nodeById.get(first.a === n.id ? first.b : first.a) : null;
        bridge.innerHTML = `<span class="hero__bridge-def">${escapeHtml(n.definition)}</span>` +
          (other ? `<span class="hero__bridge-rel"><span class="hero__bridge-pair">${escapeHtml(n.label)} ↔ ${escapeHtml(other.label)}</span> ${escapeHtml(first.note)}</span>` : '');
      } else {
        bridge.innerHTML = bridgeDefault;
      }
    }
    if (reduced) drawStatic();
  };

  const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

  /* ---------- field math ---------- */
  const scale = 0.0022;
  function flow(x: number, y: number, time: number, out: { x: number; y: number }) {
    const a = noise(x * scale, y * scale, time * 0.06) * Math.PI * 2;
    let vx = Math.cos(a), vy = Math.sin(a);
    // pointer: gentle swirl around the cursor
    if (pointer.on) {
      const dx = x - pointer.x, dy = y - pointer.y;
      const d2 = dx * dx + dy * dy;
      const R = 160;
      if (d2 < R * R) {
        const d = Math.sqrt(d2) + 0.001;
        const f = (1 - d / R) * 1.6;
        vx += (-dy / d) * f; vy += (dx / d) * f;
      }
    }
    // active concept: attraction toward it and its related nodes
    if (active && activeT > 0.001) {
      const targets = [active, ...linkedTo(active.id).map((l) => nodeById.get(l.a === active!.id ? l.b : l.a)!).filter(Boolean)];
      for (let i = 0; i < targets.length; i++) {
        const n = targets[i];
        const dx = n.px! - x, dy = n.py! - y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const R = i === 0 ? 420 : 240;
        if (d < R) {
          const f = (1 - d / R) * (i === 0 ? 2.2 : 1.1) * activeT;
          // orbit + pull: tangential plus radial component
          vx += (dx / d) * f * 0.55 + (-dy / d) * f * 0.45;
          vy += (dy / d) * f * 0.55 + (dx / d) * f * 0.45;
        }
      }
    }
    out.x = vx; out.y = vy;
  }

  const v = { x: 0, y: 0 };

  function step(dt: number) {
    t += dt;
    activeT = lerp(activeT, active ? 1 : 0, 0.08);
    if (active) threadT = Math.min(1, threadT + dt * 1.6);
    // fade previous frame toward transparent → trails
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    const speed = 0.8 + activeT * 0.5;
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(colors.ink, 0.42);
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const x = px[i], y = py[i];
      flow(x, y, t, v);
      const nx = x + v.x * speed, ny = y + v.y * speed;
      pl[i] -= 1;
      if (nx < -4 || nx > W + 4 || ny < -4 || ny > H + 4 || pl[i] < 0) {
        px[i] = Math.random() * W; py[i] = Math.random() * H; pl[i] = 120 + Math.random() * 200;
        continue;
      }
      ctx.moveTo(x, y); ctx.lineTo(nx, ny);
      px[i] = nx; py[i] = ny;
    }
    ctx.stroke();
    drawNodes(true);
  }

  function drawNodes(animated: boolean) {
    // concept anchors: small rings; active: accent + threads
    for (const n of graph.nodes) {
      if (n.px == null) continue;
      const isA = active?.id === n.id;
      const rel = active && !isA && linkedTo(active.id).some((l) => l.a === n.id || l.b === n.id);
      if (!isA && !rel) continue; // idle anchors are the HTML dots themselves
      ctx.beginPath();
      ctx.arc(n.px, n.py!, isA ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = rgba(colors.accent, isA ? 1 : 0.8);
      ctx.fill();
      if (isA) {
        ctx.beginPath();
        ctx.arc(n.px, n.py!, 14 + (animated ? Math.sin(t * 2) * 2 : 0), 0, Math.PI * 2);
        ctx.strokeStyle = rgba(colors.accent, 0.45);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    if (active && active.px != null) {
      const links = linkedTo(active.id);
      const prog = reduced ? 1 : easeOut(threadT);
      ctx.lineWidth = 1;
      for (const l of links) {
        const o = nodeById.get(l.a === active.id ? l.b : l.a);
        if (!o || o.px == null) continue;
        const ax = active.px, ay = active.py!, bx = o.px, by = o.py!;
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        const dx = bx - ax, dy = by - ay;
        const len = Math.hypot(dx, dy) || 1;
        const cx = mx - dy / len * len * 0.18, cy = my + dx / len * len * 0.18;
        ctx.strokeStyle = rgba(colors.accent, (W < 900 ? 0.45 : 0.75) * activeT);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        // draw partial quadratic curve
        const steps = 24;
        for (let s = 1; s <= steps; s++) {
          const u = (s / steps) * prog;
          const x = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * cx + u * u * bx;
          const y = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * cy + u * u * by;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }

  const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

  function drawStatic() {
    // one dense pass of short streaks so the field is present without motion
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = rgba(colors.ink, 0.28);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      let x = px[i], y = py[i];
      ctx.moveTo(x, y);
      for (let s = 0; s < 8; s++) {
        flow(x, y, 0, v);
        x += v.x * 1.4; y += v.y * 1.4;
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    activeT = active ? 1 : 0;
    drawNodes(false);
  }

  function loop(now: number) {
    if (!running) return;
    const dt = Math.min(0.05, (now - (lastFrame || now)) / 1000);
    lastFrame = now;
    step(dt);
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (running || reduced) return; running = true; lastFrame = 0; raf = requestAnimationFrame(loop); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  /* ---------- events ---------- */
  const onMove = (e: PointerEvent) => {
    const r = hero.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.on = true;
  };
  const onLeave = () => { pointer.on = false; };
  let lastPointerType = touch ? 'touch' : 'mouse';
  let downActiveId: string | null = null;   // which concept was active when the pointer went down
  let downOnConcept = false;
  const onPointerDown = (e: PointerEvent) => {
    lastPointerType = e.pointerType || lastPointerType;
    downActiveId = active?.id ?? null;
    downOnConcept = !!(e.target as Element).closest?.('[data-concept]');
  };
  const isTap = () => lastPointerType === 'touch' || lastPointerType === 'pen';
  const onWordEnter = (e: PointerEvent) => { if (e.pointerType === 'touch') return; setActive(nodeById.get((e.currentTarget as HTMLElement).dataset.concept!) ?? null); };
  const onWordLeave = (e: PointerEvent) => { if (e.pointerType === 'touch') return; setActive(null); };
  const onWordFocus = (e: Event) => setActive(nodeById.get((e.currentTarget as HTMLElement).dataset.concept!) ?? null);
  const onWordBlur = () => { if (!isTap()) setActive(null); };
  const onWordClick = (e: Event) => {
    if (!isTap()) return;
    const el = e.currentTarget as HTMLElement;
    const n = nodeById.get(el.dataset.concept!) ?? null;
    // first tap activates; a second tap on the already-active concept follows the link
    if (n && downActiveId !== n.id) { e.preventDefault(); setActive(n); }
  };
  const onHeroTap = (e: Event) => { if (isTap() && !downOnConcept && !(e.target as HTMLElement).closest('[data-concept]')) setActive(null); };

  hero.addEventListener('pointerdown', onPointerDown, { passive: true, capture: true });
  wordEls.forEach((el) => {
    el.addEventListener('pointerenter', onWordEnter as EventListener);
    el.addEventListener('pointerleave', onWordLeave as EventListener);
    el.addEventListener('focus', onWordFocus);
    el.addEventListener('blur', onWordBlur);
    el.addEventListener('click', onWordClick);
  });
  hero.addEventListener('pointermove', onMove, { passive: true });
  hero.addEventListener('pointerleave', onLeave);
  hero.addEventListener('click', onHeroTap);

  const io = new IntersectionObserver((en) => { en[0].isIntersecting ? start() : stop(); }, { threshold: 0.02 });
  io.observe(hero);
  const onVis = () => { document.hidden ? stop() : (io.takeRecords(), start()); };
  document.addEventListener('visibilitychange', onVis);
  const onTheme = () => { colors = readThemeColors(); if (reduced) drawStatic(); };
  document.addEventListener('themechange', onTheme);
  const ro = new ResizeObserver(() => resize());
  ro.observe(hero);
  resize();
  start();

  return () => {
    stop();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    document.removeEventListener('themechange', onTheme);
    hero.removeEventListener('pointermove', onMove);
    hero.removeEventListener('pointerleave', onLeave);
    hero.removeEventListener('click', onHeroTap);
    hero.removeEventListener('pointerdown', onPointerDown, { capture: true } as any);
    wordEls.forEach((el) => {
      el.removeEventListener('pointerenter', onWordEnter as EventListener);
      el.removeEventListener('pointerleave', onWordLeave as EventListener);
      el.removeEventListener('focus', onWordFocus);
      el.removeEventListener('blur', onWordBlur);
      el.removeEventListener('click', onWordClick);
    });
  };
});
