/**
 * @file postgres-provider.ts
 * @description PostgreSQL implementation of IDataProvider
 * @created 2025-10-25
 */

import { IDataProvider } from '../data-provider.interface'
import type {
  Task,
  TaskStatus,
  CreateTaskDTO,
  UpdateTaskDTO,
  PaginatedResponse,
  TaskQueryParams,
} from '@/types/task'
import { PostgresClient } from './postgres-client'
import type {
  PostgresConfig,
  PostgresTaskRow,
  PostgresStatusRow,
  PostgresQueryParams,
} from './types'

/**
 * PostgreSQL data provider
 * Implements IDataProvider interface for PostgreSQL databases
 */
export class PostgresProvider implements IDataProvider {
  private client: PostgresClient
  private statusCache: Map<number, TaskStatus> = new Map()
  private cacheTimestamp: number = 0
  private readonly CACHE_TTL = 60000 // 1 minute cache for statuses

  constructor(config: PostgresConfig) {
    this.client = new PostgresClient(config)
  }

  // ============================================================
  // TASK OPERATIONS
  // ============================================================

  /**
   * Get tasks with pagination
   */
  async getTasks(params?: TaskQueryParams): Promise<PaginatedResponse<Task>> {
    const page = params?.page || 1
    const pageSize = params?.pageSize || 50
    const offset = (page - 1) * pageSize

    // Convert canonical params to PostgreSQL params
    const pgParams: PostgresQueryParams = {
      limit: pageSize,
      offset,
      startDate: params?.startDate,
      endDate: params?.endDate,
      statusId: params?.statusId ? parseInt(params.statusId, 10) : undefined,
      group: params?.group,
      owner: params?.owner,
    }

    const result = await this.client.listTasks(pgParams)

    // Load statuses for mapping
    const statuses = await this.getStatusesMap()

    // Map rows to canonical Task type
    const tasks = result.rows.map((row) => this.mapRowToTask(row, statuses))

    return {
      data: tasks,
      total: result.total,
      page,
      pageSize,
      hasMore: offset + tasks.length < result.total,
    }
  }

  /**
   * Get all tasks (no pagination)
   */
  async getAllTasks(): Promise<Task[]> {
    const rows = await this.client.getAllTasks()
    const statuses = await this.getStatusesMap()
    return rows.map((row) => this.mapRowToTask(row, statuses))
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    const row = await this.client.getTaskById(id)
    if (!row) return null

    const statuses = await this.getStatusesMap()
    return this.mapRowToTask(row, statuses)
  }

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskDTO): Promise<Task> {
    // Convert canonical DTO to PostgreSQL row format
    const pgRow: Partial<PostgresTaskRow> = {
      name: data.name,
      start_at: data.startAt,
      end_at: data.endAt,
      status_id: data.statusId ? parseInt(data.statusId, 10) : null,
      group: data.group || null,
      owner: data.owner || null,
      description: data.description || null,
      progress: data.progress || 0,
    }

    const createdRow = await this.client.createTask(pgRow)
    const statuses = await this.getStatusesMap()
    return this.mapRowToTask(createdRow, statuses)
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, data: UpdateTaskDTO): Promise<Task> {
    // Convert canonical DTO to PostgreSQL row format
    const pgRow: Partial<PostgresTaskRow> = {}

    if (data.name !== undefined) pgRow.name = data.name
    if (data.startAt !== undefined) pgRow.start_at = data.startAt
    if (data.endAt !== undefined) pgRow.end_at = data.endAt
    if (data.statusId !== undefined) {
      pgRow.status_id = data.statusId ? parseInt(data.statusId, 10) : null
    }
    if (data.group !== undefined) pgRow.group = data.group
    if (data.owner !== undefined) pgRow.owner = data.owner
    if (data.description !== undefined) pgRow.description = data.description
    if (data.progress !== undefined) pgRow.progress = data.progress

    const updatedRow = await this.client.updateTask(id, pgRow)
    const statuses = await this.getStatusesMap()
    return this.mapRowToTask(updatedRow, statuses)
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    await this.client.deleteTask(id)
  }

  // ============================================================
  // STATUS OPERATIONS
  // ============================================================

  /**
   * Get all statuses
   */
  async getStatuses(): Promise<TaskStatus[]> {
    const rows = await this.client.getAllStatuses()
    return rows.map((row) => this.mapRowToStatus(row))
  }

  /**
   * Get a single status by ID
   */
  async getStatusById(id: string): Promise<TaskStatus | null> {
    const row = await this.client.getStatusById(id)
    if (!row) return null
    return this.mapRowToStatus(row)
  }

  // ============================================================
  // HEALTH CHECK
  // ============================================================

  /**
   * Check if the database connection is healthy
   */
  async isHealthy(): Promise<boolean> {
    return await this.client.isHealthy()
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  /**
   * Get statuses map with caching
   * Reduces database queries by caching statuses for a short time
   */
  private async getStatusesMap(): Promise<Map<number, TaskStatus>> {
    const now = Date.now()

    // Return cached statuses if still valid
    if (this.statusCache.size > 0 && now - this.cacheTimestamp < this.CACHE_TTL) {
      return this.statusCache
    }

    // Fetch fresh statuses
    const rows = await this.client.getAllStatuses()
    this.statusCache.clear()

    rows.forEach((row) => {
      this.statusCache.set(row.id, this.mapRowToStatus(row))
    })

    this.cacheTimestamp = now
    return this.statusCache
  }

  /**
   * Map PostgreSQL task row to canonical Task type
   */
  private mapRowToTask(
    row: PostgresTaskRow,
    statuses?: Map<number, TaskStatus>
  ): Task {
    // Resolve status
    let status: TaskStatus | undefined = undefined
    if (row.status_id && statuses) {
      status = statuses.get(row.status_id)
    }

    return {
      id: String(row.id),
      name: row.name,
      startAt: new Date(row.start_at),
      endAt: new Date(row.end_at),
      status,
      group: row.group || undefined,
      owner: row.owner || undefined,
      description: row.description || undefined,
      progress: row.progress || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  /**
   * Map PostgreSQL status row to canonical TaskStatus type
   */
  private mapRowToStatus(row: PostgresStatusRow): TaskStatus {
    return {
      id: String(row.id),
      name: row.name,
      color: row.color || undefined,
    }
  }

  /**
   * Clean up resources
   * Should be called when shutting down the application
   */
  async close(): Promise<void> {
    await this.client.close()
    this.statusCache.clear()
  }
}
