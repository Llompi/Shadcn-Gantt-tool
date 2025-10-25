/**
 * @file types.ts
 * @description TypeScript types for PostgreSQL provider
 * @created 2025-10-25
 */

/**
 * PostgreSQL provider configuration
 */
export interface PostgresConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl?: boolean | { rejectUnauthorized: boolean }
  maxConnections?: number
  idleTimeoutMillis?: number
  connectionTimeoutMillis?: number
}

/**
 * Raw task row from PostgreSQL database
 * Matches the schema defined in schema.sql
 */
export interface PostgresTaskRow {
  id: number
  name: string
  start_at: Date
  end_at: Date
  status_id: number | null
  group: string | null
  owner: string | null
  description: string | null
  progress: number | null
  created_at: Date
  updated_at: Date
}

/**
 * Raw status row from PostgreSQL database
 */
export interface PostgresStatusRow {
  id: number
  name: string
  color: string | null
  created_at: Date
  updated_at: Date
}

/**
 * Task with joined status information (from tasks_with_status view)
 */
export interface PostgresTaskWithStatus extends PostgresTaskRow {
  status_name: string | null
  status_color: string | null
}

/**
 * Task dependency row (future feature - v1.2.0)
 */
export interface PostgresDependencyRow {
  id: number
  task_id: number
  depends_on_task_id: number
  dependency_type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'
  lag_days: number
  created_at: Date
}

/**
 * Query parameters for filtering tasks
 */
export interface PostgresQueryParams {
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
  statusId?: number
  group?: string
  owner?: string
  orderBy?: 'start_at' | 'end_at' | 'name' | 'created_at'
  orderDirection?: 'ASC' | 'DESC'
}

/**
 * Paginated query result
 */
export interface PostgresPaginatedResult<T> {
  rows: T[]
  total: number
  limit: number
  offset: number
}

/**
 * Database connection pool status
 */
export interface PoolStatus {
  totalCount: number
  idleCount: number
  waitingCount: number
}
