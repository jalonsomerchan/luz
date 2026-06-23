# Despliegue en GitHub Pages

La app es estática y se despliega con GitHub Actions mediante `.github/workflows/deploy-pages.yml`.

## 1. Activar Pages con GitHub Actions

En el repositorio entra en:

`Settings` → `Pages`

Y configura:

- **Build and deployment**
- **Source**: `GitHub Actions`

Si el source sigue en `Deploy from a branch`, el workflow de `actions/deploy-pages` puede fallar aunque el YAML exista.

## 2. Configurar la API key

Entra en:

`Settings` → `Secrets and variables` → `Actions`

Crea un **Repository secret**:

```text
LUZ_API_KEY=TU_API_KEY
```

Por defecto la app llama a la API así:

```http
Authorization: Bearer TU_API_KEY
```

## 3. Alternativas de autenticación

La API también acepta `X-API-Key` y `?api_key=`.

Para usar `X-API-Key`, crea estas **Repository variables**:

```text
LUZ_API_KEY_HEADER=X-API-Key
LUZ_AUTH_SCHEME=none
```

Para usar query string, crea estas **Repository variables**:

```text
LUZ_API_KEY_HEADER=query
LUZ_API_KEY_PARAM=api_key
```

Esta opción puede ser útil si el servidor no permite la cabecera `Authorization` en CORS.

## 4. Lanzar despliegue

El workflow se ejecuta automáticamente al hacer push a `master` o `main`.

También puedes lanzarlo manualmente desde:

`Actions` → `Deploy GitHub Pages` → `Run workflow`

## Nota de seguridad

En GitHub Pages la API key no queda escrita en el repositorio, pero sí se envía al navegador dentro de `config.generated.js`. Para ocultarla completamente haría falta un backend o proxy.
