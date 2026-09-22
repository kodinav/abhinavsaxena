import { onPage, prefersReducedMotion } from '@/lib/page';

/** Archive filtering, searching, URL sync and abstract expansion. */
onPage<HTMLElement>('[data-archive]', (root) => {
  const search = root.querySelector<HTMLInputElement>('[data-search]');
  const entries = Array.from(root.querySelectorAll<HTMLElement>('[data-pub]'));
  const countEl = root.querySelector<HTMLElement>('[data-count]');
  const emptyEl = root.querySelector<HTMLElement>('[data-empty]');
  const clearBtn = root.querySelector<HTMLElement>('[data-clear]');
  const groups = Array.from(root.querySelectorAll<HTMLElement>('[data-filter-group]'));
  const reduced = prefersReducedMotion();
  const state: Record<string, string> = { q: '', area: '', year: '', status: '', type: '' };

  // init from URL
  const params = new URLSearchParams(location.search);
  for (const k of Object.keys(state)) state[k] = params.get(k) ?? '';
  if (search) search.value = state.q;

  function syncChips() {
    for (const g of groups) {
      const key = g.dataset.filterGroup!;
      g.querySelectorAll<HTMLElement>('[data-filter-value]').forEach((b) => {
        b.setAttribute('aria-pressed', String((b.dataset.filterValue ?? '') === state[key]));
      });
    }
  }

  function apply(push = true) {
    const q = state.q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let n = 0;
    for (const el of entries) {
      const ok =
        (!q || (el.dataset.search ?? '').includes(q)) &&
        (!state.area || (el.dataset.areas ?? '').split(' ').includes(state.area)) &&
        (!state.year || el.dataset.year === state.year) &&
        (!state.status || el.dataset.status === state.status) &&
        (!state.type || el.dataset.type === state.type);
      el.classList.toggle('is-filtered-out', !ok);
      if (ok) n++;
    }
    if (countEl) countEl.textContent = `${n} of ${entries.length}`;
    if (emptyEl) emptyEl.hidden = n > 0;
    const active = Object.values(state).some(Boolean);
    clearBtn?.toggleAttribute('hidden', !active);
    root.classList.toggle('is-filtering', active);
    syncChips();
    if (push) {
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(state)) if (v) p.set(k, v);
      const qs = p.toString();
      history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
    }
  }

  let debounce = 0;
  const onInput = () => { clearTimeout(debounce); debounce = window.setTimeout(() => { state.q = search!.value; apply(); }, 120); };
  const onClick = (e: Event) => {
    const t = e.target as HTMLElement;
    const chip = t.closest<HTMLElement>('[data-filter-value]');
    if (chip) {
      const key = chip.closest<HTMLElement>('[data-filter-group]')!.dataset.filterGroup!;
      const val = chip.dataset.filterValue ?? '';
      state[key] = state[key] === val ? '' : val;
      apply();
      return;
    }
    if (t.closest('[data-clear]')) {
      for (const k of Object.keys(state)) state[k] = '';
      if (search) search.value = '';
      apply();
      return;
    }
    const toggle = t.closest<HTMLButtonElement>('.pub__toggle');
    if (toggle) {
      const panel = document.getElementById(toggle.getAttribute('aria-controls')!)!;
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      if (!open) {
        panel.hidden = false;
        if (reduced) { panel.style.height = 'auto'; return; }
        panel.style.height = '0px';
        requestAnimationFrame(() => { panel.style.height = panel.scrollHeight + 'px'; });
        panel.addEventListener('transitionend', function done() { if (toggle.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto'; panel.removeEventListener('transitionend', done); });
      } else {
        if (reduced) { panel.hidden = true; panel.style.height = '0px'; return; }
        panel.style.height = panel.scrollHeight + 'px';
        requestAnimationFrame(() => { panel.style.height = '0px'; });
        panel.addEventListener('transitionend', function done() { if (toggle.getAttribute('aria-expanded') === 'false') panel.hidden = true; panel.removeEventListener('transitionend', done); });
      }
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === '/' && document.activeElement !== search && !(document.activeElement as HTMLElement)?.matches('input, textarea')) { e.preventDefault(); search?.focus(); }
    if (e.key === 'Escape' && document.activeElement === search) { search!.value = ''; state.q = ''; apply(); }
  };

  search?.addEventListener('input', onInput);
  root.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  apply(false);
  // open abstract when deep-linked to an entry
  if (location.hash) {
    const target = root.querySelector<HTMLElement>(location.hash);
    target?.querySelector<HTMLButtonElement>('.pub__toggle')?.click();
  }
  return () => {
    search?.removeEventListener('input', onInput);
    root.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
  };
});
