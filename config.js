window.LUZ_CONFIG = {
  apiBase: 'https://alon.one/api/luz',
  API_BASE_URL: 'https://alon.one/api/luz',

  // API key local opcional. En producción se genera desde GitHub Actions
  // en config.generated.js usando Secrets o Variables del repositorio.
  apiKey: '',

  // La API luz.php acepta por defecto:
  //   Authorization: Bearer TU_API_KEY
  // Alternativas soportadas por el backend:
  //   X-API-Key: TU_API_KEY
  //   ?api_key=TU_API_KEY
  apiKeyHeader: 'Authorization',
  authScheme: 'Bearer',
  apiKeyParam: '',

  // La API luz.php entrega `valor` en €/MWh. La app lo convierte a €/kWh.
  valorUnit: 'eur_mwh',

  // Fecha mínima para paneles de histórico completo.
  historicalStartDate: '2000-01-01'
};
