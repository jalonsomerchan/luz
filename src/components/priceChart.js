import { h } from '../utils/dom.js';
import { compactCents, hourLabel } from '../utils/format.js';
import { periodMeta } from '../utils/electricity.js';

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

export function PriceChart(items = [], options = {}) {
  const valid = items.filter((item) => Number.isFinite(item.priceKwh));
  if (!valid.length) return h('div', { class: 'empty-state' }, 'No hay datos para dibujar la gráfica.');

  const max = Math.max(...valid.map((item) => item.priceKwh));
  const min = Math.min(...valid.map((item) => item.priceKwh));
  const average = valid.reduce((sum, item) => sum + item.priceKwh, 0) / valid.length;
  const currentHour = Number.isFinite(options.currentHour) ? options.currentHour : null;
  const averageBottom = max > 0 ? clampPercent((average / max) * 100) : 0;
  const currentLeft = currentHour !== null ? clampPercent(((currentHour + 0.5) / 24) * 100) : null;

  return h('div', { class: 'chart-card' },
    h('div', { class: 'chart-head' },
      h('div', {},
        h('h2', { class: 'section-title' }, options.title || 'Precio por horas'),
        h('p', { class: 'section-subtitle' }, options.subtitle || 'Cada barra representa una hora del día')
      ),
      h('div', { class: 'chart-scale' },
        h('span', {}, 'Máx. ' + compactCents(max)),
        h('span', {}, 'Media ' + compactCents(average)),
        h('span', {}, 'Mín. ' + compactCents(min))
      )
    ),
    h('div', { class: 'bar-chart', role: 'img', 'aria-label': 'Gráfica de barras del precio de la luz por horas' },
      h('div', {
        class: 'average-line',
        style: '--average-bottom: calc(.28rem + ' + (averageBottom * 0.82) + '%);',
        'aria-hidden': 'true'
      }, h('span', {}, 'Media ' + compactCents(average))),
      currentLeft !== null ? h('div', {
        class: 'now-line',
        style: '--current-left: ' + currentLeft + '%;',
        'aria-hidden': 'true'
      }, h('span', {}, 'Ahora')) : null,
      items.map((item) => {
        const height = max > 0 ? Math.max(8, Math.round((item.priceKwh / max) * 100)) : 8;
        const meta = periodMeta(item.period);
        const hourText = String(item.hour).padStart(2, '0');
        return h('div', { class: 'bar-item ' + (item.hour === currentHour ? 'is-current' : '') },
          h('div', { class: 'bar-value' }, compactCents(item.priceKwh)),
          h('div', {
            class: 'bar ' + meta.className,
            style: { height: height + '%' },
            title: hourLabel(item.hour) + ' · ' + compactCents(item.priceKwh) + ' · ' + item.period
          }),
          h('small', {}, hourText)
        );
      })
    )
  );
}

export function MiniDailyChart(dayStats = []) {
  const valid = dayStats.filter((day) => Number.isFinite(day.stats?.average));
  if (!valid.length) return h('div', { class: 'empty-state' }, 'No hay datos suficientes para la gráfica.');
  const max = Math.max(...valid.map((day) => day.stats.average));
  return h('div', { class: 'mini-chart' },
    valid.map((day) => h('div', { class: 'mini-bar-item' },
      h('div', {
        class: 'mini-bar period-p2',
        style: { height: Math.max(10, (day.stats.average / max) * 100) + '%' },
        title: day.date + ': ' + compactCents(day.stats.average)
      }),
      h('small', {}, day.date.slice(8, 10))
    ))
  );
}
