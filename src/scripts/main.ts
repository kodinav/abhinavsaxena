/**
 * Global behaviours, loaded once per full page load. Each module registers
 * itself with `onPage` and re-initialises after client-side navigations.
 */
import './theme';
import './nav';
import './reveal';
import './magnetic';
import './cursor';
import './copy';

document.documentElement.classList.remove('no-js');
