"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  GanttProvider,
  GanttHeader,
  GanttFeatureList,
  GanttCreateMarkerTrigger,
  GanttTask,
} from "@/components/ui/gantt"
import { TaskTable } from "@/components/ui/task-table"
import { TaskStatus, Task } from "@/types/task"
import { ClientSessionManager } from "@/lib/client-session-manager"
import { ClientBaserowProvider } from "@/lib/providers/baserow/client-baserow-provider"

function GanttPageContent() {
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<GanttTask[]>([])
  const [statuses, setStatuses] = useState<TaskStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [isClientMode, setIsClientMode] = useState(false)
  const [clientProvider, setClientProvider] = useState<ClientBaserowProvider | null>(null)

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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Task Table */}
              <div className="lg:col-span-5 border rounded-lg overflow-hidden shadow-lg">
                <TaskTable
                  tasks={tasks}
                  statuses={statuses}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskDelete={handleTaskDelete}
                  onTasksImport={handleTasksImport}
                />
              </div>

              {/* Gantt Chart */}
              <div className="lg:col-span-7 border rounded-lg overflow-hidden shadow-lg">
                <GanttHeader />
                <GanttFeatureList />
              </div>
            </div>
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
      </div>
    </GanttProvider>
  )
}

export default function GanttPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading Gantt chart...</div>
        </div>
      }
    >
      <GanttPageContent />
    </Suspense>
  )
}
