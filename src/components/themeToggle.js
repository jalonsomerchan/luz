import { h } from '../utils/dom.js';

const KEY = 'luz:theme';

export const Theme = {
  init() {
    const saved = localStorage.getItem(KEY);
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = saved || (prefersDark ? 'dark' : 'light');
  },
  current() {
    return document.documentElement.dataset.theme || 'light';
  },
  toggle() {
    const next = this.current() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(KEY, next);
    window.dispatchEvent(new CustomEvent('luz:theme', { detail: next }));
  }
};

export function ThemeToggle() {
  const button = h('button', { class: 'icon-button theme-toggle', type: 'button', title: 'Cambiar tema', 'aria-label': 'Cambiar tema' });
  function render() {
    button.textContent = Theme.current() === 'dark' ? '☀' : '☾';
  }
  button.addEventListener('click', () => {
    Theme.toggle();
    render();
  });
  window.addEventListener('luz:theme', render);
  render();
  return button;
}
