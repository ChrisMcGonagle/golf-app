import { createAdapterByName, resolveAdapterNameForRequestType } from '@/lib/integrations/factory';
import { MockAdapter } from '@/lib/integrations/mock';

describe('integration factory adapter resolution', () => {
  const originalRequestTypeAdapterMap = process.env.INTEGRATION_REQUEST_TYPE_ADAPTER_MAP;
  const originalMockEnabled = process.env.INTEGRATION_MOCK_ENABLED;

  beforeEach(() => {
    delete process.env.INTEGRATION_REQUEST_TYPE_ADAPTER_MAP;
    process.env.INTEGRATION_MOCK_ENABLED = 'true';
  });

  afterEach(() => {
    if (originalRequestTypeAdapterMap === undefined) {
      delete process.env.INTEGRATION_REQUEST_TYPE_ADAPTER_MAP;
    } else {
      process.env.INTEGRATION_REQUEST_TYPE_ADAPTER_MAP = originalRequestTypeAdapterMap;
    }

    if (originalMockEnabled === undefined) {
      delete process.env.INTEGRATION_MOCK_ENABLED;
    } else {
      process.env.INTEGRATION_MOCK_ENABLED = originalMockEnabled;
    }
  });

  it('creates a supported adapter by name', () => {
    expect(createAdapterByName('mock')).toBeInstanceOf(MockAdapter);
  });

  it('resolves a real request type through explicit configuration', () => {
    process.env.INTEGRATION_REQUEST_TYPE_ADAPTER_MAP = JSON.stringify({
      'Full Member': 'mock',
    });

    expect(resolveAdapterNameForRequestType('Full Member')).toBe('mock');
  });

  it('throws when a request type has no configured adapter', () => {
    delete process.env.INTEGRATION_REQUEST_TYPE_ADAPTER_MAP;

    expect(() => resolveAdapterNameForRequestType('Full Member')).toThrow(
      'No adapter configured for request type: Full Member'
    );
  });
});