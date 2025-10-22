import {
  Task,
  TaskStatus,
  CreateTaskDTO,
  UpdateTaskDTO,
  PaginatedResponse,
  TaskQueryParams,
} from "@/types/task"

/**
 * Data Provider Interface
 *
 * This interface defines the contract for all data providers.
 * Implementations can connect to different backends (Baserow, Postgres, etc.)
 * while keeping the same API surface for the application.
 */
export interface IDataProvider {
  // Task operations
  getTasks(params?: TaskQueryParams): Promise<PaginatedResponse<Task>>
  getAllTasks(): Promise<Task[]>
  getTaskById(id: string): Promise<Task | null>
  createTask(data: CreateTaskDTO): Promise<Task>
  updateTask(id: string, data: UpdateTaskDTO): Promise<Task>
  deleteTask(id: string): Promise<void>

  // Status operations
  getStatuses(): Promise<TaskStatus[]>
  getStatusById(id: string): Promise<TaskStatus | null>

  // Health check
  isHealthy(): Promise<boolean>
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  type: "baserow" | "postgres"
  baseUrl?: string
  token?: string
  database?: string
  // Add other config options as needed
}
