import { Api } from '../services/api.js';
import { h, clear, loading, errorBox } from '../utils/dom.js';
import { addDays, dateLabel, startOfWeek, todayIso, weekDates } from '../utils/dates.js';
import { centsKwh, hourLabel } from '../utils/format.js';
import { analyzeRange } from '../utils/electricity.js';
import { KpiGrid } from '../components/kpiGrid.js';
import { MiniDailyChart } from '../components/priceChart.js';
import { DaySummaryTable } from '../components/priceTable.js';

export function WeekPage() {
  let weekStart = startOfWeek(todayIso());
  const container = h('div', { class: 'dashboard' });

  async function load() {
    clear(container);
    const dates = weekDates(weekStart);
    container.append(
      h('section', { class: 'hero-card compact-hero' },
        h('div', {},
          h('span', { class: 'eyebrow' }, 'Estadísticas de semana'),
          h('h1', {}, `${dateLabel(dates[0], { year: 'numeric' })} — ${dateLabel(dates[6], { year: 'numeric' })}`),
          h('p', {}, 'Compara los días de la semana y encuentra el mejor momento para concentrar consumo.')
        ),
        h('div', { class: 'hero-actions' },
          h('button', { class: 'chip-button', type: 'button', onClick: () => { weekStart = addDays(weekStart, -7); load(); } }, '← Semana anterior'),
          h('button', { class: 'chip-button', type: 'button', onClick: () => { weekStart = startOfWeek(todayIso()); load(); } }, 'Actual'),
          h('button', { class: 'chip-button', type: 'button', onClick: () => { weekStart = addDays(weekStart, 7); load(); } }, 'Siguiente →')
        )
      ),
      loading('Cargando semana...')
    );

    try {
      const days = await Api.days(dates);
      const range = analyzeRange(days);
      clear(container);
      container.append(
        h('section', { class: 'hero-card compact-hero' },
          h('div', {},
            h('span', { class: 'eyebrow' }, 'Estadísticas de semana'),
            h('h1', {}, `${dateLabel(dates[0], { year: 'numeric' })} — ${dateLabel(dates[6], { year: 'numeric' })}`),
            h('p', {}, 'Resumen de precios medios, mínimos y máximos de esta semana.')
          ),
          h('div', { class: 'hero-actions' },
            h('button', { class: 'chip-button', type: 'button', onClick: () => { weekStart = addDays(weekStart, -7); load(); } }, '← Semana anterior'),
            h('button', { class: 'chip-button', type: 'button', onClick: () => { weekStart = startOfWeek(todayIso()); load(); } }, 'Actual'),
            h('button', { class: 'chip-button', type: 'button', onClick: () => { weekStart = addDays(weekStart, 7); load(); } }, 'Siguiente →')
          )
        )
      );

      if (!range) {
        container.append(errorBox('No hay datos suficientes para esta semana.'));
        return;
      }

      container.append(
        KpiGrid([
          { label: 'Media semanal', value: centsKwh(range.average), detail: `${range.hours} horas cargadas` },
          { label: 'Día más barato', value: dateLabel(range.cheapestDay.date), detail: centsKwh(range.cheapestDay.stats.average), className: 'period-p3' },
          { label: 'Día más caro', value: dateLabel(range.expensiveDay.date), detail: centsKwh(range.expensiveDay.stats.average), className: 'period-p1' },
          { label: 'Mejor hora', value: `${dateLabel(range.min.date)} · ${hourLabel(range.min.hour)}`, detail: centsKwh(range.min.priceKwh), className: 'period-p3' }
        ]),
        h('section', { class: 'glass-section' },
          h('div', { class: 'section-head' },
            h('div', {}, h('h2', { class: 'section-title' }, 'Media diaria'), h('p', { class: 'section-subtitle' }, 'Una barra por cada día con datos'))
          ),
          MiniDailyChart(range.dayStats)
        ),
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
