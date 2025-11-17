"use client"

import { Suspense, useCallback, useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import {
  GanttProvider,
  GanttHeader,
  GanttFeatureList,
  GanttCreateMarkerTrigger,
  GanttTask,
  useGantt,
} from "@/components/ui/gantt"
import { TaskTable } from "@/components/ui/task-table"
import { TaskStatus, Task } from "@/types/task"
import { ClientSessionManager } from "@/lib/client-session-manager"
import { ClientBaserowProvider } from "@/lib/providers/baserow/client-baserow-provider"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { ExportButtons } from "@/components/export-buttons"
import { GripVertical, Settings, X, Save, CheckCircle2 } from "lucide-react"
import { DataFieldMapper, FieldMapping, ColorRule, TextTemplate } from "@/components/data-field-mapper"
import { fieldMapperStorage } from "@/lib/storage/field-mapper-storage"
import { ErrorBoundary } from "@/components/error-boundary"
import { TaskEditModal } from "@/components/task-edit-modal"

// Inner component that can access Gantt context
function GanttContent({
  tasks,
  statuses,
  onTaskUpdate,
  onTaskDelete,
  onTasksImport,
}: {
  tasks: GanttTask[]
  statuses: TaskStatus[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  onTaskDelete: (taskId: string) => Promise<void>
  onTasksImport: (tasks: Partial<Task>[]) => Promise<void>
}) {
  const { viewStart, viewEnd, timescale } = useGantt()
  const tableRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<HTMLDivElement>(null)

  return (
    <div className="space-y-4">
      {/* Export Controls */}
      <div className="flex items-center justify-end">
        <ExportButtons
          ganttRef={ganttRef}
          tableRef={tableRef}
          filename="project-gantt"
        />
      </div>

      {/* Resizable Panel Layout */}
      <PanelGroup direction="horizontal" className="min-h-[600px] border rounded-lg overflow-hidden shadow-lg">
        {/* Task Table Panel */}
        <Panel defaultSize={35} minSize={20} maxSize={60}>
          <div ref={tableRef} className="h-full overflow-hidden bg-background">
            <TaskTable
              tasks={tasks}
              statuses={statuses}
              onTaskUpdate={onTaskUpdate}
              onTaskDelete={onTaskDelete}
              onTasksImport={onTasksImport}
              viewStart={viewStart}
              viewEnd={viewEnd}
              timescale={timescale}
            />
          </div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors relative group">
          <div className="absolute inset-0 flex items-center justify-center">
            <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </PanelResizeHandle>

        {/* Gantt Chart Panel */}
        <Panel defaultSize={65} minSize={40}>
          <div ref={ganttRef} className="h-full overflow-hidden bg-background">
            <GanttHeader />
            <GanttFeatureList />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}

// Demo data for the field mapper
const DEMO_SOURCE_DATA = [
  {
    task_name: 'Design Homepage',
    start_date: '2024-01-15',
    due_date: '2024-01-22',
    task_status: 'In Progress',
    assigned_to: 'Alice Johnson',
    team: 'Design',
    notes: 'Create wireframes and mockups',
    completion: 65,
  },
  {
    task_name: 'Backend API Development',
    start_date: '2024-01-20',
    due_date: '2024-02-10',
    task_status: 'Not Started',
    assigned_to: 'Bob Smith',
    team: 'Engineering',
    notes: 'Build RESTful API endpoints',
    completion: 0,
  },
  {
    task_name: 'User Testing',
    start_date: '2024-02-15',
    due_date: '2024-02-28',
    task_status: 'Planned',
    assigned_to: 'Carol White',
    team: 'Product',
    notes: 'Conduct usability tests',
    completion: 0,
  },
]

const DEMO_SOURCE_FIELDS = [
  'task_name',
  'start_date',
  'due_date',
  'task_status',
  'assigned_to',
  'team',
  'notes',
  'completion',
]

function GanttPageContent() {
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<GanttTask[]>([])
  const [statuses, setStatuses] = useState<TaskStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [isClientMode, setIsClientMode] = useState(false)
  const [clientProvider, setClientProvider] = useState<ClientBaserowProvider | null>(null)
  const [showDataMapper, setShowDataMapper] = useState(false)

  // Field mapper state
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [colorRules, setColorRules] = useState<ColorRule[]>([])
  const [textTemplates, setTextTemplates] = useState<TextTemplate[]>([])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Edit modal state
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null)

  // Initialize client mode if needed
  useEffect(() => {
    const mode = searchParams.get("mode")
    const clientConfig = ClientSessionManager.getConfig()

    if (mode === "client" && clientConfig) {
      setIsClientMode(true)
      setClientProvider(new ClientBaserowProvider(clientConfig))
    } else if (mode === "client") {
      // Client mode requested but no config found
      setError("No client session found. Please configure client mode first.")
      setIsLoading(false)
    }
  }, [searchParams])

  // Load saved field mapper configuration on mount
  useEffect(() => {
    const savedMappings = fieldMapperStorage.loadMappings()
    const savedColorRules = fieldMapperStorage.loadColorRules()
    const savedTextTemplates = fieldMapperStorage.loadTextTemplates()

    if (savedMappings.length > 0) setFieldMappings(savedMappings)
    if (savedColorRules.length > 0) setColorRules(savedColorRules)
    if (savedTextTemplates.length > 0) setTextTemplates(savedTextTemplates)
  }, [])

  // Validate and sanitize task data
  const validateTask = useCallback((task: Task): { valid: boolean; reason?: string } => {
    // Check required fields
    if (!task.id) {
      return { valid: false, reason: 'Missing task ID' }
    }
    if (!task.name || task.name.trim() === '') {
      return { valid: false, reason: 'Missing task name' }
    }
    if (!task.startAt) {
      return { valid: false, reason: 'Missing start date' }
    }
    if (!task.endAt) {
      return { valid: false, reason: 'Missing end date' }
    }

    // Validate dates
    const startDate = new Date(task.startAt)
    const endDate = new Date(task.endAt)

    if (isNaN(startDate.getTime())) {
      return { valid: false, reason: 'Invalid start date' }
    }
    if (isNaN(endDate.getTime())) {
      return { valid: false, reason: 'Invalid end date' }
    }
    if (endDate < startDate) {
      return { valid: false, reason: 'End date is before start date' }
    }

    return { valid: true }
  }, [])

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setWarning(null)

      let rawTasks: Task[] = []
      let rawStatuses: TaskStatus[] = []

      if (isClientMode && clientProvider) {
        // Client mode: Direct API calls via ClientBaserowProvider
        const [tasksData, statusesData] = await Promise.all([
          clientProvider.getAllTasks(),
          clientProvider.getStatuses(),
        ])

        rawTasks = tasksData
        rawStatuses = statusesData
      } else {
        // Server mode: Fetch via API routes
        const [tasksResponse, statusesResponse] = await Promise.all([
          fetch("/api/tasks?all=true"),
          fetch("/api/statuses"),
        ])

        if (!tasksResponse.ok || !statusesResponse.ok) {
          throw new Error("Failed to fetch data")
        }

        const tasksData = await tasksResponse.json()
        const statusesData = await statusesResponse.json()

        if (!tasksData.success || !statusesData.success) {
          throw new Error(tasksData.error || statusesData.error || "Unknown error")
        }

        rawTasks = tasksData.data
        rawStatuses = statusesData.data
      }

      // Validate and filter tasks
      const validTasks: GanttTask[] = []
      const invalidTasks: { task: Task; reason: string }[] = []

      for (const task of rawTasks) {
        const validation = validateTask(task)
        if (validation.valid) {
          validTasks.push({
            ...task,
            startAt: new Date(task.startAt),
            endAt: new Date(task.endAt),
          })
        } else {
          invalidTasks.push({ task, reason: validation.reason || 'Unknown validation error' })
        }
      }

      // Log invalid tasks for debugging
      if (invalidTasks.length > 0) {
        console.warn(`Skipped ${invalidTasks.length} invalid task(s):`, invalidTasks)
      }

      setStatuses(rawStatuses)
      setTasks(validTasks)

      // Show warning if some tasks were skipped
      if (invalidTasks.length > 0) {
        const warningMsg = `${invalidTasks.length} task(s) were skipped due to missing or invalid data. Check console for details.`
        console.warn(`Skipped tasks:`, invalidTasks)

        if (validTasks.length === 0) {
          setError('No valid tasks found. Please check your field mappings and ensure your data has all required fields (ID, Name, Start Date, End Date).')
        } else {
          setWarning(`Loaded ${validTasks.length} valid task(s). ${warningMsg}`)
        }
      }
    } catch (err) {
      console.error("Error loading data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }, [isClientMode, clientProvider, validateTask])

  // Load tasks and statuses
  useEffect(() => {
    if (isClientMode && !clientProvider) {
      // Wait for client provider to be initialized
      return
    }
    loadData()
  }, [isClientMode, clientProvider, loadData])

  // Handle task move (drag & resize)
  const handleTaskMove = async (taskId: string, startAt: Date, endAt: Date) => {
    // Optimistic update
    const previousTasks = [...tasks]
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, startAt, endAt } : task
      )
    )

    try {
      if (isClientMode && clientProvider) {
        // Client mode: Direct API call via provider
        const updatedTask = await clientProvider.updateTask(taskId, {
          startAt,
          endAt,
        })

        // Update with provider response
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  startAt: new Date(updatedTask.startAt),
                  endAt: new Date(updatedTask.endAt),
                }
              : task
          )
        )
      } else {
        // Server mode: Fetch via API route
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update task")
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Failed to update task")
        }

        // Update with server response
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  startAt: new Date(result.data.startAt),
                  endAt: new Date(result.data.endAt),
                }
              : task
          )
        )
      }
    } catch (err) {
      console.error("Error updating task:", err)
      // Rollback on error
      setTasks(previousTasks)
      alert("Failed to update task. Please try again.")
    }
  }

  // Handle task creation
  const handleTaskCreate = async (date: Date) => {
    const name = prompt("Enter task name:")
    if (!name) return

    const defaultDuration = 7 // days
    const startAt = date
    const endAt = new Date(date.getTime() + defaultDuration * 24 * 60 * 60 * 1000)

    // Use first status as default, if available
    const defaultStatusId = statuses.length > 0 ? statuses[0].id : undefined

    try {
      if (isClientMode && clientProvider) {
        // Client mode: Direct API call via provider
        const createdTask = await clientProvider.createTask({
          name,
          startAt,
          endAt,
          statusId: defaultStatusId,
        })

        // Add new task to list
        const newTask: GanttTask = {
          ...createdTask,
          startAt: new Date(createdTask.startAt),
          endAt: new Date(createdTask.endAt),
        }

        setTasks((prev) => [...prev, newTask])
      } else {
        // Server mode: Fetch via API route
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            statusId: defaultStatusId,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to create task")
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Failed to create task")
        }

        // Add new task to list
        const newTask: GanttTask = {
          ...result.data,
          startAt: new Date(result.data.startAt),
          endAt: new Date(result.data.endAt),
        }

        setTasks((prev) => [...prev, newTask])
      }
    } catch (err) {
      console.error("Error creating task:", err)
      alert("Failed to create task. Please try again.")
    }
  }

  // Handle task click
  const handleTaskClick = (task: GanttTask) => {
    console.log("Task clicked:", task)
    // You can open a modal or navigate to task details here
  }

  // Handle task update from table
  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    // Optimistic update
    const previousTasks = [...tasks]
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    )

    try {
      // Prepare the update payload
      const payload: Record<string, string | number | undefined> = {}

      if (updates.name !== undefined) payload.name = updates.name
      if (updates.startAt !== undefined) payload.startAt = updates.startAt instanceof Date ? updates.startAt.toISOString() : new Date(updates.startAt).toISOString()
      if (updates.endAt !== undefined) payload.endAt = updates.endAt instanceof Date ? updates.endAt.toISOString() : new Date(updates.endAt).toISOString()
      if (updates.status !== undefined) payload.statusId = updates.status.id
      if (updates.owner !== undefined) payload.owner = updates.owner
      if (updates.group !== undefined) payload.group = updates.group
      if (updates.description !== undefined) payload.description = updates.description
      if (updates.progress !== undefined) payload.progress = updates.progress

      if (isClientMode && clientProvider) {
        // Client mode: Direct API call via provider
        const updatedTask = await clientProvider.updateTask(taskId, payload)

        // Update with provider response
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...updatedTask,
                  startAt: new Date(updatedTask.startAt),
                  endAt: new Date(updatedTask.endAt),
                }
              : task
          )
        )
      } else {
        // Server mode: Fetch via API route
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error("Failed to update task")
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Failed to update task")
        }

        // Update with server response
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...result.data,
                  startAt: new Date(result.data.startAt),
                  endAt: new Date(result.data.endAt),
                }
              : task
          )
        )
      }
    } catch (err) {
      console.error("Error updating task:", err)
      // Rollback on error
      setTasks(previousTasks)
      throw err
    }
  }

  // Handle task delete
  const handleTaskDelete = async (taskId: string) => {
    // Optimistic update
    const previousTasks = [...tasks]
    setTasks((prev) => prev.filter((task) => task.id !== taskId))

    try {
      if (isClientMode && clientProvider) {
        // Client mode: Direct API call via provider
        await clientProvider.deleteTask(taskId)
      } else {
        // Server mode: Fetch via API route
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete task")
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Failed to delete task")
        }
      }
    } catch (err) {
      console.error("Error deleting task:", err)
      // Rollback on error
      setTasks(previousTasks)
      alert("Failed to delete task. Please try again.")
      throw err
    }
  }

  // Handle tasks import
  const handleTasksImport = async (importedTasks: Partial<Task>[]) => {
    const createdTasks: GanttTask[] = []

    for (const taskData of importedTasks) {
      try {
        // Use first status as default if not specified
        const statusId = taskData.status?.id || (statuses.length > 0 ? statuses[0].id : undefined)

        if (isClientMode && clientProvider) {
          // Client mode: Direct API call via provider
          const createdTask = await clientProvider.createTask({
            name: taskData.name!,
            startAt: taskData.startAt!,
            endAt: taskData.endAt!,
            statusId,
            owner: taskData.owner,
            group: taskData.group,
            description: taskData.description,
            progress: taskData.progress,
          })

          createdTasks.push({
            ...createdTask,
            startAt: new Date(createdTask.startAt),
            endAt: new Date(createdTask.endAt),
          })
        } else {
          // Server mode: Fetch via API route
          const response = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: taskData.name,
              startAt: taskData.startAt instanceof Date ? taskData.startAt.toISOString() : new Date(taskData.startAt!).toISOString(),
              endAt: taskData.endAt instanceof Date ? taskData.endAt.toISOString() : new Date(taskData.endAt!).toISOString(),
              statusId,
              owner: taskData.owner,
              group: taskData.group,
              description: taskData.description,
              progress: taskData.progress,
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to create task")
          }

          const result = await response.json()

          if (!result.success) {
            throw new Error(result.error || "Failed to create task")
          }

          createdTasks.push({
            ...result.data,
            startAt: new Date(result.data.startAt),
            endAt: new Date(result.data.endAt),
          })
        }
      } catch (err) {
        console.error("Error creating task:", taskData.name, err)
      }
    }

    // Add all created tasks to the list
    if (createdTasks.length > 0) {
      setTasks((prev) => [...prev, ...createdTasks])
    }
  }

  // Handle field mapper configuration save
  const handleSaveFieldMapper = () => {
    setSaveStatus('saving')

    try {
      // Save each configuration type
      const mappingsSaved = fieldMapperStorage.saveMappings(fieldMappings)
      const colorRulesSaved = fieldMapperStorage.saveColorRules(colorRules)
      const templatesSaved = fieldMapperStorage.saveTextTemplates(textTemplates)

      if (mappingsSaved && colorRulesSaved && templatesSaved) {
        setSaveStatus('saved')

        // Reset status after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle')
          setShowDataMapper(false)
        }, 1500)
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving field mapper configuration:', error)
      alert('Failed to save configuration. Please try again.')
      setSaveStatus('idle')
    }
  }

  // Handle field mapper changes
  const handleMappingChange = (mappings: FieldMapping[]) => {
    setFieldMappings(mappings)
  }

  const handleColorRulesChange = (rules: ColorRule[]) => {
    setColorRules(rules)
  }

  const handleTextTemplatesChange = (templates: TextTemplate[]) => {
    setTextTemplates(templates)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading Gantt chart...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-red-600">Error: {error}</div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <GanttProvider
      tasks={tasks}
      onTaskMove={handleTaskMove}
      onTaskCreate={handleTaskCreate}
      onTaskClick={handleTaskClick}
      onTaskEditRequest={setEditingTask}
      onTaskDelete={handleTaskDelete}
    >
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          {/* Client Mode Banner */}
          {isClientMode && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-semibold text-green-900">
                      ⚡ Client Mode Active
                    </span>
                  </div>
                  <span className="text-sm text-green-700">
                    Direct browser connection to Baserow
                  </span>
                </div>
                <button
                  onClick={() => {
                    ClientSessionManager.clearConfig()
                    window.location.href = "/config"
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  End Session
                </button>
              </div>
            </div>
          )}

          {/* Data Validation Warning */}
          {warning && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-amber-800">Data Validation Warning</h3>
                  <p className="mt-1 text-sm text-amber-700">{warning}</p>
                  <p className="mt-2 text-xs text-amber-600">
                    Some tasks are missing required fields (ID, Name, Start Date, or End Date) or have invalid date values.
                    Please check your field mappings in the configuration page.
                  </p>
                </div>
                <button
                  onClick={() => setWarning(null)}
                  className="ml-3 flex-shrink-0"
                  aria-label="Dismiss warning"
                >
                  <svg className="h-4 w-4 text-amber-400 hover:text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Project Gantt Chart</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDataMapper(true)}
                className="relative flex items-center gap-2 px-4 py-2 border rounded hover:bg-accent transition-colors"
                title="Configure Field Mapping"
              >
                <Settings className="w-4 h-4" />
                Field Mapper
                {fieldMappings.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
                    {fieldMappings.length}
                  </span>
                )}
              </button>
              <GanttCreateMarkerTrigger />
              <button
                onClick={loadData}
                className="px-4 py-2 border rounded hover:bg-accent transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="border rounded-lg p-12 text-center">
              <p className="text-lg text-muted-foreground mb-4">
                No tasks yet. Create your first task to get started!
              </p>
              <GanttCreateMarkerTrigger />
            </div>
          ) : (
            <GanttContent
              tasks={tasks}
              statuses={statuses}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onTasksImport={handleTasksImport}
            />
          )}

          {/* Status Legend */}
          {statuses.length > 0 && (
            <div className="mt-6 p-4 border rounded-lg">
              <h3 className="text-sm font-semibold mb-2">Status Legend</h3>
              <div className="flex flex-wrap gap-3">
                {statuses.map((status) => (
                  <div key={status.id} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: status.color || "#3b82f6" }}
                    />
                    <span className="text-sm">{status.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Data Field Mapper Modal */}
        {showDataMapper && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-6xl max-h-[90vh] m-4 bg-background border rounded-lg shadow-2xl overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b bg-muted/50">
                <div>
                  <h2 className="text-2xl font-bold">Data Field Mapper</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure how your data fields map to Gantt chart properties
                  </p>
                </div>
                <button
                  onClick={() => setShowDataMapper(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Demo Mode</h3>
                  <p className="text-sm text-blue-700">
                    This is a demonstration of the field mapping interface using sample data.
                    In production, this would connect to your actual data source and allow you to:
                  </p>
                  <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                    <li>Map source fields to Gantt chart properties</li>
                    <li>Configure color rules based on field values</li>
                    <li>Set up text templates for task display</li>
                    <li>Validate data and preview transformations</li>
                  </ul>
                </div>

                <DataFieldMapper
                  sourceFields={DEMO_SOURCE_FIELDS}
                  sourceData={DEMO_SOURCE_DATA}
                  onMappingChange={handleMappingChange}
                  onColorRulesChange={handleColorRulesChange}
                  onTextTemplatesChange={handleTextTemplatesChange}
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/50">
                {fieldMappings.length > 0 && (
                  <div className="mr-auto text-sm text-muted-foreground">
                    {fieldMappings.length} field mapping(s) configured
                  </div>
                )}
                <button
                  onClick={() => setShowDataMapper(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
                  disabled={saveStatus === 'saving'}
                >
                  Close
                </button>
                <button
                  onClick={handleSaveFieldMapper}
                  disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveStatus === 'saving' && (
                    <>
                      <Save className="w-4 h-4 animate-pulse" />
                      Saving...
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Saved!
                    </>
                  )}
                  {saveStatus === 'idle' && (
                    <>
                      <Save className="w-4 h-4" />
                      Save Configuration
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task Edit Modal */}
        {editingTask && (
          <TaskEditModal
            task={editingTask}
            statuses={statuses}
            onSave={handleTaskUpdate}
            onClose={() => setEditingTask(null)}
          />
        )}
      </div>
    </GanttProvider>
  )
}

export default function GanttPage() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-lg">Loading Gantt chart...</div>
          </div>
        }
      >
        <GanttPageContent />
      </Suspense>
    </ErrorBoundary>
  )
}
