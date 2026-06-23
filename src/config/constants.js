export const APP_NAME = 'Luz al día';
export const DEFAULT_API_BASE = 'https://alon.one/api/luz';
export const CACHE_TTL_MS = 30 * 60 * 1000;
export const DEFAULT_HISTORICAL_START = '2000-01-01';

export const PERIODS = {
  P3: {
    label: 'P3',
    name: 'Valle',
    className: 'period-p3',
    description: 'Tramo más barato'
  },
  P2: {
    label: 'P2',
    name: 'Llano',
    className: 'period-p2',
    description: 'Tramo intermedio'
  },
  P1: {
    label: 'P1',
    name: 'Punta',
    className: 'period-p1',
    description: 'Tramo más caro'
  }
};
