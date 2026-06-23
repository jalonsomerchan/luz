import { Api } from '../services/api.js';
import { h, clear, loading, errorBox } from '../utils/dom.js';
import { todayIso, longDateLabel, currentHour } from '../utils/dates.js';
import { centsKwh, hourLabel } from '../utils/format.js';
import { analyzeDay, bestConsecutiveBlock, cheapestHours } from '../utils/electricity.js';
import { DaySelector } from '../components/daySelector.js';
import { KpiGrid } from '../components/kpiGrid.js';
import { PriceChart } from '../components/priceChart.js';
import { PriceTable } from '../components/priceTable.js';

function DayAdvice(items) {
  const cheap = cheapestHours(items, 6);
  const block = bestConsecutiveBlock(items, 3);
  return h('section', { class: 'alert-card' },
    h('div', { class: 'alert-icon', 'aria-hidden': 'true' }, '✓'),
    h('div', {},
      h('h2', {}, 'Recomendación del día'),
      block ? h('p', {}, 'El mejor bloque de 3 horas va de ' + hourLabel(block.start.hour).split('-')[0] + ' a ' + hourLabel(block.end.hour).split('-')[1] + ' con una media de ' + centsKwh(block.average) + '.') : h('p', {}, 'No hay suficientes horas consecutivas para calcular un bloque.'),
      h('div', { class: 'cheap-list' }, cheap.map((item) => h('span', { class: 'cheap-pill period-' + item.period.toLowerCase() }, hourLabel(item.hour) + ' · ' + centsKwh(item.priceKwh))))
    )
  );
}

export function SearchPage({ query } = {}) {
  let selectedDate = query?.get('fecha') || todayIso();
  const results = h('div', { class: 'stack' }, loading('Elige un día para consultar...'));

  async function load(date) {
    selectedDate = date;
    clear(results);
    results.append(loading('Cargando precios del día...'));
    try {
      const items = await Api.day(date, { force: true });
      const stats = analyzeDay(items);
      clear(results);
      if (!stats) {
        results.append(errorBox('No hay datos para el día seleccionado.'));
        return;
      }
      results.append(
        KpiGrid([
          { label: 'Media', value: centsKwh(stats.average), detail: 'redondeado a dos decimales' },
          { label: 'Más barata', value: hourLabel(stats.min.hour), detail: centsKwh(stats.min.priceKwh), className: 'period-p3' },
          { label: 'Más cara', value: hourLabel(stats.max.hour), detail: centsKwh(stats.max.priceKwh), className: 'period-p1' },
          { label: 'Diferencia', value: centsKwh(stats.spread), detail: 'máximo - mínimo' }
        ]),
        DayAdvice(items),
        PriceChart(items, { currentHour: date === todayIso() ? currentHour() : null, title: 'Precio del ' + longDateLabel(date), subtitle: 'P3 verde · P2 amarillo · P1 rojo' }),
        PriceTable(items, { currentHour: date === todayIso() ? currentHour() : null, title: 'Detalle horario' })
      );
    } catch (error) {
      clear(results);
      results.append(errorBox(error.message));
    }
  }

  const page = h('div', { class: 'dashboard' },
    h('section', { class: 'hero-card compact-hero' },
      h('div', {},
        h('span', { class: 'eyebrow' }, 'Buscador de días'),
        h('h1', {}, 'Consulta cualquier día'),
        h('p', {}, 'Busca una fecha concreta para ver tabla, gráfica, tramos y horas recomendadas.')
      )
    ),
    DaySelector(selectedDate, (date) => {
      location.hash = '#/buscar?fecha=' + date;
      load(date);
    }),
    results
  );

  load(selectedDate);
  return page;
}
