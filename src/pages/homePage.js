import { Api } from '../services/api.js';
import { h, clear, loading, errorBox } from '../utils/dom.js';
import { todayIso, longDateLabel, currentHour } from '../utils/dates.js';
import { centsKwh, euroKwh, hourLabel } from '../utils/format.js';
import { analyzeDay, bestConsecutiveBlock, cheapestHours, periodMeta } from '../utils/electricity.js';
import { PriceChart } from '../components/priceChart.js';
import { PriceTable } from '../components/priceTable.js';
import { KpiGrid } from '../components/kpiGrid.js';

function CheapAlert(items) {
  const cheap = cheapestHours(items, 4);
  const block = bestConsecutiveBlock(items, 3);
  if (!cheap.length) return null;

  return h('section', { class: 'alert-card' },
    h('div', { class: 'alert-icon', 'aria-hidden': 'true' }, '💡'),
    h('div', {},
      h('h2', {}, 'Horas más baratas para hoy'),
      h('p', {}, 'Aprovecha estas franjas para lavadora, lavavajillas, termo o carga del coche.'),
      h('div', { class: 'cheap-list' }, cheap.map((item) => {
        const meta = periodMeta(item.period);
        return h('span', { class: `cheap-pill ${meta.className}` }, `${hourLabel(item.hour)} · ${centsKwh(item.priceKwh)}`);
      })),
      block ? h('p', { class: 'block-tip' }, `Mejor bloque de 3 horas: ${hourLabel(block.start.hour).split('-')[0]} a ${hourLabel(block.end.hour).split('-')[1]} · media ${centsKwh(block.average)}.`) : null
    )
  );
}

function CurrentPrice(items) {
  const hour = currentHour();
  return items.find((item) => item.hour === hour) || null;
}

export function HomePage() {
  const today = todayIso();
  const container = h('div', { class: 'dashboard home-page' }, loading('Cargando precio de la luz de hoy...'));

  async function load() {
    clear(container);
    container.append(loading('Consultando la API...'));
    try {
      const items = await Api.day(today);
      const stats = analyzeDay(items);
      const current = CurrentPrice(items);
      clear(container);

      if (!stats) {
        container.append(errorBox('La API no ha devuelto datos horarios para hoy.'));
        return;
      }

      const currentMeta = current ? periodMeta(current.period) : null;
      container.append(
        h('section', { class: 'hero-card' },
          h('div', {},
            h('span', { class: 'eyebrow' }, 'Precio de la luz hoy'),
            h('h1', {}, longDateLabel(today)),
            h('p', {}, 'Consulta las 24 horas del día, detecta las horas baratas y compara los tramos P3, P2 y P1.')
          ),
          h('div', { class: `hero-price ${currentMeta?.className || ''}` },
            h('span', {}, current ? `Ahora · ${hourLabel(current.hour)}` : 'Ahora'),
            h('strong', {}, current ? centsKwh(current.priceKwh) : '—'),
            h('small', {}, current ? `${current.period} · ${currentMeta.name}` : 'Sin dato actual')
          )
        ),
        KpiGrid([
          { label: 'Media del día', value: centsKwh(stats.average), detail: euroKwh(stats.average) },
          { label: 'Hora más barata', value: hourLabel(stats.min.hour), detail: centsKwh(stats.min.priceKwh), className: 'period-p3' },
          { label: 'Hora más cara', value: hourLabel(stats.max.hour), detail: centsKwh(stats.max.priceKwh), className: 'period-p1' }
        ]),
        CheapAlert(items),
        PriceChart(items, { currentHour: currentHour(), title: 'Precio horario de hoy', subtitle: 'P3 verde · P2 amarillo · P1 rojo' }),
        PriceTable(items, { currentHour: currentHour(), title: 'Todas las horas de hoy' })
      );
    } catch (error) {
      clear(container);
      container.append(errorBox(error.message));
    }
  }

  load();
  return container;
}
