import 'server-only'
import { MongoClient, Db, ObjectId } from 'mongodb'
import { IDataProvider } from '../data-provider.interface'
import type {
  Task,
  TaskStatus,
  CreateTaskDTO,
  UpdateTaskDTO,
  PaginatedResponse,
  TaskQueryParams,
} from '@/types/task'

export interface MongoDBConfig {
  uri: string
  database: string
  tasksCollection?: string
  statusesCollection?: string
}

export class MongoDBProvider implements IDataProvider {
  private client: MongoClient | null = null
  private db: Db | null = null
  private config: MongoDBConfig

  constructor(config: MongoDBConfig) {
    this.config = {
      ...config,
      tasksCollection: config.tasksCollection || 'tasks',
      statusesCollection: config.statusesCollection || 'task_statuses',
    }
  }

  private async getDb(): Promise<Db> {
    if (!this.db) {
      this.client = new MongoClient(this.config.uri)
      await this.client.connect()
      this.db = this.client.db(this.config.database)

      // Create indexes
      await this.db.collection(this.config.tasksCollection!).createIndexes([
        { key: { startAt: 1 } },
        { key: { endAt: 1 } },
        { key: { 'status.id': 1 } },
        { key: { group: 1 } },
        { key: { owner: 1 } },
        { key: { name: 'text', description: 'text' } },
      ])
    }
    return this.db
  }

  async getTasks(params?: TaskQueryParams): Promise<PaginatedResponse<Task>> {
    const db = await this.getDb()
    const collection = db.collection(this.config.tasksCollection!)

    const page = params?.page || 1
    const pageSize = params?.pageSize || 50
    const skip = (page - 1) * pageSize

    // Build filter
    const filter: any = {}

    if (params?.startDate) {
      filter.startAt = { $gte: params.startDate }
    }
    if (params?.endDate) {
      filter.endAt = { $lte: params.endDate }
    }
    if (params?.statusId) {
      filter['status.id'] = params.statusId
    }
    if (params?.group) {
      filter.group = params.group
    }
    if (params?.owner) {
      filter.owner = params.owner
    }
    if (params?.search) {
      filter.$text = { $search: params.search }
    }
    if (params?.tags && params.tags.length > 0) {
      filter.tags = { $in: params.tags }
    }
    if (params?.priority) {
      filter.priority = params.priority
    }

    // Get total count
    const total = await collection.countDocuments(filter)

    // Get paginated results
    const cursor = collection
      .find(filter)
      .sort({ startAt: 1 })
      .skip(skip)
      .limit(pageSize)

    const documents = await cursor.toArray()
    const tasks = documents.map((doc) => this.mapDocumentToTask(doc))

    return {
      data: tasks,
      total,
      page,
      pageSize,
      hasMore: skip + tasks.length < total,
    }
  }

  async getAllTasks(): Promise<Task[]> {
    const db = await this.getDb()
    const collection = db.collection(this.config.tasksCollection!)

    const documents = await collection.find({}).sort({ startAt: 1 }).toArray()
    return documents.map((doc) => this.mapDocumentToTask(doc))
  }

  async getTaskById(id: string): Promise<Task | null> {
    const db = await this.getDb()
    const collection = db.collection(this.config.tasksCollection!)

    const document = await collection.findOne({ id })
    return document ? this.mapDocumentToTask(document) : null
  }

  async createTask(data: CreateTaskDTO): Promise<Task> {
    const db = await this.getDb()
    const collection = db.collection(this.config.tasksCollection!)

    const id = this.generateId()
    const now = new Date()

    let status: TaskStatus | undefined
    if (data.statusId) {
      const fetchedStatus = await this.getStatusById(data.statusId)
      status = fetchedStatus || undefined
    }

    const document = {
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

    await collection.insertOne(document as any)

    const task = await this.getTaskById(id)
    if (!task) {
      throw new Error('Failed to create task')
    }

    return task
  }

  async updateTask(id: string, data: UpdateTaskDTO): Promise<Task> {
    const db = await this.getDb()
    const collection = db.collection(this.config.tasksCollection!)

    const updates: any = {
      updatedAt: new Date(),
    }

    if (data.name !== undefined) updates.name = data.name
    if (data.startAt !== undefined) updates.startAt = data.startAt
    if (data.endAt !== undefined) updates.endAt = data.endAt
    if (data.group !== undefined) updates.group = data.group
    if (data.owner !== undefined) updates.owner = data.owner
    if (data.description !== undefined) updates.description = data.description
    if (data.progress !== undefined) updates.progress = data.progress

    if (data.statusId !== undefined) {
      if (data.statusId) {
        const status = await this.getStatusById(data.statusId)
        updates.status = status || null
      } else {
        updates.status = null
      }
    }

    await collection.updateOne({ id }, { $set: updates })

    const task = await this.getTaskById(id)
    if (!task) {
      throw new Error('Task not found')
    }

    return task
  }

  async deleteTask(id: string): Promise<void> {
    const db = await this.getDb()
    const collection = db.collection(this.config.tasksCollection!)
    await collection.deleteOne({ id })
  }

  async getStatuses(): Promise<TaskStatus[]> {
    const db = await this.getDb()
    const collection = db.collection(this.config.statusesCollection!)

    const documents = await collection.find({}).sort({ name: 1 }).toArray()
    return documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      color: doc.color,
    }))
  }

  async getStatusById(id: string): Promise<TaskStatus | null> {
    const db = await this.getDb()
    const collection = db.collection(this.config.statusesCollection!)

    const document = await collection.findOne({ id })
    return document
      ? {
          id: document.id,
          name: document.name,
          color: document.color,
        }
      : null
  }

  async isHealthy(): Promise<boolean> {
    try {
      const db = await this.getDb()
      await db.admin().ping()
      return true
    } catch (error) {
      console.error('MongoDB health check failed:', error)
      return false
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.db = null
    }
  }

  async initializeCollections(): Promise<void> {
    const db = await this.getDb()

    // Create statuses collection with default statuses
    const statusesCollection = db.collection(this.config.statusesCollection!)
    const count = await statusesCollection.countDocuments()

    if (count === 0) {
      const defaultStatuses = [
        { id: 'status_1', name: 'To Do', color: '#94a3b8' },
        { id: 'status_2', name: 'In Progress', color: '#3b82f6' },
        { id: 'status_3', name: 'In Review', color: '#f59e0b' },
        { id: 'status_4', name: 'Blocked', color: '#ef4444' },
        { id: 'status_5', name: 'Done', color: '#10b981' },
      ]
      await statusesCollection.insertMany(defaultStatuses)
    }
  }

  private mapDocumentToTask(doc: any): Task {
    return {
      id: doc.id,
      name: doc.name,
      startAt: new Date(doc.startAt),
      endAt: new Date(doc.endAt),
      status: doc.status || undefined,
      group: doc.group || undefined,
      owner: doc.owner || undefined,
      description: doc.description || undefined,
      progress: doc.progress || 0,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
      priority: doc.priority || undefined,
      tags: doc.tags || undefined,
      estimatedHours: doc.estimatedHours || undefined,
      actualHours: doc.actualHours || undefined,
    }
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
