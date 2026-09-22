/**
 * Experiment registry.
 *
 * To add an experiment:
 *  1. Create src/content/lab/<slug>.md with `module: <key>`.
 *  2. Create src/scripts/lab/experiments/<key>.ts exporting
 *     `export default { mount(root, ctx) { ...; return cleanup } }`.
 *  3. Register the key below. It is code-split automatically.
 */
export interface LabContext { reduced: boolean; touch: boolean }
export interface Experiment { mount(root: HTMLElement, ctx: LabContext): void | (() => void) }

export const registry: Record<string, () => Promise<{ default: Experiment }>> = {
  'mind-detector': () => import('./experiments/mind-detector'),
  'ship-of-theseus': () => import('./experiments/ship-of-theseus'),
  'epistemic-chain': () => import('./experiments/epistemic-chain'),
  'agency-sim': () => import('./experiments/agency-sim'),
  'responsibility-gap': () => import('./experiments/responsibility-gap'),
  'machine-knowledge': () => import('./experiments/machine-knowledge'),
};
