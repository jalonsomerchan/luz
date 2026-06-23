import { Api } from '../services/api.js';
import { h, clear, loading, errorBox } from '../utils/dom.js';
import { currentYearMonth, dateLabel, monthDates } from '../utils/dates.js';
import { centsKwh, hourLabel } from '../utils/format.js';
import { analyzeRange } from '../utils/electricity.js';
import { KpiGrid } from '../components/kpiGrid.js';
import { MiniDailyChart } from '../components/priceChart.js';
import { DaySummaryTable } from '../components/priceTable.js';

export function MonthPage() {
  let yearMonth = currentYearMonth();
  const container = h('div', { class: 'dashboard' });

  async function load() {
    clear(container);
    const monthInput = h('input', { class: 'date-input', type: 'month', value: yearMonth });
    monthInput.addEventListener('change', () => {
      yearMonth = monthInput.value || currentYearMonth();
      load();
    });
    const dates = monthDates(yearMonth);
    container.append(
      h('section', { class: 'hero-card compact-hero' },
        h('div', {},
          h('span', { class: 'eyebrow' }, 'Resumen mensual'),
          h('h1', {}, new Date(`${yearMonth}-01T00:00:00`).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })),
          h('p', {}, 'Visualiza medias diarias, horas extremas y días más convenientes del mes.')
        ),
        monthInput
      ),
      loading('Cargando mes...')
    );

    try {
      const days = await Api.days(dates);
      const range = analyzeRange(days);
      clear(container);
      container.append(
        h('section', { class: 'hero-card compact-hero' },
          h('div', {},
            h('span', { class: 'eyebrow' }, 'Resumen mensual'),
            h('h1', {}, new Date(`${yearMonth}-01T00:00:00`).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })),
            h('p', {}, 'El resumen se calcula cargando los días disponibles de la API.')
          ),
          monthInput
        )
      );

      if (!range) {
        container.append(errorBox('No hay datos suficientes para este mes.'));
        return;
      }

      container.append(
        KpiGrid([
          { label: 'Media mensual', value: centsKwh(range.average), detail: `${range.days} días · ${range.hours} horas` },
          { label: 'Día más barato', value: dateLabel(range.cheapestDay.date), detail: centsKwh(range.cheapestDay.stats.average), className: 'period-p3' },
          { label: 'Día más caro', value: dateLabel(range.expensiveDay.date), detail: centsKwh(range.expensiveDay.stats.average), className: 'period-p1' },
          { label: 'Hora mínima', value: `${dateLabel(range.min.date)} · ${hourLabel(range.min.hour)}`, detail: centsKwh(range.min.priceKwh), className: 'period-p3' }
        ]),
        h('section', { class: 'glass-section' },
          h('div', { class: 'section-head' },
            h('div', {}, h('h2', { class: 'section-title' }, 'Evolución del mes'), h('p', { class: 'section-subtitle' }, 'Media diaria de los días cargados'))
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
