/**
 * @file field-mapping.ts
 * @description Field mapping configuration for PostgreSQL provider
 * @created 2025-10-25
 */

/**
 * PostgreSQL field mapping interface
 * Maps canonical field names to database column names
 */
export interface PostgresFieldMapping {
  tasks: {
    id: string
    name: string
    startAt: string
    endAt: string
    statusId: string
    group: string
    owner: string
    description: string
    progress: string
    createdAt: string
    updatedAt: string
  }
  statuses: {
    id: string
    name: string
    color: string
    createdAt: string
    updatedAt: string
  }
}

/**
 * Default field mapping for PostgreSQL
 * Matches the schema defined in schema.sql
 */
export const DEFAULT_POSTGRES_FIELD_MAPPING: PostgresFieldMapping = {
  tasks: {
    id: 'id',
    name: 'name',
    startAt: 'start_at',
    endAt: 'end_at',
    statusId: 'status_id',
    group: 'group',
    owner: 'owner',
    description: 'description',
    progress: 'progress',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  statuses: {
    id: 'id',
    name: 'name',
    color: 'color',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
}

/**
 * Get the current field mapping
 * This can be extended to read from configuration storage in the future
 */
export function getPostgresFieldMapping(): PostgresFieldMapping {
  // TODO: In v1.1.0 UI config, read from database or config file
  // For now, return the default mapping
  return DEFAULT_POSTGRES_FIELD_MAPPING
}
