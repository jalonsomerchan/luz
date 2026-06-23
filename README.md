# Luz al día

PWA estática para consultar el precio de la luz usando la API `https://alon.one/api/luz/`.

Está inspirada en la estructura de `gasolineras2`: aplicación sin build, router por hash, componentes JS modulares, estilos separados y preparada para GitHub Pages.

## Funcionalidades

- Portada con el precio de hoy.
- Gráfica de barras por horas.
- Tabla horaria completa.
- Aviso con las horas más baratas y el mejor bloque de 3 horas.
- Páginas de semana, mes, buscador de días y estadísticas.
- Tramos visuales: P3 verde, P2 amarillo y P1 rojo.
- Modo claro/oscuro persistente.
- PWA instalable con caché básica.

## Probar en local

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000`.

## Configuración de API

Edita `config.js` si tu API necesita otra ruta:

```js
window.LUZ_CONFIG = {
  apiBase: 'https://alon.one/api/luz',
  dayEndpoints: [
    { path: 'precios', params: { fecha: '{date}' } },
    { path: 'dia', params: { date: '{date}' } }
  ]
};
```

La app intenta varias rutas comunes automáticamente (`/`, `/dia`, `/precios`, `/precio`, `/pvpc`) y normaliza distintas formas de respuesta (`data`, `precios`, `prices`, arrays directos u objetos por hora). Si la API devuelve precios en €/MWh, los convierte a €/kWh para mostrarlos también en c€/kWh.

## Estructura

- `src/services/api.js`: cliente API, caché y normalización.
- `src/utils/electricity.js`: cálculo de tramos, estadísticas y horas baratas.
- `src/components`: gráfica, tabla, KPIs, leyenda y selector de día.
- `src/pages`: portada, semana, mes, buscador, estadísticas y 404.
- `src/styles`: base, layout y componentes.
