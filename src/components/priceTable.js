import { h } from '../utils/dom.js';
import { centsKwh, hourLabel } from '../utils/format.js';
import { periodMeta } from '../utils/electricity.js';

export function PriceTable(items = [], options = {}) {
  if (!items.length) return h('div', { class: 'empty-state' }, 'No hay precios para mostrar.');
  const sorted = [...items].sort((a, b) => a.hour - b.hour);
  const cheapest = Math.min(...sorted.map((item) => item.priceKwh));
  const expensive = Math.max(...sorted.map((item) => item.priceKwh));

  return h('section', { class: 'table-card' },
    h('div', { class: 'section-head' },
      h('div', {},
        h('h2', { class: 'section-title' }, options.title || 'Tabla por horas'),
        h('p', { class: 'section-subtitle' }, options.subtitle || 'Precio en €/kWh, redondeado a dos decimales')
      )
    ),
    h('div', { class: 'responsive-table' },
      h('table', {},
        h('thead', {}, h('tr', {},
          h('th', {}, 'Hora'),
          h('th', {}, 'Tramo'),
          h('th', {}, 'Precio'),
          h('th', {}, 'Detalle')
        )),
        h('tbody', {},
          sorted.map((item) => {
            const meta = periodMeta(item.period);
            const marker = item.priceKwh === cheapest ? 'Más barata' : item.priceKwh === expensive ? 'Más cara' : '';
            return h('tr', { class: meta.className + ' ' + (item.hour === options.currentHour ? 'is-current-row' : '') },
              h('td', {}, hourLabel(item.hour)),
              h('td', {}, h('span', { class: 'period-badge ' + meta.className }, item.period, ' · ', meta.name)),
              h('td', {}, h('strong', {}, centsKwh(item.priceKwh))),
              h('td', {}, marker ? h('span', { class: 'status-pill' }, marker) : h('span', { class: 'muted' }, '—'))
            );
          })
        )
      )
    )
  );
}

export function DaySummaryTable(dayStats = []) {
  if (!dayStats.length) return h('div', { class: 'empty-state' }, 'No hay días cargados.');
  return h('section', { class: 'table-card' },
    h('div', { class: 'section-head' },
      h('div', {}, h('h2', { class: 'section-title' }, 'Resumen por día'), h('p', { class: 'section-subtitle' }, 'Media, mínimo y máximo horario'))
    ),
    h('div', { class: 'responsive-table' },
      h('table', {},
        h('thead', {}, h('tr', {}, h('th', {}, 'Día'), h('th', {}, 'Media'), h('th', {}, 'Mínimo'), h('th', {}, 'Máximo'), h('th', {}, 'Mejor hora'))),
        h('tbody', {}, dayStats.map((day) => h('tr', {},
          h('td', {}, h('a', { href: '#/buscar?fecha=' + day.date }, day.date)),
          h('td', {}, centsKwh(day.stats.average)),
          h('td', {}, centsKwh(day.stats.min.priceKwh)),
          h('td', {}, centsKwh(day.stats.max.priceKwh)),
          h('td', {}, hourLabel(day.stats.min.hour))
        )))
      )
    )
  );
}
