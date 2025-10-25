/**
 * @file postgres-client.ts
 * @description PostgreSQL client for database operations
 * @created 2025-10-25
 */

import { Pool, PoolClient, QueryResult } from 'pg'
import type {
  PostgresConfig,
  PostgresTaskRow,
  PostgresStatusRow,
  PostgresQueryParams,
  PostgresPaginatedResult,
  PoolStatus,
} from './types'
import { getPostgresFieldMapping } from './field-mapping'

/**
 * PostgreSQL client class
 * Handles all low-level database operations using pg connection pool
 */
export class PostgresClient {
  private pool: Pool
  private fieldMapping = getPostgresFieldMapping()

  constructor(config: PostgresConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl,
      max: config.maxConnections || 10,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
    })

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err)
    })
  }

  /**
   * Execute a query with parameters
   * @param text - SQL query string
   * @param params - Query parameters (for parameterized queries)
   * @returns Query result
   */
  private async query<T = unknown>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    try {
      return await this.pool.query<T>(text, params)
    } catch (error) {
      console.error('PostgreSQL query error:', error)
      throw new Error(
        `Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  private async getClient(): Promise<PoolClient> {
    try {
      return await this.pool.connect()
    } catch (error) {
      console.error('Failed to get PostgreSQL client:', error)
      throw new Error('Failed to connect to database')
    }
  }

  // ============================================================
  // TASK OPERATIONS
  // ============================================================

  /**
   * List tasks with pagination and filtering
   */
  async listTasks(
    params?: PostgresQueryParams
  ): Promise<PostgresPaginatedResult<PostgresTaskRow>> {
    const {
      limit = 50,
      offset = 0,
      startDate,
      endDate,
      statusId,
      group,
      owner,
      orderBy = 'start_at',
      orderDirection = 'ASC',
    } = params || {}

    // Build WHERE clause
    const conditions: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (startDate) {
      conditions.push(`${this.fieldMapping.tasks.startAt} >= $${paramIndex}`)
      values.push(startDate)
      paramIndex++
    }

    if (endDate) {
      conditions.push(`${this.fieldMapping.tasks.endAt} <= $${paramIndex}`)
      values.push(endDate)
      paramIndex++
    }

    if (statusId !== undefined) {
      conditions.push(`${this.fieldMapping.tasks.statusId} = $${paramIndex}`)
      values.push(statusId)
      paramIndex++
    }

    if (group) {
      conditions.push(`${this.fieldMapping.tasks.group} = $${paramIndex}`)
      values.push(group)
      paramIndex++
    }

    if (owner) {
      conditions.push(`${this.fieldMapping.tasks.owner} = $${paramIndex}`)
      values.push(owner)
      paramIndex++
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Count total matching rows
    const countQuery = `SELECT COUNT(*) FROM tasks ${whereClause}`
    const countResult = await this.query<{ count: string }>(countQuery, values)
    const total = parseInt(countResult.rows[0].count, 10)

    // Fetch paginated rows
    const dataQuery = `
      SELECT * FROM tasks
      ${whereClause}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    const dataResult = await this.query<PostgresTaskRow>(dataQuery, [
      ...values,
      limit,
      offset,
    ])

    return {
      rows: dataResult.rows,
      total,
      limit,
      offset,
    }
  }

  /**
   * Get all tasks (no pagination)
   */
  async getAllTasks(): Promise<PostgresTaskRow[]> {
    const query = `
      SELECT * FROM tasks
      ORDER BY ${this.fieldMapping.tasks.startAt} ASC
    `
    const result = await this.query<PostgresTaskRow>(query)
    return result.rows
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(id: string | number): Promise<PostgresTaskRow | null> {
    const query = `SELECT * FROM tasks WHERE ${this.fieldMapping.tasks.id} = $1`
    const result = await this.query<PostgresTaskRow>(query, [id])
    return result.rows[0] || null
  }

  /**
   * Create a new task
   */
  async createTask(
    data: Partial<PostgresTaskRow>
  ): Promise<PostgresTaskRow> {
    const fields = this.fieldMapping.tasks
    const query = `
      INSERT INTO tasks (
        ${fields.name},
        ${fields.startAt},
        ${fields.endAt},
        ${fields.statusId},
        ${fields.group},
        ${fields.owner},
        ${fields.description},
        ${fields.progress}
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `

    const values = [
      data.name,
      data.start_at,
      data.end_at,
      data.status_id || null,
      data.group || null,
      data.owner || null,
      data.description || null,
      data.progress || 0,
    ]

    const result = await this.query<PostgresTaskRow>(query, values)
    return result.rows[0]
  }

  /**
   * Update an existing task
   */
  async updateTask(
    id: string | number,
    data: Partial<PostgresTaskRow>
  ): Promise<PostgresTaskRow> {
    const fields = this.fieldMapping.tasks
    const updates: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    // Build SET clause dynamically
    if (data.name !== undefined) {
      updates.push(`${fields.name} = $${paramIndex}`)
      values.push(data.name)
      paramIndex++
    }

    if (data.start_at !== undefined) {
      updates.push(`${fields.startAt} = $${paramIndex}`)
      values.push(data.start_at)
      paramIndex++
    }

    if (data.end_at !== undefined) {
      updates.push(`${fields.endAt} = $${paramIndex}`)
      values.push(data.end_at)
      paramIndex++
    }

    if (data.status_id !== undefined) {
      updates.push(`${fields.statusId} = $${paramIndex}`)
      values.push(data.status_id)
      paramIndex++
    }

    if (data.group !== undefined) {
      updates.push(`${fields.group} = $${paramIndex}`)
      values.push(data.group)
      paramIndex++
    }

    if (data.owner !== undefined) {
      updates.push(`${fields.owner} = $${paramIndex}`)
      values.push(data.owner)
      paramIndex++
    }

    if (data.description !== undefined) {
      updates.push(`${fields.description} = $${paramIndex}`)
      values.push(data.description)
      paramIndex++
    }

    if (data.progress !== undefined) {
      updates.push(`${fields.progress} = $${paramIndex}`)
      values.push(data.progress)
      paramIndex++
    }

    if (updates.length === 0) {
      throw new Error('No fields to update')
    }

    // Add ID as final parameter
    values.push(id)

    const query = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE ${fields.id} = $${paramIndex}
      RETURNING *
    `

    const result = await this.query<PostgresTaskRow>(query, values)

    if (result.rows.length === 0) {
      throw new Error(`Task with ID ${id} not found`)
    }

    return result.rows[0]
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string | number): Promise<void> {
    const query = `DELETE FROM tasks WHERE ${this.fieldMapping.tasks.id} = $1`
    const result = await this.query(query, [id])

    if (result.rowCount === 0) {
      throw new Error(`Task with ID ${id} not found`)
    }
  }

  // ============================================================
  // STATUS OPERATIONS
  // ============================================================

  /**
   * Get all statuses
   */
  async getAllStatuses(): Promise<PostgresStatusRow[]> {
    const query = `
      SELECT * FROM statuses
      ORDER BY ${this.fieldMapping.statuses.id} ASC
    `
    const result = await this.query<PostgresStatusRow>(query)
    return result.rows
  }

  /**
   * Get a single status by ID
   */
  async getStatusById(id: string | number): Promise<PostgresStatusRow | null> {
    const query = `SELECT * FROM statuses WHERE ${this.fieldMapping.statuses.id} = $1`
    const result = await this.query<PostgresStatusRow>(query, [id])
    return result.rows[0] || null
  }

  /**
   * Create a new status
   */
  async createStatus(
    data: Partial<PostgresStatusRow>
  ): Promise<PostgresStatusRow> {
    const fields = this.fieldMapping.statuses
    const query = `
      INSERT INTO statuses (${fields.name}, ${fields.color})
      VALUES ($1, $2)
      RETURNING *
    `
    const result = await this.query<PostgresStatusRow>(query, [
      data.name,
      data.color || '#3b82f6',
    ])
    return result.rows[0]
  }

  /**
   * Update a status
   */
  async updateStatus(
    id: string | number,
    data: Partial<PostgresStatusRow>
  ): Promise<PostgresStatusRow> {
    const fields = this.fieldMapping.statuses
    const updates: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (data.name !== undefined) {
      updates.push(`${fields.name} = $${paramIndex}`)
      values.push(data.name)
      paramIndex++
    }

    if (data.color !== undefined) {
      updates.push(`${fields.color} = $${paramIndex}`)
      values.push(data.color)
      paramIndex++
    }

    if (updates.length === 0) {
      throw new Error('No fields to update')
    }

    values.push(id)

    const query = `
      UPDATE statuses
      SET ${updates.join(', ')}
      WHERE ${fields.id} = $${paramIndex}
      RETURNING *
    `

    const result = await this.query<PostgresStatusRow>(query, values)

    if (result.rows.length === 0) {
      throw new Error(`Status with ID ${id} not found`)
    }

    return result.rows[0]
  }

  /**
   * Delete a status
   */
  async deleteStatus(id: string | number): Promise<void> {
    const query = `DELETE FROM statuses WHERE ${this.fieldMapping.statuses.id} = $1`
    const result = await this.query(query, [id])

    if (result.rowCount === 0) {
      throw new Error(`Status with ID ${id} not found`)
    }
  }

  // ============================================================
  // HEALTH & CONNECTION
  // ============================================================

  /**
   * Check if the database connection is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health_check')
      return result.rows.length > 0 && result.rows[0].health_check === 1
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  /**
   * Get connection pool status
   */
  getPoolStatus(): PoolStatus {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    }
  }

  /**
   * Close the connection pool
   * Should be called when shutting down the application
   */
  async close(): Promise<void> {
    await this.pool.end()
  }

  // ============================================================
  // TRANSACTION SUPPORT (for future features)
  // ============================================================

  /**
   * Execute multiple operations in a transaction
   * @param operations - Async function that receives a client for transaction
   * @returns Result of the operations
   */
  async transaction<T>(
    operations: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient()

    try {
      await client.query('BEGIN')
      const result = await operations(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Transaction failed:', error)
      throw error
    } finally {
      client.release()
    }
  }
}
