import { createMockAdapter } from '@/lib/integrations/adapters/mockAdapter'
import { IntegrationAdapter } from '@/lib/integrations/types'

const adapterFactories: Record<string, () => IntegrationAdapter> = {
  mock: createMockAdapter,
}

export function createAdapterByName(name: string): IntegrationAdapter {
  const normalizedName = name.trim().toLowerCase()
  const createAdapter = adapterFactories[normalizedName]

  if (!createAdapter) {
    throw new Error(`Unknown integration adapter: ${name}`)
  }

  return createAdapter()
}