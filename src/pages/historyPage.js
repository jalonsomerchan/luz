import { h } from '../utils/dom.js';

export function HistoryPage() {
  return h('div', { class: 'dashboard' }, h('section', { class: 'hero-card compact-hero' }, h('div', {}, h('span', { class: 'eyebrow' }, 'Datos'), h('h1', {}, 'Historico'), h('p', {}, 'Usa la seccion de estadisticas para ver el resumen avanzado.'))));
}
