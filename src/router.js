import { HomePage } from './pages/homePage.js';
import { WeekPage } from './pages/weekPage.js';
import { MonthPage } from './pages/monthPage.js';
import { SearchPage } from './pages/searchPage.js';
import { ComparePage } from './pages/comparePage.js';
import { StatsPage } from './pages/statsPage.js';
import { HistoryPage } from './pages/historyPage.js';
import { NotFoundPage } from './pages/notFoundPage.js';

function cleanHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  return raw.split('?')[0].replace(/\/+$/, '') || '/';
}

function queryParams() {
  const raw = location.hash.replace(/^#/, '');
  const query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
  return new URLSearchParams(query);
}

function parseRoute() {
  const path = cleanHash();
  const parts = path.split('/').filter(Boolean);
  if (path === '/') return { page: HomePage, params: {} };
  if (parts[0] === 'semana') return { page: WeekPage, params: {} };
  if (parts[0] === 'mes') return { page: MonthPage, params: {} };
  if (parts[0] === 'buscar') return { page: SearchPage, params: { query: queryParams() } };
  if (parts[0] === 'comparativas') return { page: ComparePage, params: {} };
  if (parts[0] === 'estadisticas') return { page: StatsPage, params: {} };
  if (parts[0] === 'historico') return { page: HistoryPage, params: {} };
  return { page: NotFoundPage, params: {} };
}

export const Router = {
  mount(root, renderShell) {
    this.root = root;
    this.renderShell = renderShell;
    window.addEventListener('hashchange', () => this.render());
    this.render();
  },
  render() {
    const { page, params } = parseRoute();
    this.root.replaceChildren(this.renderShell(page(params)));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
};
