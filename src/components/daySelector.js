import { h } from '../utils/dom.js';
import { addDays, todayIso } from '../utils/dates.js';

export function DaySelector(date, onChange) {
  const input = h('input', { class: 'date-input', type: 'date', value: date, max: '2099-12-31' });
  const go = (next) => {
    input.value = next;
    onChange(next);
  };
  input.addEventListener('change', () => go(input.value || todayIso()));

  return h('div', { class: 'day-selector' },
    h('button', { type: 'button', class: 'chip-button', onClick: () => go(addDays(input.value, -1)) }, '← Día anterior'),
    input,
    h('button', { type: 'button', class: 'chip-button', onClick: () => go(todayIso()) }, 'Hoy'),
    h('button', { type: 'button', class: 'chip-button', onClick: () => go(addDays(input.value, 1)) }, 'Día siguiente →')
  );
}
