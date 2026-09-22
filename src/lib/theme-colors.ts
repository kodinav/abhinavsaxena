/** Read the current theme's colours from CSS variables (for canvas drawing). */
export function readThemeColors() {
  const cs = getComputedStyle(document.documentElement);
  const parse = (v: string, fallback: [number, number, number]): [number, number, number] => {
    const m = v.trim().split(/\s+/).map(Number);
    return m.length === 3 && m.every((n) => !Number.isNaN(n)) ? (m as [number, number, number]) : fallback;
  };
  return {
    paper: parse(cs.getPropertyValue('--paper-rgb'), [244, 241, 234]),
    ink: parse(cs.getPropertyValue('--ink-rgb'), [23, 22, 27]),
    accent: parse(cs.getPropertyValue('--accent-rgb'), [180, 67, 42]),
  };
}
export const rgba = (c: [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
