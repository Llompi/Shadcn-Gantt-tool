import 'server-only'
import * as XLSX from 'xlsx'
import * as fs from 'fs/promises'
import * as path from 'path'
import { IDataProvider } from '../data-provider.interface'
import type {
  Task,
  TaskStatus,
  CreateTaskDTO,
  UpdateTaskDTO,
  PaginatedResponse,
  TaskQueryParams,
} from '@/types/task'

export interface ExcelConfig {
  filePath: string
  tasksSheet?: string
  statusesSheet?: string
  autoSave?: boolean
  watchFile?: boolean
}

export class ExcelProvider implements IDataProvider {
  private config: ExcelConfig
  private tasks: Map<string, Task> = new Map()
  private statuses: Map<string, TaskStatus> = new Map()
  private workbook: XLSX.WorkBook | null = null
  private fileWatcher: unknown = null
  private lastModified: number = 0

  constructor(config: ExcelConfig) {
    this.config = {
      ...config,
      tasksSheet: config.tasksSheet || 'Tasks',
      statusesSheet: config.statusesSheet || 'Statuses',
      autoSave: config.autoSave !== false,
    }
  }

  async initialize(): Promise<void> {
    await this.loadFromFile()

    if (this.config.watchFile) {
      this.setupFileWatcher()
    }
  }

  private async loadFromFile(): Promise<void> {
    try {
      // Check if file exists
      await fs.access(this.config.filePath)

      // Read the file
      const buffer = await fs.readFile(this.config.filePath)
      this.workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })

      // Load statuses
      if (this.workbook.SheetNames.includes(this.config.statusesSheet!)) {
        const statusSheet = this.workbook.Sheets[this.config.statusesSheet!]
        const statusData = XLSX.utils.sheet_to_json(statusSheet) as Record<string, unknown>[]

        this.statuses.clear()
        statusData.forEach((row) => {
          const status: TaskStatus = {
            id: (row.id || row.ID || `status_${row.name}`) as string,
            name: (row.name || row.Name) as string,
            color: (row.color || row.Color) as string | undefined,
          }
          this.statuses.set(status.id, status)
        })
      } else {
        // Create default statuses
        this.createDefaultStatuses()
      }

      // Load tasks
      if (this.workbook.SheetNames.includes(this.config.tasksSheet!)) {
        const taskSheet = this.workbook.Sheets[this.config.tasksSheet!]
        const taskData = XLSX.utils.sheet_to_json(taskSheet) as Record<string, unknown>[]

        this.tasks.clear()
        taskData.forEach((row) => {
          const task = this.mapRowToTask(row)
          if (task) {
            this.tasks.set(task.id, task)
          }
        })
      }

