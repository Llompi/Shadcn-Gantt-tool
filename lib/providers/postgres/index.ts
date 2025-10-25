/**
 * @file index.ts
 * @description PostgreSQL provider exports
 * @created 2025-10-25
 */

export { PostgresProvider } from './postgres-provider'
export { PostgresClient } from './postgres-client'
export { getPostgresFieldMapping, DEFAULT_POSTGRES_FIELD_MAPPING } from './field-mapping'
export type {
  PostgresConfig,
  PostgresTaskRow,
  PostgresStatusRow,
  PostgresQueryParams,
  PostgresPaginatedResult,
  PoolStatus,
} from './types'
export type { PostgresFieldMapping } from './field-mapping'
