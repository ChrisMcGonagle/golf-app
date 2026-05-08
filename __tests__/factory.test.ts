import { createAdapterByName, resolveAdapterNameForRequestType } from '@/lib/integrations/factory';
import { MockAdapter } from '@/lib/integrations/mock';

describe('integration factory adapter resolution', () => {
  const originalRequestTypeAdapterMap = process.env.INTEGRATION_REQUEST_TYPE_ADAPTER_MAP;

  afterEach(() => {
    if (originalRequestTypeAdapterMap === undefined) {
      delete process.env.INTEGRATION_REQUEST_TYPE_ADAPTER_MAP;
      return;
    }

    process.env.INTEGRATION_REQUEST_TYPE_ADAPTER_MAP = originalRequestTypeAdapterMap;
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