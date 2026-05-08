/**
 * Adapter factory - instantiates adapters by name
 */

import { IntegrationAdapter } from './types';
import { MockAdapter } from './mock';
import { getIntegrationAdapterConfig } from './config';

const SUPPORTED_ADAPTER_NAMES = ['mock'] as const;

type SupportedAdapterName = (typeof SUPPORTED_ADAPTER_NAMES)[number];

function normalizeAdapterName(name: string): string {
  return name.trim().toLowerCase();
}

function isSupportedAdapterName(name: string): name is SupportedAdapterName {
  return (SUPPORTED_ADAPTER_NAMES as readonly string[]).includes(normalizeAdapterName(name));
}

function getConfiguredAdapterNameByRequestType(): Record<string, string> {
  const rawConfig = process.env.INTEGRATION_REQUEST_TYPE_ADAPTER_MAP;

  if (!rawConfig) {
    return {};
  }

  let parsedConfig: unknown;

  try {
    parsedConfig = JSON.parse(rawConfig);
  } catch {
    throw new Error('INTEGRATION_REQUEST_TYPE_ADAPTER_MAP must be valid JSON');
  }

  if (!parsedConfig || typeof parsedConfig !== 'object' || Array.isArray(parsedConfig)) {
    throw new Error('INTEGRATION_REQUEST_TYPE_ADAPTER_MAP must be a JSON object');
  }

  return Object.entries(parsedConfig).reduce<Record<string, string>>((config, [requestType, adapterName]) => {
    if (typeof adapterName !== 'string' || adapterName.trim().length === 0) {
      throw new Error(
        `INTEGRATION_REQUEST_TYPE_ADAPTER_MAP entry for "${requestType}" must be a non-empty string`
      );
    }

    config[requestType] = normalizeAdapterName(adapterName);
    return config;
  }, {});
}

export function resolveAdapterNameForRequestType(requestType: string): string {
  if (isSupportedAdapterName(requestType)) {
    return normalizeAdapterName(requestType);
  }

  const adapterName = getConfiguredAdapterNameByRequestType()[requestType];

  if (!adapterName) {
    throw new Error(`No adapter configured for request type: ${requestType}`);
  }

  if (!isSupportedAdapterName(adapterName)) {
    throw new Error(`Configured adapter "${adapterName}" for request type "${requestType}" is not supported`);
  }

  return adapterName;
}

/**
 * Factory function to create adapter instances by name
 * @param name - Adapter identifier (e.g., "mock", "golf_ireland")
 * @returns Instantiated adapter
 * @throws Error if adapter name is not recognized
 */
export function createAdapterByName(name: string): IntegrationAdapter {
  const normalizedName = normalizeAdapterName(name);
  
  switch (normalizedName) {
    case 'mock':
      const config = getIntegrationAdapterConfig('mock');
      if (!config.enabled) {
        throw new Error(`Integration adapter is disabled: ${name}`);
      }
      return new MockAdapter();
    default:
      throw new Error(`Unknown integration adapter: ${name}`);
  }
}
