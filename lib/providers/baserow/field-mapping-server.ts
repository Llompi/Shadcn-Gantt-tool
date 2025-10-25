/**
 * Server-side field mapping utilities
 *
 * This module contains server-only functions for loading field mappings
 * from the file system.
 */

import 'server-only'

import { loadFieldMapping } from '@/lib/config-storage'
import { DEFAULT_FIELD_MAPPING, BaserowFieldMapping } from './field-mapping'

/**
 * Get field mapping asynchronously (server-side only)
 * This should be used in server components and API routes
 */
export async function getFieldMappingAsync(): Promise<BaserowFieldMapping> {
  try {
    const savedMapping = await loadFieldMapping()

    if (savedMapping) {
      return savedMapping
    }
  } catch (error) {
    console.warn('Failed to load saved field mapping, using defaults:', error)
  }

  return DEFAULT_FIELD_MAPPING
}
