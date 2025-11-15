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

  // Dependencies
  dependencies?: TaskDependency[]

  // Resources
  resources?: Resource[]

  // Additional metadata
  priority?: 'low' | 'medium' | 'high' | 'critical'
  tags?: string[]
  estimatedHours?: number
  actualHours?: number

  // Version control
  version?: number
  modifiedBy?: string

  // UI state
  isCollapsed?: boolean
  isMilestone?: boolean
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
  search?: string
  tags?: string[]
  priority?: string
  resourceId?: string
}

// Task Dependencies
export interface TaskDependency {
  id: string
  predecessorId: string
  successorId: string
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish'
  lag?: number // in days
}

// Resources
export interface Resource {
  id: string
  name: string
  email?: string
  role?: string
  avatar?: string
  availability?: number // 0-100%
  color?: string
}

export interface ResourceAllocation {
  id: string
  taskId: string
  resourceId: string
  allocation: number // 0-100%
  startDate?: Date
  endDate?: Date
}

// Version Control
export interface TaskChange {
  id: string
  taskId: string
  changeType: 'create' | 'update' | 'delete'
  field?: string
  oldValue?: any
  newValue?: any
  timestamp: Date
  userId?: string
  userName?: string
}

export interface ChangeSet {
  id: string
  changes: TaskChange[]
  timestamp: Date
  userId?: string
  userName?: string
  description?: string
}

// Filters
export interface TaskFilter {
  search?: string
  statuses?: string[]
  groups?: string[]
  owners?: string[]
  tags?: string[]
  priorities?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  resources?: string[]
}

// View Configuration
export interface GanttViewConfig {
  scale: 'day' | 'week' | 'month' | 'quarter' | 'year'
  zoom: number // 0.5 to 2.0
  showWeekends: boolean
  showDependencies: boolean
  showCriticalPath: boolean
  showMilestones: boolean
  showResources: boolean
  groupBy?: 'status' | 'owner' | 'group' | 'priority'
  colorBy?: 'status' | 'owner' | 'priority' | 'progress'
}

// Critical Path
export interface CriticalPathTask {
  taskId: string
  slack: number // in days
  isCritical: boolean
}

// Collaboration
export interface Comment {
  id: string
  taskId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  timestamp: Date
  parentId?: string // for threaded comments
}

export interface UserPresence {
  userId: string
  userName: string
  userAvatar?: string
  color: string
  cursor?: { x: number; y: number }
  selection?: string // selected task ID
  lastSeen: Date
}

// Data Source Configuration
export interface DataSourceConfig {
  type: 'demo' | 'baserow' | 'postgres' | 'mysql' | 'mongodb' | 'excel' | 'airtable' | 'googlesheets'
  name?: string

  // Connection details (type-specific)
  connectionString?: string
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string

  // API-based sources
  apiUrl?: string
  apiToken?: string

  // File-based sources
  filePath?: string

  // Field mapping
  fieldMapping?: FieldMapping

  // Sync configuration
  syncEnabled?: boolean
  syncInterval?: number // in seconds
  lastSync?: Date
}

export interface FieldMapping {
  id: string
  name: string
  startDate: string
  endDate: string
  status?: string
  group?: string
  owner?: string
  description?: string
  progress?: string
  priority?: string
  tags?: string
}

// Database Explorer
export interface DatabaseSchema {
  name: string
  tables: DatabaseTable[]
}

export interface DatabaseTable {
  name: string
  rowCount?: number
  columns: DatabaseColumn[]
}

export interface DatabaseColumn {
  name: string
  type: string
  nullable: boolean
  isPrimaryKey?: boolean
  isForeignKey?: boolean
}

export interface DataPreview {
  columns: string[]
  rows: any[][]
  totalRows: number
}
