"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

// Types
export interface GanttTask {
  id: string
  name: string
  startAt: Date
  endAt: Date
  status?: {
    id: string
    name: string
    color?: string
  }
  group?: string
  owner?: string
  progress?: number
}

interface GanttContextValue {
  tasks: GanttTask[]
  viewStart: Date
  viewEnd: Date
  onTaskMove?: (taskId: string, startAt: Date, endAt: Date) => Promise<void>
  onTaskCreate?: (date: Date) => Promise<void>
  onTaskClick?: (task: GanttTask) => void
  setViewRange: (start: Date, end: Date) => void
}

const GanttContext = React.createContext<GanttContextValue | null>(null)

function useGantt() {
  const context = React.useContext(GanttContext)
  if (!context) {
    throw new Error("Gantt components must be used within GanttProvider")
  }
  return context
}

// Provider
interface GanttProviderProps {
  children: React.ReactNode
  tasks: GanttTask[]
  onTaskMove?: (taskId: string, startAt: Date, endAt: Date) => Promise<void>
  onTaskCreate?: (date: Date) => Promise<void>
  onTaskClick?: (task: GanttTask) => void
  defaultViewStart?: Date
  defaultViewEnd?: Date
}

export function GanttProvider({
  children,
  tasks,
  onTaskMove,
  onTaskCreate,
  onTaskClick,
  defaultViewStart,
  defaultViewEnd,
}: GanttProviderProps) {
  const [viewStart, setViewStart] = React.useState<Date>(
    defaultViewStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  )
  const [viewEnd, setViewEnd] = React.useState<Date>(
    defaultViewEnd || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  )

  const setViewRange = React.useCallback((start: Date, end: Date) => {
    setViewStart(start)
    setViewEnd(end)
  }, [])

  return (
    <GanttContext.Provider
      value={{
        tasks,
        viewStart,
        viewEnd,
        onTaskMove,
        onTaskCreate,
        onTaskClick,
        setViewRange,
      }}
    >
      {children}
    </GanttContext.Provider>
  )
}

// Header with navigation
export function GanttHeader({ className }: { className?: string }) {
  const { viewStart, viewEnd, setViewRange } = useGantt()

  const shiftView = (days: number) => {
    const shift = days * 24 * 60 * 60 * 1000
    setViewRange(new Date(viewStart.getTime() + shift), new Date(viewEnd.getTime() + shift))
  }

  const resetView = () => {
    setViewRange(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    )
  }

  return (
    <div className={cn("flex items-center justify-between p-4 border-b", className)}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => shiftView(-7)}
          className="p-2 hover:bg-accent rounded-md transition-colors"
          title="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={resetView}
          className="px-3 py-1 text-sm hover:bg-accent rounded-md transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => shiftView(7)}
          className="p-2 hover:bg-accent rounded-md transition-colors"
          title="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="text-sm text-muted-foreground">
        {viewStart.toLocaleDateString()} - {viewEnd.toLocaleDateString()}
      </div>
    </div>
  )
}

