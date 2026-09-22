/** Minimal DOM helpers for lab experiments (no framework). */
type Child = Node | string | null | undefined | false | Child[];
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, any> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && typeof v !== 'string' && k !== 'list') (el as any)[k] = v;
    else el.setAttribute(k, String(v));
  }
  const append = (c: Child) => {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(append);
    else el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  };
  children.forEach(append);
  return el;
}

export function slider(opts: {
  label: string;
  min: number; max: number; step?: number; value: number;
  format?: (v: number) => string;
  hint?: string;
  onInput: (v: number) => void;
}) {
  const id = `sl-${Math.random().toString(36).slice(2, 8)}`;
  const out = h('output', { class: 'lab-slider__val tnum', for: id }, opts.format ? opts.format(opts.value) : String(opts.value));
  const input = h('input', {
    type: 'range', id, min: opts.min, max: opts.max, step: opts.step ?? 1, value: opts.value,
    class: 'lab-slider__input',
    oninput: (e: Event) => {
      const v = Number((e.target as HTMLInputElement).value);
      out.textContent = opts.format ? opts.format(v) : String(v);
      setFill();
      opts.onInput(v);
    },
  });
  const setFill = () => {
    const pct = ((Number(input.value) - opts.min) / (opts.max - opts.min)) * 100;
    input.style.setProperty('--fill', `${pct}%`);
  };
  setFill();
  const wrap = h('div', { class: 'lab-slider' },
    h('div', { class: 'lab-slider__head' }, h('label', { for: id, class: 'lab-slider__label' }, opts.label), out),
    input,
    opts.hint ? h('p', { class: 'lab-slider__hint' }, opts.hint) : null,
  );
  return { el: wrap, input, set: (v: number) => { input.value = String(v); out.textContent = opts.format ? opts.format(v) : String(v); setFill(); } };
}

export function toggle(opts: { label: string; hint?: string; checked?: boolean; onChange: (v: boolean) => void }) {
  const id = `tg-${Math.random().toString(36).slice(2, 8)}`;
  const input = h('input', { type: 'checkbox', id, role: 'switch', checked: !!opts.checked, class: 'lab-toggle__input', onchange: (e: Event) => opts.onChange((e.target as HTMLInputElement).checked) });
  const el = h('div', { class: 'lab-toggle' },
    input,
    h('label', { for: id, class: 'lab-toggle__label' },
      h('span', { class: 'lab-toggle__track', 'aria-hidden': 'true' }, h('span', { class: 'lab-toggle__knob' })),
      h('span', { class: 'lab-toggle__text' }, h('strong', {}, opts.label), opts.hint ? h('small', {}, opts.hint) : null),
    ),
  );
  return { el, input, set: (v: boolean) => { input.checked = v; } };
}

export function bar(label: string, value01: number, opts: { sub?: string; accent?: boolean } = {}) {
  const fill = h('span', { class: 'lab-bar__fill' + (opts.accent ? ' is-accent' : ''), style: { transform: `scaleX(${Math.max(0, Math.min(1, value01))})` } });
  const val = h('span', { class: 'lab-bar__val tnum' }, `${Math.round(value01 * 100)}`);
  const el = h('div', { class: 'lab-bar' },
    h('div', { class: 'lab-bar__head' }, h('span', { class: 'lab-bar__label' }, label, opts.sub ? h('small', {}, ' ' + opts.sub) : null), val),
    h('span', { class: 'lab-bar__track' }, fill),
  );
  return { el, set: (v: number) => { fill.style.transform = `scaleX(${Math.max(0, Math.min(1, v))})`; val.textContent = `${Math.round(v * 100)}`; }, setLabel: (s: string) => { val.textContent = s; } };
}

export function verdict(name: string, ok: boolean | null, why: string) {
  return h('div', { class: `lab-verdict ${ok === true ? 'is-yes' : ok === false ? 'is-no' : 'is-open'}` },
    h('span', { class: 'lab-verdict__mark', 'aria-hidden': 'true' }, ok === true ? '●' : ok === false ? '○' : '◐'),
    h('div', {}, h('strong', { class: 'lab-verdict__name' }, name), h('span', { class: 'lab-verdict__why' }, why)),
  );
}

export function panel(title: string, ...children: Child[]) {
  return h('section', { class: 'lab-panel' }, h('h3', { class: 'lab-panel__title' }, title), ...children);
}

export function note(text: string) {
  return h('p', { class: 'lab-note serif' }, text);
}

export const fmtPct = (v: number) => `${Math.round(v * 100)}%`;
