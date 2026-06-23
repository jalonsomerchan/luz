import { Api } from '../services/api.js';
import { h, clear, loading, errorBox } from '../utils/dom.js';
import { dateLabel, lastNDates } from '../utils/dates.js';
import { centsKwh, hourLabel, percent } from '../utils/format.js';
import { analyzeRange } from '../utils/electricity.js';
import { KpiGrid } from '../components/kpiGrid.js';
import { MiniDailyChart } from '../components/priceChart.js';
import { DaySummaryTable } from '../components/priceTable.js';

function PeriodStats(range) {
  const periods = ['P3', 'P2', 'P1'];
  return h('section', { class: 'glass-section' },
    h('div', { class: 'section-head' },
      h('div', {}, h('h2', { class: 'section-title' }, 'Datos por tramo'), h('p', { class: 'section-subtitle' }, 'Media y peso de cada tramo en las horas cargadas'))
    ),
    h('div', { class: 'period-stats' }, periods.map((period) => {
      const data = range.byPeriod[period];
      const weight = data.count && range.hours ? (data.count / range.hours) * 100 : 0;
      return h('article', { class: `period-stat period-${period.toLowerCase()}` },
        h('strong', {}, period),
        h('span', {}, centsKwh(data.average)),
        h('small', {}, `${data.count} h · ${percent(weight)}`)
      );
    }))
  );
}

function TopCheapHours(range) {
  return h('section', { class: 'glass-section' },
    h('div', { class: 'section-head' },
      h('div', {}, h('h2', { class: 'section-title' }, 'Top horas más baratas'), h('p', { class: 'section-subtitle' }, 'Las mejores horas de los últimos datos cargados'))
    ),
    h('div', { class: 'top-hours' }, range.cheapestHours.map((item, index) => h('a', { class: `top-hour period-${item.period.toLowerCase()}`, href: `#/buscar?fecha=${item.date}` },
      h('span', {}, `#${index + 1}`),
      h('strong', {}, `${dateLabel(item.date)} · ${hourLabel(item.hour)}`),
      h('small', {}, centsKwh(item.priceKwh))
    )))
  );
}

export function StatsPage() {
  const container = h('div', { class: 'dashboard' }, loading('Cargando estadísticas...'));

  async function load() {
    clear(container);
    container.append(
      h('section', { class: 'hero-card compact-hero' },
        h('div', {},
          h('span', { class: 'eyebrow' }, 'Más datos'),
          h('h1', {}, 'Estadísticas generales'),
          h('p', {}, 'Resumen de los últimos 30 días disponibles en la API.')
        ),
        h('button', { class: 'chip-button', type: 'button', onClick: () => { Api.clearCache(); load(); } }, 'Actualizar caché')
      ),
      loading('Calculando últimos 30 días...')
    );
    try {
      const days = await Api.days(lastNDates(30));
      const range = analyzeRange(days);
      clear(container);
      container.append(
        h('section', { class: 'hero-card compact-hero' },
          h('div', {},
            h('span', { class: 'eyebrow' }, 'Más datos'),
            h('h1', {}, 'Estadísticas generales'),
            h('p', {}, 'Resumen de los últimos 30 días disponibles en la API.')
          ),
          h('button', { class: 'chip-button', type: 'button', onClick: () => { Api.clearCache(); load(); } }, 'Actualizar caché')
        )
      );

      if (!range) {
        container.append(errorBox('No hay datos suficientes para calcular estadísticas.'));
        return;
      }

      container.append(
        KpiGrid([
          { label: 'Media 30 días', value: centsKwh(range.average), detail: `${range.days} días cargados` },
          { label: 'Precio mínimo', value: centsKwh(range.min.priceKwh), detail: `${dateLabel(range.min.date)} · ${hourLabel(range.min.hour)}`, className: 'period-p3' },
          { label: 'Precio máximo', value: centsKwh(range.max.priceKwh), detail: `${dateLabel(range.max.date)} · ${hourLabel(range.max.hour)}`, className: 'period-p1' },
          { label: 'Diferencia', value: centsKwh(range.spread), detail: 'entre mínimo y máximo' }
        ]),
        PeriodStats(range),
        h('section', { class: 'glass-section' },
          h('div', { class: 'section-head' },
            h('div', {}, h('h2', { class: 'section-title' }, 'Evolución reciente'), h('p', { class: 'section-subtitle' }, 'Media diaria de los días disponibles'))
          ),
          MiniDailyChart(range.dayStats)
        ),
        TopCheapHours(range),
        DaySummaryTable(range.dayStats)
      );
    } catch (error) {
      clear(container);
      container.append(errorBox(error.message));
    }
  }

  load();
  return container;
}
