import { PERIODS } from '../config/constants.js';
import { h } from '../utils/dom.js';

export function PeriodLegend() {
  return h('div', { class: 'period-legend', 'aria-label': 'Leyenda de tramos' },
    Object.entries(PERIODS).map(([key, period]) => h('span', { class: `period-pill ${period.className}` },
      h('strong', {}, key),
      h('small', {}, period.name)
    ))
  );
}
