import { h } from '../utils/dom.js';

export function KpiGrid(items = []) {
  return h('section', { class: 'kpi-grid' },
    items.map((item) => h('article', { class: `kpi-card ${item.className || ''}` },
      h('span', { class: 'kpi-label' }, item.label),
      h('strong', { class: 'kpi-value' }, item.value),
      item.detail ? h('small', { class: 'kpi-detail' }, item.detail) : null
    ))
  );
}
