import 'server-only'
import mysql from 'mysql2/promise'
import { IDataProvider } from '../data-provider.interface'
import type {
  Task,
  TaskStatus,
  CreateTaskDTO,
  UpdateTaskDTO,
  PaginatedResponse,
  TaskQueryParams,
} from '@/types/task'

export interface MySQLConfig {
  host: string
  port?: number
  user: string
  password: string
  database: string
  connectionLimit?: number
}

export class MySQLProvider implements IDataProvider {
  private pool: mysql.Pool | null = null
  private config: MySQLConfig

  constructor(config: MySQLConfig) {
    this.config = {
      ...config,
      port: config.port || 3306,
      connectionLimit: config.connectionLimit || 10,
    }
  }

  private async getPool(): Promise<mysql.Pool> {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        waitForConnections: true,
        connectionLimit: this.config.connectionLimit,
        queueLimit: 0,
      })
    }
    return this.pool
  }

  async getTasks(params?: TaskQueryParams): Promise<PaginatedResponse<Task>> {
    const pool = await this.getPool()
    const page = params?.page || 1
    const pageSize = params?.pageSize || 50
    const offset = (page - 1) * pageSize

    let query = `
      SELECT
        t.*,
        s.id as status_id,
        s.name as status_name,
        s.color as status_color
      FROM tasks t
      LEFT JOIN task_statuses s ON t.status_id = s.id
      WHERE 1=1
    `
    const queryParams: any[] = []

    // Add filters
    if (params?.startDate) {
      query += ' AND t.start_at >= ?'
      queryParams.push(params.startDate)
    }
    if (params?.endDate) {
      query += ' AND t.end_at <= ?'
      queryParams.push(params.endDate)
    }
    if (params?.statusId) {
      query += ' AND t.status_id = ?'
      queryParams.push(params?.statusId)
    }
    if (params?.group) {
      query += ' AND t.group_name = ?'
      queryParams.push(params.group)
    }
    if (params?.owner) {
      query += ' AND t.owner = ?'
      queryParams.push(params.owner)
    }
    if (params?.search) {
      query += ' AND (t.name LIKE ? OR t.description LIKE ?)'
      const searchTerm = `%${params.search}%`
      queryParams.push(searchTerm, searchTerm)
    }

    // Get total count
    const countQuery = query.replace(
      'SELECT t.*, s.id as status_id, s.name as status_name, s.color as status_color',
      'SELECT COUNT(*) as total'
    )
    const [countRows] = await pool.execute(countQuery, queryParams)
    const total = (countRows as any)[0].total

    // Add pagination
    query += ' ORDER BY t.start_at ASC LIMIT ? OFFSET ?'
    queryParams.push(pageSize, offset)

    const [rows] = await pool.execute(query, queryParams)

    const tasks = (rows as any[]).map((row) => this.mapRowToTask(row))

    return {
      data: tasks,
      total,
      page,
      pageSize,
      hasMore: offset + tasks.length < total,
    }
  }

  async getAllTasks(): Promise<Task[]> {
    const pool = await this.getPool()
    const [rows] = await pool.execute(`
      SELECT
        t.*,
        s.id as status_id,
        s.name as status_name,
        s.color as status_color
      FROM tasks t
      LEFT JOIN task_statuses s ON t.status_id = s.id
      ORDER BY t.start_at ASC
    `)

    return (rows as any[]).map((row) => this.mapRowToTask(row))
  }

  async getTaskById(id: string): Promise<Task | null> {
    const pool = await this.getPool()
    const [rows] = await pool.execute(
      `
      SELECT
        t.*,
        s.id as status_id,
        s.name as status_name,
        s.color as status_color
      FROM tasks t
      LEFT JOIN task_statuses s ON t.status_id = s.id
      WHERE t.id = ?
    `,
      [id]
    )

    const results = rows as any[]
    return results.length > 0 ? this.mapRowToTask(results[0]) : null
  }

  async createTask(data: CreateTaskDTO): Promise<Task> {
    const pool = await this.getPool()
    const id = this.generateId()
    const now = new Date()

    await pool.execute(
      `
      INSERT INTO tasks (
        id, name, start_at, end_at, status_id, group_name, owner, description, progress, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        data.name,
        data.startAt,
        data.endAt,
        data.statusId || null,
        data.group || null,
        data.owner || null,
        data.description || null,
        data.progress || 0,
        now,
        now,
      ]
    )

    const task = await this.getTaskById(id)
    if (!task) {
      throw new Error('Failed to create task')
    }

    return task
  }

  async updateTask(id: string, data: UpdateTaskDTO): Promise<Task> {
    const pool = await this.getPool()
    const updates: string[] = []
    const params: any[] = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      params.push(data.name)
    }
    if (data.startAt !== undefined) {
      updates.push('start_at = ?')
      params.push(data.startAt)
    }
    if (data.endAt !== undefined) {
      updates.push('end_at = ?')
      params.push(data.endAt)
    }
    if (data.statusId !== undefined) {
      updates.push('status_id = ?')
      params.push(data.statusId || null)
    }
    if (data.group !== undefined) {
      updates.push('group_name = ?')
      params.push(data.group || null)
    }
    if (data.owner !== undefined) {
      updates.push('owner = ?')
      params.push(data.owner || null)
    }
    if (data.description !== undefined) {
      updates.push('description = ?')
      params.push(data.description || null)
    }
    if (data.progress !== undefined) {
      updates.push('progress = ?')
      params.push(data.progress)
    }

    if (updates.length === 0) {
      const task = await this.getTaskById(id)
      if (!task) {
        throw new Error('Task not found')
      }
      return task
    }

    updates.push('updated_at = ?')
    params.push(new Date())
    params.push(id)

    await pool.execute(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    const task = await this.getTaskById(id)
    if (!task) {
      throw new Error('Task not found')
    }

    return task
  }

  async deleteTask(id: string): Promise<void> {
    const pool = await this.getPool()
    await pool.execute('DELETE FROM tasks WHERE id = ?', [id])
  }

  async getStatuses(): Promise<TaskStatus[]> {
    const pool = await this.getPool()
    const [rows] = await pool.execute('SELECT * FROM task_statuses ORDER BY name')

    return (rows as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
    }))
  }

  async getStatusById(id: string): Promise<TaskStatus | null> {
    const pool = await this.getPool()
    const [rows] = await pool.execute('SELECT * FROM task_statuses WHERE id = ?', [id])

    const results = rows as any[]
    return results.length > 0
      ? {
          id: results[0].id,
          name: results[0].name,
          color: results[0].color,
        }
      : null
  }

  async isHealthy(): Promise<boolean> {
    try {
      const pool = await this.getPool()
      await pool.execute('SELECT 1')
      return true
    } catch (error) {
      console.error('MySQL health check failed:', error)
      return false
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
    }
  }

  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      name: row.name,
      startAt: new Date(row.start_at),
      endAt: new Date(row.end_at),
      status: row.status_id
        ? {
            id: row.status_id,
            name: row.status_name,
            color: row.status_color,
          }
        : undefined,
      group: row.group_name || undefined,
      owner: row.owner || undefined,
      description: row.description || undefined,
      progress: row.progress || 0,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    }
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
