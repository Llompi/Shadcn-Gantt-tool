// Canonical Task model used throughout the application
export interface Task {
  id: string
  name: string
  startAt: Date
  endAt: Date
  status?: TaskStatus
  group?: string
  owner?: string
  description?: string
  progress?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface TaskStatus {
  id: string
  name: string
  color?: string
}

// DTO for creating tasks
export interface CreateTaskDTO {
  name: string
  startAt: Date
  endAt: Date
  statusId?: string
  group?: string
  owner?: string
  description?: string
  progress?: number
}

// DTO for updating tasks
export interface UpdateTaskDTO {
  name?: string
  startAt?: Date
  endAt?: Date
  statusId?: string
  group?: string
  owner?: string
  description?: string
  progress?: number
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Query parameters
export interface TaskQueryParams {
  page?: number
  pageSize?: number
  startDate?: Date
  endDate?: Date
  statusId?: string
  group?: string
  owner?: string
}
