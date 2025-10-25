import { IDataProvider } from "../data-provider.interface"
import {
  Task,
  TaskStatus,
  CreateTaskDTO,
  UpdateTaskDTO,
  PaginatedResponse,
  TaskQueryParams,
} from "@/types/task"
import { BaserowClient } from "./baserow-client"
import { BaserowRow, BaserowPaginatedResponse } from "./types"
import { getFieldMapping, BaserowFieldMapping } from "./field-mapping"

export interface BaserowProviderConfig {
  baseUrl: string
  token: string
  tasksTableId: string
  statusesTableId: string
  fieldMapping?: BaserowFieldMapping // Optional custom field mapping
}

/**
 * Baserow Data Provider
 *
 * Implements the IDataProvider interface for Baserow backend
 */
export class BaserowProvider implements IDataProvider {
  private client: BaserowClient
  private config: BaserowProviderConfig
  private fieldMapping: BaserowFieldMapping

  constructor(config: BaserowProviderConfig) {
    this.config = config
    this.client = new BaserowClient(config.baseUrl, config.token)
    // Use custom field mapping if provided, otherwise use defaults
    this.fieldMapping = config.fieldMapping || getFieldMapping()
  }

  /**
   * Map a Baserow row to a Task object
   */
  private mapRowToTask(row: BaserowRow, statuses?: TaskStatus[]): Task {
    const fields = this.fieldMapping.tasks

    // Handle status - could be a link field (array), single select, or ID
    let status: TaskStatus | undefined
    const statusValue = row[fields.status]

    if (statusValue) {
      if (Array.isArray(statusValue) && statusValue.length > 0) {
        // Link field - use first linked status
        const statusId = statusValue[0].id || statusValue[0]
        status = statuses?.find((s) => s.id === String(statusId))
      } else if (typeof statusValue === "object" && statusValue.id) {
        // Single select or object
        status = {
          id: String(statusValue.id),
          name: statusValue.value || statusValue.name || "Unknown",
          color: statusValue.color,
        }
      } else if (statusValue.id || statusValue.value) {
        // Baserow single select format
        status = {
          id: String(statusValue.id),
          name: statusValue.value,
          color: statusValue.color,
        }
      }
    }

    return {
      id: String(row[fields.id]),
      name: row[fields.name] || "Untitled Task",
      startAt: new Date(row[fields.startAt]),
      endAt: new Date(row[fields.endAt]),
      status,
      group: fields.group ? row[fields.group] : undefined,
      owner: fields.owner ? row[fields.owner] : undefined,
      description: fields.description ? row[fields.description] : undefined,
      progress: fields.progress ? Number(row[fields.progress]) : undefined,
      createdAt: fields.createdAt ? new Date(row[fields.createdAt]) : undefined,
      updatedAt: fields.updatedAt ? new Date(row[fields.updatedAt]) : undefined,
    }
  }

  /**
   * Map a Task DTO to Baserow row data
   */
  private mapTaskToRow(task: CreateTaskDTO | UpdateTaskDTO): Partial<BaserowRow> {
    const fields = this.fieldMapping.tasks
    const row: Partial<BaserowRow> = {}

    if ("name" in task && task.name !== undefined) {
      row[fields.name] = task.name
    }
    if ("startAt" in task && task.startAt !== undefined) {
      row[fields.startAt] = task.startAt.toISOString().split("T")[0]
    }
    if ("endAt" in task && task.endAt !== undefined) {
      row[fields.endAt] = task.endAt.toISOString().split("T")[0]
    }
    if ("statusId" in task && task.statusId !== undefined) {
      // For link fields, use array format. For single select, Baserow expects the ID.
      // Adjust based on your field type
      row[fields.status] = [Number(task.statusId)] // Link field format
    }
    if ("group" in task && task.group !== undefined && fields.group) {
      row[fields.group] = task.group
    }
    if ("owner" in task && task.owner !== undefined && fields.owner) {
      row[fields.owner] = task.owner
    }
    if ("description" in task && task.description !== undefined && fields.description) {
      row[fields.description] = task.description
    }
    if ("progress" in task && task.progress !== undefined && fields.progress) {
      row[fields.progress] = task.progress
    }

    return row
  }

