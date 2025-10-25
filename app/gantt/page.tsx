"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  GanttProvider,
  GanttHeader,
  GanttFeatureList,
  GanttCreateMarkerTrigger,
  GanttTask,
} from "@/components/ui/gantt"
import { TaskStatus, Task } from "@/types/task"
import { ClientSessionManager } from "@/lib/client-session-manager"
import { ClientBaserowProvider } from "@/lib/providers/baserow/client-baserow-provider"

function GanttPageContent() {
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<GanttTask[]>([])
  const [statuses, setStatuses] = useState<TaskStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  // Load tasks and statuses
  useEffect(() => {
    if (isClientMode && !clientProvider) {
      // Wait for client provider to be initialized
      return
    }
    loadData()
  }, [isClientMode, clientProvider])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (isClientMode && clientProvider) {
        // Client mode: Direct API calls via ClientBaserowProvider
        const [tasksData, statusesData] = await Promise.all([
          clientProvider.getAllTasks(),
          clientProvider.getStatuses(),
        ])

        setStatuses(statusesData)

        // Convert to GanttTask format
        const ganttTasks: GanttTask[] = tasksData.map((task: Task) => ({
          ...task,
          startAt: new Date(task.startAt),
          endAt: new Date(task.endAt),
        }))

        setTasks(ganttTasks)
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

        setStatuses(statusesData.data)

        // Convert to GanttTask format
        const ganttTasks: GanttTask[] = tasksData.data.map((task: GanttTask) => ({
          ...task,
          startAt: new Date(task.startAt),
          endAt: new Date(task.endAt),
        }))

        setTasks(ganttTasks)
      }
    } catch (err) {
      console.error("Error loading data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

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
            <div className="border rounded-lg overflow-hidden shadow-lg">
              <GanttHeader />
              <GanttFeatureList />
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