// Timeline Grid
function TimelineGrid({ className }: { className?: string }) {
  const { viewStart, viewEnd } = useGantt()
  const days = Math.ceil((viewEnd.getTime() - viewStart.getTime()) / (24 * 60 * 60 * 1000))

  return (
    <div className={cn("relative h-full", className)}>
      <div className="flex h-12 border-b bg-muted/50">
        {Array.from({ length: days }).map((_, i) => {
          const date = new Date(viewStart.getTime() + i * 24 * 60 * 60 * 1000)
          const isWeekend = date.getDay() === 0 || date.getDay() === 6
          return (
            <div
              key={i}
              className={cn(
                "flex-1 border-r text-xs p-1 text-center",
                isWeekend && "bg-muted/70"
              )}
            >
              <div className="font-medium">{date.getDate()}</div>
              <div className="text-muted-foreground">
                {date.toLocaleDateString("en", { weekday: "short" })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Today Marker
export function GanttToday() {
  const { viewStart, viewEnd } = useGantt()
  const today = new Date()
  const totalDays = (viewEnd.getTime() - viewStart.getTime()) / (24 * 60 * 60 * 1000)
  const daysSinceStart = (today.getTime() - viewStart.getTime()) / (24 * 60 * 60 * 1000)
  const leftPercent = (daysSinceStart / totalDays) * 100

  if (leftPercent < 0 || leftPercent > 100) return null

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
      style={{ left: `${leftPercent}%` }}
    >
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full" />
    </div>
  )
}

// Feature Item (Task Bar)
export function GanttFeatureItem({ task }: { task: GanttTask }) {
  const { viewStart, viewEnd, onTaskMove, onTaskClick } = useGantt()
  const [isDragging, setIsDragging] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState<"start" | "end" | null>(null)
  const [dragOffset, setDragOffset] = React.useState({ start: 0, end: 0 })

  const totalDays = (viewEnd.getTime() - viewStart.getTime()) / (24 * 60 * 60 * 1000)
  const startOffset = (task.startAt.getTime() - viewStart.getTime()) / (24 * 60 * 60 * 1000)
  const duration = (task.endAt.getTime() - task.startAt.getTime()) / (24 * 60 * 60 * 1000)

  const leftPercent = (startOffset / totalDays) * 100
  const widthPercent = (duration / totalDays) * 100

  const handleMouseDown = (e: React.MouseEvent, type: "move" | "resize-start" | "resize-end") => {
    e.preventDefault()
    e.stopPropagation()

    if (type === "move") {
      setIsDragging(true)
      const rect = e.currentTarget.getBoundingClientRect()
      setDragOffset({ start: e.clientX - rect.left, end: 0 })
    } else if (type === "resize-start") {
      setIsResizing("start")
    } else {
      setIsResizing("end")
    }
  }

  React.useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = () => {
      // Visual feedback during drag/resize would be implemented here
      // This could include showing a preview of the new position or showing a tooltip
      // For now, we handle the actual update in handleMouseUp
    }

    const handleMouseUp = async (e: MouseEvent) => {
      if (isDragging || isResizing) {
        const container = document.getElementById("gantt-timeline-container")
        if (!container) return

        const rect = container.getBoundingClientRect()
        const relativeX = e.clientX - rect.left
        const dayWidth = rect.width / totalDays
        const day = Math.floor(relativeX / dayWidth)

        if (isDragging) {
          const offsetDays = Math.floor(dragOffset.start / dayWidth)
          const newStartDay = day - offsetDays
          const newStart = new Date(viewStart.getTime() + newStartDay * 24 * 60 * 60 * 1000)
          const taskDuration = task.endAt.getTime() - task.startAt.getTime()
          const newEnd = new Date(newStart.getTime() + taskDuration)

          if (onTaskMove) {
            await onTaskMove(task.id, newStart, newEnd)
          }
        } else if (isResizing === "start") {
          const newStart = new Date(viewStart.getTime() + day * 24 * 60 * 60 * 1000)
          if (newStart < task.endAt && onTaskMove) {
            await onTaskMove(task.id, newStart, task.endAt)
          }
        } else if (isResizing === "end") {
          const newEnd = new Date(viewStart.getTime() + (day + 1) * 24 * 60 * 60 * 1000)
          if (newEnd > task.startAt && onTaskMove) {
            await onTaskMove(task.id, task.startAt, newEnd)
          }
        }
      }

      setIsDragging(false)
      setIsResizing(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, dragOffset, task, totalDays, viewStart, onTaskMove])

  const backgroundColor = task.status?.color || "#3b82f6"

  return (
    <div
      className="absolute h-8 rounded cursor-move transition-opacity hover:opacity-80"
      style={{
        left: `${Math.max(0, leftPercent)}%`,
        width: `${Math.min(100 - leftPercent, widthPercent)}%`,
        backgroundColor,
        opacity: isDragging || isResizing ? 0.7 : 1,
      }}
      onMouseDown={(e) => handleMouseDown(e, "move")}
      onClick={() => onTaskClick?.(task)}
      title={`${task.name}\n${task.startAt.toLocaleDateString()} - ${task.endAt.toLocaleDateString()}`}
    >
      {/* Resize handle - start */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20"
        onMouseDown={(e) => handleMouseDown(e, "resize-start")}
      />

      <div className="px-2 py-1 text-xs text-white font-medium truncate">
        {task.name}
      </div>

      {/* Resize handle - end */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20"
        onMouseDown={(e) => handleMouseDown(e, "resize-end")}
      />
    </div>
  )
}

// Feature List (Container for tasks)
export function GanttFeatureList({ className }: { className?: string }) {
  const { tasks } = useGantt()

  return (
    <div className={cn("relative", className)}>
      <TimelineGrid />
      <div id="gantt-timeline-container" className="relative min-h-[400px] p-4">
        <GanttToday />
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="relative h-12">
              <div className="absolute inset-y-0 left-0 right-0">
                <GanttFeatureItem task={task} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Create Marker Trigger
export function GanttCreateMarkerTrigger({ className }: { className?: string }) {
  const { onTaskCreate } = useGantt()

  const handleClick = () => {
    if (onTaskCreate) {
      onTaskCreate(new Date())
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity",
        className
      )}
    >
      <Plus className="h-4 w-4" />
      Add Task
    </button>
  )
}