  /**
   * Map a Baserow status row to TaskStatus
   */
  private mapRowToStatus(row: BaserowRow): TaskStatus {
    const fields = this.fieldMapping.statuses

    return {
      id: String(row[fields.id]),
      name: row[fields.name] || "Unknown",
      color: fields.color ? row[fields.color] : undefined,
    }
  }

  /**
   * Get tasks with pagination
   */
  async getTasks(params?: TaskQueryParams): Promise<PaginatedResponse<Task>> {
    const page = params?.page || 1
    const pageSize = params?.pageSize || 100

    // Fetch statuses first for proper mapping
    const statuses = await this.getStatuses()

    // Try with order_by first, fallback without it if field doesn't exist
    let response: BaserowPaginatedResponse<BaserowRow>
    try {
      response = await this.client.listRows(this.config.tasksTableId, {
        page,
        size: pageSize,
        order_by: this.fieldMapping.tasks.startAt,
      })
    } catch (error) {
      // If order_by field not found, retry without ordering
      if (
        error instanceof Error &&
        error.message.includes("ERROR_ORDER_BY_FIELD_NOT_FOUND")
      ) {
        console.warn(
          `Order by field "${this.fieldMapping.tasks.startAt}" not found, fetching without ordering`
        )
        response = await this.client.listRows(this.config.tasksTableId, {
          page,
          size: pageSize,
        })
      } else {
        throw error
      }
    }

    const tasks = response.results.map((row) => this.mapRowToTask(row, statuses))

    return {
      data: tasks,
      total: response.count,
      page,
      pageSize,
      hasMore: response.next !== null,
    }
  }

  /**
   * Get all tasks (handles pagination automatically)
   */
  async getAllTasks(): Promise<Task[]> {
    const statuses = await this.getStatuses()

    // Try with order_by first, fallback without it if field doesn't exist
    let rows: BaserowRow[]
    try {
      rows = await this.client.getAllRows(this.config.tasksTableId, {
        order_by: this.fieldMapping.tasks.startAt,
      })
    } catch (error) {
      // If order_by field not found, retry without ordering
      if (
        error instanceof Error &&
        error.message.includes("ERROR_ORDER_BY_FIELD_NOT_FOUND")
      ) {
        console.warn(
          `Order by field "${this.fieldMapping.tasks.startAt}" not found, fetching without ordering`
        )
        rows = await this.client.getAllRows(this.config.tasksTableId, {})
      } else {
        throw error
      }
    }

    return rows.map((row) => this.mapRowToTask(row, statuses))
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    try {
      const statuses = await this.getStatuses()
      const row = await this.client.getRow(this.config.tasksTableId, id)
      return this.mapRowToTask(row, statuses)
    } catch {
      return null
    }
  }

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskDTO): Promise<Task> {
    const rowData = this.mapTaskToRow(data)
    const row = await this.client.createRow(this.config.tasksTableId, rowData)
    const statuses = await this.getStatuses()
    return this.mapRowToTask(row, statuses)
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, data: UpdateTaskDTO): Promise<Task> {
    const rowData = this.mapTaskToRow(data)
    const row = await this.client.updateRow(this.config.tasksTableId, id, rowData)
    const statuses = await this.getStatuses()
    return this.mapRowToTask(row, statuses)
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    await this.client.deleteRow(this.config.tasksTableId, id)
  }

  /**
   * Get all statuses
   */
  async getStatuses(): Promise<TaskStatus[]> {
    try {
      const rows = await this.client.getAllRows(this.config.statusesTableId)
      return rows.map((row) => this.mapRowToStatus(row))
    } catch (error) {
      // If statuses table doesn't exist or is empty, return empty array
      console.error("Error fetching statuses:", error)
      return []
    }
  }

  /**
   * Get a single status by ID
   */
  async getStatusById(id: string): Promise<TaskStatus | null> {
    try {
      const row = await this.client.getRow(this.config.statusesTableId, id)
      return this.mapRowToStatus(row)
    } catch {
      return null
    }
  }

  /**
   * Health check
   */
  async isHealthy(): Promise<boolean> {
    return this.client.healthCheck()
  }
}
