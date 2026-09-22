import { onPage } from '@/lib/page';

export type Theme = 'light' | 'dark';

export function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'light' ? 'light' : 'dark';
}

export function setTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  try {
    localStorage.setItem('theme', t);
  } catch {}
  document.querySelectorAll<HTMLElement>('[data-theme-toggle]').forEach((b) => {
    b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    b.dataset.state = t;
  });
  document.dispatchEvent(new CustomEvent('themechange', { detail: t }));
}

onPage('body', () => {
  const buttons = document.querySelectorAll<HTMLElement>('[data-theme-toggle]');
  const t = currentTheme();
  buttons.forEach((b) => {
    b.dataset.state = t;
    b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  });
  const handler = (e: Event) => {
    const btn = (e.target as HTMLElement).closest('[data-theme-toggle]');
    if (!btn) return;
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  };
  document.addEventListener('click', handler);
  return () => document.removeEventListener('click', handler);
});
