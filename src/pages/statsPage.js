import { Api } from '../services/api.js';
import { h, clear, loading, errorBox } from '../utils/dom.js';
import { dateLabel, lastNDates } from '../utils/dates.js';
import { centsKwh, hourLabel, percent } from '../utils/format.js';
import { analyzeRange, groupItemsByDate } from '../utils/electricity.js';
import { KpiGrid } from '../components/kpiGrid.js';
import { MiniDailyChart } from '../components/priceChart.js';
import { DaySummaryTable } from '../components/priceTable.js';

function findPeriodRow(periodRows, period) {
  return (periodRows || []).find((row) => String(row.tramo || '').toUpperCase() === period) || null;
}

function PeriodStats(range, periodRows = [], apiStats = null) {
  const periods = ['P3', 'P2', 'P1'];
  const total = apiStats?.total_registros || range.hours;
  return h('section', { class: 'glass-section' },
    h('div', { class: 'section-head' },
      h('div', {}, h('h2', { class: 'section-title' }, 'Datos por tramo'), h('p', { class: 'section-subtitle' }, 'Media, mínimo, máximo y peso de cada tramo usando `/tramos` cuando está disponible'))
    ),
    h('div', { class: 'period-stats' }, periods.map((period) => {
      const apiRow = findPeriodRow(periodRows, period);
      const local = range.byPeriod[period];
      const count = apiRow?.total_registros || local.count || 0;
      const average = Number.isFinite(apiRow?.media_valor_kwh) ? apiRow.media_valor_kwh : local.average;
      const min = Number.isFinite(apiRow?.min_valor_kwh) ? apiRow.min_valor_kwh : null;
      const max = Number.isFinite(apiRow?.max_valor_kwh) ? apiRow.max_valor_kwh : null;
      const weight = count && total ? (count / total) * 100 : 0;
      const detail = min !== null && max !== null
        ? `${count} h · ${percent(weight)} · ${centsKwh(min)} / ${centsKwh(max)}`
        : `${count} h · ${percent(weight)}`;
      return h('article', { class: `period-stat period-${period.toLowerCase()}` },
        h('strong', {}, period),
        h('span', {}, centsKwh(average)),
        h('small', {}, detail)
      );
    }))
  );
}

function TopCheapHours(range) {
  return h('section', { class: 'glass-section' },
    h('div', { class: 'section-head' },
      h('div', {}, h('h2', { class: 'section-title' }, 'Top horas más baratas'), h('p', { class: 'section-subtitle' }, 'Las mejores horas del rango consultado con `/rango`'))
    ),
    h('div', { class: 'top-hours' }, range.cheapestHours.map((item, index) => h('a', { class: `top-hour period-${item.period.toLowerCase()}`, href: `#/buscar?fecha=${item.date}` },
      h('span', {}, `#${index + 1}`),
      h('strong', {}, `${dateLabel(item.date)} · ${hourLabel(item.hour)}`),
      h('small', {}, centsKwh(item.priceKwh))
    )))
  );
}

function AverageByHour(history = []) {
  const rows = [...history]
    .filter((row) => Number.isFinite(row.media_valor_kwh) && row.hora !== undefined)
    .sort((a, b) => Number(a.hora) - Number(b.hora));
  if (!rows.length) return null;
  return h('section', { class: 'glass-section' },
    h('div', { class: 'section-head' },
      h('div', {}, h('h2', { class: 'section-title' }, 'Media por hora'), h('p', { class: 'section-subtitle' }, 'Agrupación devuelta por `/historico?group=hora`'))
    ),
    h('div', { class: 'hour-average-grid' }, rows.map((row) => h('article', { class: 'hour-average-card' },
      h('strong', {}, hourLabel(Number(row.hora))),
      h('span', {}, centsKwh(row.media_valor_kwh)),
      h('small', {}, `${row.total_registros || 0} registros`)
    )))
  );
}

export function StatsPage() {
  const container = h('div', { class: 'dashboard' }, loading('Cargando estadísticas...'));

  async function load() {
    const dates = lastNDates(30);
    const fechaDesde = dates[0];
    const fechaHasta = dates[dates.length - 1];

    clear(container);
    container.append(
      h('section', { class: 'hero-card compact-hero' },
        h('div', {},
          h('span', { class: 'eyebrow' }, 'Más datos'),
          h('h1', {}, 'Estadísticas generales'),
          h('p', {}, `Resumen desde ${dateLabel(fechaDesde)} hasta ${dateLabel(fechaHasta)} usando los endpoints reales de la API.`)
        ),
        h('button', { class: 'chip-button', type: 'button', onClick: () => { Api.clearCache(); load(); } }, 'Actualizar caché')
      ),
      loading('Consultando /rango, /estadisticas, /tramos e /historico...')
    );
    try {
      const [items, apiStats, periodRows, hourlyHistory] = await Promise.all([
        Api.range(fechaDesde, fechaHasta),
        Api.statistics(fechaDesde, fechaHasta).catch(() => null),
        Api.periods(fechaDesde, fechaHasta).catch(() => []),
        Api.historical('hora', fechaDesde, fechaHasta).catch(() => ({ data: [] }))
      ]);
      const days = groupItemsByDate(items, dates);
      const range = analyzeRange(days);
      clear(container);
      container.append(
        h('section', { class: 'hero-card compact-hero' },
          h('div', {},
            h('span', { class: 'eyebrow' }, 'Más datos'),
            h('h1', {}, 'Estadísticas generales'),
            h('p', {}, `Resumen desde ${dateLabel(fechaDesde)} hasta ${dateLabel(fechaHasta)}.`)
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
          { label: 'Media 30 días', value: centsKwh(apiStats?.media_valor_kwh ?? range.average), detail: `${apiStats?.total_dias || range.days} días · ${apiStats?.total_registros || range.hours} horas` },
          { label: 'Precio mínimo', value: centsKwh(apiStats?.min_valor_kwh ?? range.min.priceKwh), detail: `${dateLabel(range.min.date)} · ${hourLabel(range.min.hour)}`, className: 'period-p3' },
          { label: 'Precio máximo', value: centsKwh(apiStats?.max_valor_kwh ?? range.max.priceKwh), detail: `${dateLabel(range.max.date)} · ${hourLabel(range.max.hour)}`, className: 'period-p1' },
          { label: 'Diferencia', value: centsKwh(range.spread), detail: 'entre mínimo y máximo' }
        ]),
        PeriodStats(range, periodRows, apiStats),
        h('section', { class: 'glass-section' },
          h('div', { class: 'section-head' },
            h('div', {}, h('h2', { class: 'section-title' }, 'Evolución reciente'), h('p', { class: 'section-subtitle' }, 'Media diaria a partir de `/rango`'))
          ),
          MiniDailyChart(range.dayStats)
        ),
        AverageByHour(hourlyHistory.data),
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
