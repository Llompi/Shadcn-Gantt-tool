import { IDataProvider } from "../data-provider.interface"
import {
  Task,
  TaskStatus,
  CreateTaskDTO,
  UpdateTaskDTO,
  PaginatedResponse,
  TaskQueryParams,
} from "@/types/task"
import { DEMO_TASKS, DEMO_STATUSES } from "@/data/sample/demo-data"

/**
 * Demo Data Provider
 *
 * Provides sample data for testing without a real backend.
 * Useful for:
 * - Local development without Baserow
 * - Demos and presentations
 * - Testing the UI
 */
export class DemoProvider implements IDataProvider {
  private tasks: Task[] = []
  private statuses: TaskStatus[] = []

  constructor() {
    // Initialize with demo data
    this.tasks = JSON.parse(JSON.stringify(DEMO_TASKS))
    this.statuses = JSON.parse(JSON.stringify(DEMO_STATUSES))
  }

  /**
   * Get tasks with pagination
   */
  async getTasks(params?: TaskQueryParams): Promise<PaginatedResponse<Task>> {
    const page = params?.page || 1
    const pageSize = params?.pageSize || 100

    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedTasks = this.tasks.slice(start, end)

    return {
      data: paginatedTasks,
      total: this.tasks.length,
      page,
      pageSize,
      hasMore: end < this.tasks.length,
    }
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    return [...this.tasks]
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    return this.tasks.find((task) => task.id === id) || null
  }

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskDTO): Promise<Task> {
    const newTask: Task = {
      id: String(Date.now()),
      name: data.name,
      startAt: data.startAt,
      endAt: data.endAt,
      status: data.statusId
        ? this.statuses.find((s) => s.id === data.statusId)
        : undefined,
      group: data.group,
      owner: data.owner,
      description: data.description,
      progress: data.progress || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.tasks.push(newTask)
    return newTask
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, data: UpdateTaskDTO): Promise<Task> {
    const taskIndex = this.tasks.findIndex((task) => task.id === id)

    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`)
    }

    const updatedTask = {
      ...this.tasks[taskIndex],
      ...data,
      status: data.statusId
        ? this.statuses.find((s) => s.id === data.statusId) ||
          this.tasks[taskIndex].status
        : this.tasks[taskIndex].status,
      updatedAt: new Date(),
    }

    this.tasks[taskIndex] = updatedTask
    return updatedTask
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    const taskIndex = this.tasks.findIndex((task) => task.id === id)

    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`)
    }

    this.tasks.splice(taskIndex, 1)
  }

  /**
   * Get all statuses
   */
  async getStatuses(): Promise<TaskStatus[]> {
    return [...this.statuses]
  }

  /**
   * Get a single status by ID
   */
  async getStatusById(id: string): Promise<TaskStatus | null> {
    return this.statuses.find((status) => status.id === id) || null
  }

  /**
   * Health check
   */
  async isHealthy(): Promise<boolean> {
    return true
  }

  /**
   * Load tasks from JSON data
   */
  loadTasksFromJSON(tasks: Task[]): void {
    this.tasks = JSON.parse(JSON.stringify(tasks))
  }

  /**
   * Load statuses from JSON data
   */
  loadStatusesFromJSON(statuses: TaskStatus[]): void {
    this.statuses = JSON.parse(JSON.stringify(statuses))
  }
}
