import { getIntegrationAdapterConfig } from '@/lib/integrations/config'
import { createAdapterByName } from '@/lib/integrations/factory'
import { IntegrationRequestContext } from '@/lib/integrations/types'

const originalEnv = process.env

function createContext(): IntegrationRequestContext {
  return {
    requestId: 'request-123',
    adapterName: 'mock',
    idempotencyKey: 'idem-123',
    attemptNumber: 1,
    logger: jest.fn(),
    handleError: (error) => {
      if (error instanceof Error) {
        return error.message
      }

      return 'Unknown integration error'
    },
  }
}

describe('integration adapter config', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    delete process.env.INTEGRATION_MOCK_ENABLED
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('throws when a required adapter environment variable is missing', () => {
    expect(() => getIntegrationAdapterConfig('mock')).toThrow(
      'Missing integration environment variable: INTEGRATION_MOCK_ENABLED',
    )
  })

  it('throws when an adapter enabled flag is not a boolean string', () => {
    process.env.INTEGRATION_MOCK_ENABLED = 'yes'

    expect(() => getIntegrationAdapterConfig('mock')).toThrow(
      'Invalid boolean environment variable: INTEGRATION_MOCK_ENABLED',
    )
  })
})

describe('createAdapterByName', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      INTEGRATION_MOCK_ENABLED: 'true',
    }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns the registered mock adapter', async () => {
    const adapter = createAdapterByName('mock')
    const context = createContext()

    expect(adapter.name).toBe('mock')
    expect(
      adapter.validate({
        requestId: 'request-123',
        requestType: 'membership_request',
        payload: { firstName: 'Pat' },
        metadata: { source: 'test' },
      }),
    ).toBe(true)

    await expect(
      adapter.execute(
        {
          requestId: 'request-123',
          requestType: 'membership_request',
          payload: { firstName: 'Pat' },
          metadata: { source: 'test' },
        },
        context,
      ),
    ).resolves.toEqual({
      success: true,
      externalId: 'mock-request-123',
      metadata: {
        outcome: 'mock-success',
        attemptNumber: 1,
      },
    })
  })

  it('uses the request context error handler for execution failures', async () => {
    const adapter = createAdapterByName('mock')

    await expect(
      adapter.execute(
        {
          requestId: 'request-456',
          requestType: 'membership_request',
          payload: { shouldFail: true },
          metadata: { source: 'test' },
        },
        createContext(),
      ),
    ).resolves.toEqual({
      success: false,
      error: 'Mock adapter failure',
      metadata: {
        outcome: 'mock-failure',
      },
    })
  })

  it('throws for an unknown adapter name', () => {
    expect(() => createAdapterByName('unknown')).toThrow('Unknown integration adapter: unknown')
  })

  it('throws when a registered adapter is disabled', () => {
    process.env.INTEGRATION_MOCK_ENABLED = 'false'

    expect(() => createAdapterByName('mock')).toThrow('Integration adapter is disabled: mock')
  })
})