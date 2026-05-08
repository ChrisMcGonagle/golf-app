export type IntegrationAdapterConfig = {
  enabled: boolean
}

function normalizeAdapterName(name: string) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_')
}

function parseBooleanEnv(value: string, envName: string) {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  throw new Error(`Invalid boolean environment variable: ${envName}`)
}

export function getIntegrationAdapterConfig(name: string): IntegrationAdapterConfig {
  const normalizedName = normalizeAdapterName(name)
  const enabledEnvName = `INTEGRATION_${normalizedName}_ENABLED`
  const enabledValue = process.env[enabledEnvName]

  if (!enabledValue) {
    throw new Error(`Missing integration environment variable: ${enabledEnvName}`)
  }

  return {
    enabled: parseBooleanEnv(enabledValue, enabledEnvName),
  }
}