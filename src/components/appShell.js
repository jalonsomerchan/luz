import { APP_NAME } from '../config/constants.js';
import { h } from '../utils/dom.js';
import { BottomNav } from './bottomNav.js';
import { ThemeToggle } from './themeToggle.js';
import { PeriodLegend } from './periodLegend.js';

export function AppShell(content) {
  return h('div', { class: 'app-shell' },
    h('a', { class: 'skip-link', href: '#main' }, 'Saltar al contenido'),
    h('header', { class: 'app-header' },
      h('div', { class: 'header-inner' },
        h('a', { class: 'brand', href: '#/' },
          h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, '⚡'),
          h('span', {}, APP_NAME)
        ),
        h('div', { class: 'header-actions' },
          h('a', { class: 'header-pill', href: '#/comparativas' }, 'Comparativas'),
          h('a', { class: 'header-pill', href: '#/historico' }, 'Histórico'),
          h('a', { class: 'header-pill', href: '#/buscar' }, 'Buscar día'),
          ThemeToggle()
        )
      ),
      h('div', { class: 'legend-row' }, PeriodLegend())
    ),
    h('main', { id: 'main', class: 'main' }, content),
    BottomNav()
  );
}
