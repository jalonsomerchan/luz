# Luz al día

PWA estática para consultar el precio de la luz usando la API `https://alon.one/api/luz/`.

Está inspirada en la estructura de `gasolineras2`: aplicación sin build, router por hash, componentes JS modulares, estilos separados y preparada para GitHub Pages.

## Funcionalidades

- Portada con el precio de hoy usando `/hoy` y precio actual usando `/actual`.
- Gráfica de barras por horas.
- Tabla horaria completa.
- Aviso con las horas más baratas y el mejor bloque de 3 horas.
- Buscador de días usando `/fecha?fecha=YYYY-MM-DD`.
- Semana, mes y estadísticas usando `/rango`, `/estadisticas`, `/tramos` e `/historico`.
- Tramos visuales: P3 verde, P2 amarillo y P1 rojo.
- Modo claro/oscuro persistente.
- PWA instalable con caché básica.
- API key configurable desde GitHub Actions/Pages.

## Endpoints usados

La app llama directamente a los endpoints definidos por `luz.php`:

| Vista | Endpoint |
| --- | --- |
| Portada | `/hoy`, `/actual` |
| Buscador | `/fecha?fecha=YYYY-MM-DD` |
| Semana y mes | `/rango?fecha_desde=YYYY-MM-DD&fecha_hasta=YYYY-MM-DD&limit=5000` |
| Estadísticas | `/estadisticas`, `/tramos`, `/historico?group=hora` |
| Caché local | `localStorage`, con TTL definido en `src/config/constants.js` |

La respuesta esperada para precios horarios usa los campos:

```json
{
  "fecha_hora": "2026-06-23 14:00:00",
  "fecha": "2026-06-23",
  "hora": 14,
  "valor": 83.12,
  "tramo": "P2"
}
```

El campo `valor` se normaliza a €/kWh. En modo `auto`, valores mayores de `5` se interpretan como €/MWh y se dividen entre `1000`.

## Probar en local

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000`.

Para probar con API key en local, copia el ejemplo:

```bash
cp config.generated.example.js config.generated.js
```

Edita `config.generated.js` y pon tu clave. Ese archivo está en `.gitignore` para no subirlo al repositorio.

## Configuración de la API key en GitHub

La app carga primero `config.js` y después, si existe, `config.generated.js`. El workflow incluido en `.github/workflows/deploy-pages.yml` genera `config.generated.js` automáticamente al desplegar en GitHub Pages.

En GitHub entra en:

`Settings` → `Secrets and variables` → `Actions`

Crea un **Repository secret**:

| Secret | Uso |
| --- | --- |
| `LUZ_API_KEY` | Clave de la API |

Por defecto se envía como pide la API:

```http
Authorization: Bearer TU_API_KEY
```

Variables opcionales:

| Variable | Valor por defecto | Uso |
| --- | --- | --- |
| `LUZ_API_BASE` | `https://alon.one/api/luz` | URL base de la API |
| `LUZ_API_KEY_HEADER` | `Authorization` | Cabecera para la clave. Usa `X-API-Key` para la alternativa del PHP |
| `LUZ_AUTH_SCHEME` | `Bearer` | Prefijo de la cabecera. Para `X-API-Key`, pon `none` |
| `LUZ_API_KEY_PARAM` | vacío | Nombre del parámetro GET, normalmente `api_key` |
| `LUZ_VALOR_UNIT` | `auto` | `auto`, `eur_mwh`, `eur_kwh` o `cent_kwh` |

### Usar la alternativa `X-API-Key`

Configura estas variables:

```text
LUZ_API_KEY_HEADER=X-API-Key
LUZ_AUTH_SCHEME=none
```

### Usar la alternativa `?api_key=...`

Configura estas variables:

```text
LUZ_API_KEY_HEADER=query
LUZ_API_KEY_PARAM=api_key
```

> Importante: en una web estática publicada en GitHub Pages, cualquier API key usada por JavaScript acaba siendo visible en el navegador. Guardarla como `Secret` evita que esté escrita en el repositorio, pero no la oculta al usuario final. Para ocultarla de verdad hace falta un backend/proxy.

## Configuración manual

También puedes editar `config.js`:

```js
window.LUZ_CONFIG = {
  apiBase: 'https://alon.one/api/luz',
  apiKey: '',
  apiKeyHeader: 'Authorization',
  authScheme: 'Bearer',
  apiKeyParam: '',
  valorUnit: 'auto'
};
```

## Estructura

- `src/services/api.js`: cliente API exacto para `/hoy`, `/actual`, `/fecha`, `/rango`, `/estadisticas`, `/tramos` e `/historico`.
- `src/utils/electricity.js`: cálculo de tramos, estadísticas y horas baratas.
- `src/components`: gráfica, tabla, KPIs, leyenda y selector de día.
- `src/pages`: portada, semana, mes, buscador, estadísticas y 404.
- `src/styles`: base, layout y componentes.
- `.github/workflows/deploy-pages.yml`: despliegue en GitHub Pages generando `config.generated.js`.
