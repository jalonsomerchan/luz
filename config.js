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

  // Unidad del campo `valor`: auto, eur_mwh, eur_kwh o cent_kwh.
  // En auto, valores mayores de 5 se tratan como €/MWh y se convierten a €/kWh.
  valorUnit: 'auto'
};
