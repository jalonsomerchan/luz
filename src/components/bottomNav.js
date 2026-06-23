import { h } from '../utils/dom.js';

const items = [
  { href: '#/', path: '/', icon: '⌁', label: 'Hoy' },
  { href: '#/semana', path: '/semana', icon: '▦', label: 'Semana' },
  { href: '#/mes', path: '/mes', icon: '◫', label: 'Mes' },
  { href: '#/buscar', path: '/buscar', icon: '⌕', label: 'Buscar' },
  { href: '#/estadisticas', path: '/estadisticas', icon: '↗', label: 'Stats' }
];

function currentPath() {
  const raw = location.hash.replace(/^#/, '') || '/';
  return raw.split('?')[0].replace(/\/+$/, '') || '/';
}

export function BottomNav() {
  const active = currentPath();
  return h('nav', { class: 'bottom-nav', 'aria-label': 'Navegación principal' },
    items.map((item) => h('a', {
      href: item.href,
      class: active === item.path ? 'is-active' : ''
    }, h('span', { 'aria-hidden': 'true' }, item.icon), h('small', {}, item.label)))
  );
}