      // Get file stats
      const stats = await fs.stat(this.config.filePath)
      this.lastModified = stats.mtimeMs
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        // File doesn't exist, create it
        await this.createNewFile()
      } else {
        throw error
      }
    }
  }

  private async createNewFile(): Promise<void> {
    this.workbook = XLSX.utils.book_new()

    // Create default statuses
    this.createDefaultStatuses()
    await this.saveStatuses()

    // Create empty tasks sheet
    const tasksWS = XLSX.utils.json_to_sheet([])
    XLSX.utils.book_append_sheet(this.workbook, tasksWS, this.config.tasksSheet!)

    await this.saveToFile()
  }

  private createDefaultStatuses(): void {
    const defaultStatuses: TaskStatus[] = [
      { id: 'status_1', name: 'To Do', color: '#94a3b8' },
      { id: 'status_2', name: 'In Progress', color: '#3b82f6' },
      { id: 'status_3', name: 'In Review', color: '#f59e0b' },
      { id: 'status_4', name: 'Blocked', color: '#ef4444' },
      { id: 'status_5', name: 'Done', color: '#10b981' },
    ]

    this.statuses.clear()
    defaultStatuses.forEach((status) => {
      this.statuses.set(status.id, status)
    })
  }

  private async saveToFile(): Promise<void> {
    if (!this.workbook) return

    // Ensure directory exists
    const dir = path.dirname(this.config.filePath)
    await fs.mkdir(dir, { recursive: true })

    // Write file
    const buffer = XLSX.write(this.workbook, { type: 'buffer', bookType: 'xlsx' })
    await fs.writeFile(this.config.filePath, buffer)

    // Update last modified time
    const stats = await fs.stat(this.config.filePath)
    this.lastModified = stats.mtimeMs
  }

  private async saveTasks(): Promise<void> {
    if (!this.workbook) return

    const tasksArray = Array.from(this.tasks.values()).map((task) => ({
      id: task.id,
      name: task.name,
      startAt: task.startAt,
      endAt: task.endAt,
      statusId: task.status?.id || '',
      statusName: task.status?.name || '',
      group: task.group || '',
      owner: task.owner || '',
      description: task.description || '',
      progress: task.progress || 0,
      priority: task.priority || '',
      tags: task.tags?.join(', ') || '',
      estimatedHours: task.estimatedHours || '',
      actualHours: task.actualHours || '',
      createdAt: task.createdAt || '',
      updatedAt: task.updatedAt || '',
    }))

    const ws = XLSX.utils.json_to_sheet(tasksArray)

    // Remove old tasks sheet if exists
    if (this.workbook.SheetNames.includes(this.config.tasksSheet!)) {
      delete this.workbook.Sheets[this.config.tasksSheet!]
      this.workbook.SheetNames = this.workbook.SheetNames.filter(
        (name) => name !== this.config.tasksSheet
      )
    }

    XLSX.utils.book_append_sheet(this.workbook, ws, this.config.tasksSheet!)

    if (this.config.autoSave) {
      await this.saveToFile()
    }
  }

  private async saveStatuses(): Promise<void> {
    if (!this.workbook) return

    const statusesArray = Array.from(this.statuses.values())

    const ws = XLSX.utils.json_to_sheet(statusesArray)

    // Remove old statuses sheet if exists
    if (this.workbook.SheetNames.includes(this.config.statusesSheet!)) {
      delete this.workbook.Sheets[this.config.statusesSheet!]
      this.workbook.SheetNames = this.workbook.SheetNames.filter(
        (name) => name !== this.config.statusesSheet
      )
    }

    XLSX.utils.book_append_sheet(this.workbook, ws, this.config.statusesSheet!)

    if (this.config.autoSave) {
      await this.saveToFile()
    }
  }

  private setupFileWatcher(): void {
    // Simplified file watching
    // In production, you'd use fs.watch or chokidar
  }

  async getTasks(params?: TaskQueryParams): Promise<PaginatedResponse<Task>> {
    await this.checkForFileChanges()

    let filteredTasks = Array.from(this.tasks.values())

    // Apply filters
    if (params?.startDate) {
      filteredTasks = filteredTasks.filter(
        (task) => task.startAt >= params.startDate!
      )
    }
    if (params?.endDate) {
      filteredTasks = filteredTasks.filter((task) => task.endAt <= params.endDate!)
    }
    if (params?.statusId) {
      filteredTasks = filteredTasks.filter(
        (task) => task.status?.id === params.statusId
      )
    }
    if (params?.group) {
      filteredTasks = filteredTasks.filter((task) => task.group === params.group)
    }
    if (params?.owner) {
      filteredTasks = filteredTasks.filter((task) => task.owner === params.owner)
    }
    if (params?.search) {
      const search = params.search.toLowerCase()
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.name.toLowerCase().includes(search) ||
          task.description?.toLowerCase().includes(search)
      )
    }

    // Sort by start date
    filteredTasks.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())

    // Pagination
    const page = params?.page || 1
    const pageSize = params?.pageSize || 50
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    const paginatedTasks = filteredTasks.slice(startIndex, endIndex)

    return {
      data: paginatedTasks,
      total: filteredTasks.length,
      page,
      pageSize,
      hasMore: endIndex < filteredTasks.length,
    }
  }

  async getAllTasks(): Promise<Task[]> {
    await this.checkForFileChanges()
    const tasks = Array.from(this.tasks.values())
    tasks.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
    return tasks
  }

  async getTaskById(id: string): Promise<Task | null> {
    await this.checkForFileChanges()
    return this.tasks.get(id) || null
  }

  async createTask(data: CreateTaskDTO): Promise<Task> {
    const id = this.generateId()
    const now = new Date()

    let status: TaskStatus | undefined
    if (data.statusId) {
      status = this.statuses.get(data.statusId)
    }

    const task: Task = {
      id,
      name: data.name,
      startAt: data.startAt,
      endAt: data.endAt,
      status,
      group: data.group,
      owner: data.owner,
      description: data.description,
      progress: data.progress || 0,
      createdAt: now,
      updatedAt: now,
    }

    this.tasks.set(id, task)
    await this.saveTasks()

    return task
  }

  async updateTask(id: string, data: UpdateTaskDTO): Promise<Task> {
    const task = this.tasks.get(id)
    if (!task) {
      throw new Error('Task not found')
    }

    const updatedTask: Task = {
      ...task,
      updatedAt: new Date(),
    }

    if (data.name !== undefined) updatedTask.name = data.name
    if (data.startAt !== undefined) updatedTask.startAt = data.startAt
    if (data.endAt !== undefined) updatedTask.endAt = data.endAt
    if (data.group !== undefined) updatedTask.group = data.group
    if (data.owner !== undefined) updatedTask.owner = data.owner
    if (data.description !== undefined) updatedTask.description = data.description
    if (data.progress !== undefined) updatedTask.progress = data.progress

    if (data.statusId !== undefined) {
      if (data.statusId) {
        updatedTask.status = this.statuses.get(data.statusId)
      } else {
        updatedTask.status = undefined
      }
    }

    this.tasks.set(id, updatedTask)
    await this.saveTasks()

    return updatedTask
  }

  async deleteTask(id: string): Promise<void> {
    this.tasks.delete(id)
    await this.saveTasks()
  }

  async getStatuses(): Promise<TaskStatus[]> {
    await this.checkForFileChanges()
    return Array.from(this.statuses.values())
  }

  async getStatusById(id: string): Promise<TaskStatus | null> {
    return this.statuses.get(id) || null
  }

  async isHealthy(): Promise<boolean> {
    try {
      await fs.access(this.config.filePath)
      return true
    } catch {
      return false
    }
  }

  async close(): Promise<void> {
    if (this.fileWatcher && typeof this.fileWatcher === 'object' && 'close' in this.fileWatcher) {
      (this.fileWatcher as { close: () => void }).close()
      this.fileWatcher = null
    }
  }

  async sync(): Promise<void> {
    await this.loadFromFile()
  }

  private async checkForFileChanges(): Promise<void> {
    try {
      const stats = await fs.stat(this.config.filePath)
      if (stats.mtimeMs > this.lastModified) {
        await this.loadFromFile()
      }
    } catch {
      // File might not exist
    }
  }

  private mapRowToTask(row: Record<string, unknown>): Task | null {
    try {
      const id = (row.id || row.ID) as string | undefined
      const name = (row.name || row.Name) as string | undefined
      const startAt = this.parseDate(row.startAt || row.StartAt || row.start_at)
      const endAt = this.parseDate(row.endAt || row.EndAt || row.end_at)

      if (!id || !name || !startAt || !endAt) {
        return null
      }

      const statusId = (row.statusId || row.StatusId || row.status_id) as string | undefined
      const status = statusId ? this.statuses.get(statusId) : undefined

      const tagsValue = (row.tags as string | undefined)
      const tags = tagsValue ? tagsValue.split(',').map((t: string) => t.trim()) : []

      return {
        id,
        name,
        startAt,
        endAt,
        status,
        group: (row.group || row.Group) as string | undefined,
        owner: (row.owner || row.Owner) as string | undefined,
        description: (row.description || row.Description) as string | undefined,
        progress: Number(row.progress || row.Progress || 0),
        priority: (row.priority || row.Priority) as Task['priority'],
        tags: tags.length > 0 ? tags : undefined,
        estimatedHours: row.estimatedHours
          ? Number(row.estimatedHours)
          : undefined,
        actualHours: row.actualHours ? Number(row.actualHours) : undefined,
        createdAt: this.parseDate(row.createdAt || row.created_at),
        updatedAt: this.parseDate(row.updatedAt || row.updated_at),
      }
    } catch (error) {
      console.error('Error mapping row to task:', error, row)
      return null
    }
  }

  private parseDate(value: unknown): Date | undefined {
    if (!value) return undefined
    if (value instanceof Date) return value
    const date = new Date(value as string | number | Date)
    return isNaN(date.getTime()) ? undefined : date
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
