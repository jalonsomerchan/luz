import { Api } from '../services/api.js';
import { h, clear, loading, errorBox } from '../utils/dom.js';
import { todayIso, addDays, startOfWeek, dateLabel } from '../utils/dates.js';
import { centsKwh, hourLabel } from '../utils/format.js';
import { analyzeDay, analyzeRange, groupItemsByDate } from '../utils/electricity.js';
import { KpiGrid } from '../components/kpiGrid.js';

function addYears(isoDate, years) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setFullYear(d.getFullYear() + years);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfMonth(date) { return `${date.slice(0, 7)}-01`; }
function sign(value) { return Number.isFinite(value) ? `${value > 0 ? '+' : ''}${centsKwh(value)}` : '—'; }
function rangeDates(from, to) { const out = []; for (let d = from; d <= to; d = addDays(d, 1)) out.push(d); return out; }
async function rangeStats(from, to) { const rows = await Api.range(from, to); return analyzeRange(groupItemsByDate(rows, rangeDates(from, to))); }

function CompareBlock(title, current, previous) {
  const delta = current?.average - previous?.average;
  return h('section', { class: 'glass-section' },
    h('div', { class: 'section-head' }, h('div', {}, h('h2', { class: 'section-title' }, title), h('p', { class: 'section-subtitle' }, 'Comparación directa contra el mismo periodo de hace un año'))),
    KpiGrid([
      { label: 'Ahora', value: centsKwh(current?.average), detail: `${current?.count || current?.hours || 0} horas` },
      { label: 'Hace un año', value: centsKwh(previous?.average), detail: `${previous?.count || previous?.hours || 0} horas` },
      { label: 'Diferencia', value: sign(delta), detail: delta < 0 ? 'más barato ahora' : 'más caro ahora', className: delta < 0 ? 'period-p3' : 'period-p1' },
      { label: 'Rango actual', value: centsKwh(current?.spread), detail: 'máximo - mínimo' }
    ])
  );
}

function HourTable(todayRows, yearRows) {
  const oldByHour = new Map(yearRows.map((item) => [item.hour, item]));
  return h('section', { class: 'table-card' },
    h('div', { class: 'section-head' }, h('div', {}, h('h2', { class: 'section-title' }, 'Hora a hora'), h('p', { class: 'section-subtitle' }, 'Hoy frente al mismo día del año pasado'))),
    h('div', { class: 'responsive-table' }, h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, 'Hora'), h('th', {}, 'Hoy'), h('th', {}, 'Hace un año'), h('th', {}, 'Diferencia'))),
      h('tbody', {}, todayRows.map((item) => {
        const old = oldByHour.get(item.hour);
        const delta = item.priceKwh - old?.priceKwh;
        return h('tr', {}, h('td', {}, hourLabel(item.hour)), h('td', {}, centsKwh(item.priceKwh)), h('td', {}, old ? centsKwh(old.priceKwh) : '—'), h('td', {}, sign(delta)));
      }))
    ))
  );
}

export function ComparePage() {
  const container = h('div', { class: 'dashboard' }, loading('Cargando comparativas...'));
  async function load() {
    const today = todayIso();
    const lastYearDay = addYears(today, -1);
    const weekStart = startOfWeek(today);
    const monthStart = startOfMonth(today);
    try {
      const [todayRows, oldRows, week, oldWeek, month, oldMonth] = await Promise.all([
        Api.day(today, { force: true }),
        Api.day(lastYearDay, { force: true }).catch(() => []),
        rangeStats(weekStart, today).catch(() => null),
        rangeStats(addYears(weekStart, -1), addYears(today, -1)).catch(() => null),
        rangeStats(monthStart, today).catch(() => null),
        rangeStats(addYears(monthStart, -1), addYears(today, -1)).catch(() => null)
      ]);
      clear(container);
      const todayStats = analyzeDay(todayRows);
      const oldStats = analyzeDay(oldRows);
      container.append(
        h('section', { class: 'hero-card compact-hero' }, h('div', {}, h('span', { class: 'eyebrow' }, 'Comparativas'), h('h1', {}, 'Ahora contra hace un año'), h('p', {}, `${dateLabel(today, { year: 'numeric' })} frente a ${dateLabel(lastYearDay, { year: 'numeric' })}`))),
        CompareBlock('Día', todayStats, oldStats),
        HourTable(todayRows, oldRows),
        CompareBlock('Semana actual', week, oldWeek),
        CompareBlock('Mes actual', month, oldMonth)
      );
    } catch (error) {
      clear(container);
      container.append(errorBox(error.message));
    }
  }
  load();
  return container;
}
