import { h } from '../utils/dom.js';

export function NotFoundPage() {
  return h('section', { class: 'glass-section centered' },
    h('span', { class: 'big-icon', 'aria-hidden': 'true' }, '⚡'),
    h('h1', {}, 'Página no encontrada'),
    h('p', { class: 'muted' }, 'Vuelve a la portada para consultar el precio de la luz de hoy.'),
    h('a', { class: 'primary-button', href: '#/' }, 'Ir a hoy')
  );
}
