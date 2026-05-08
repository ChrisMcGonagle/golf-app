/**
 * Adapter factory - instantiates adapters by name
 */

import { IntegrationAdapter } from './types';
import { MockAdapter } from './mock';

/**
 * Factory function to create adapter instances by name
 * @param name - Adapter identifier (e.g., "mock", "golf_ireland")
 * @returns Instantiated adapter
 * @throws Error if adapter name is not recognized
 */
export function createAdapterByName(name: string): IntegrationAdapter {
  switch (name.toLowerCase()) {
    case 'mock':
      return new MockAdapter();
    default:
      throw new Error(`Unknown adapter: ${name}`);
  }
}
