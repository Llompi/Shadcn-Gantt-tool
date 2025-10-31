"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Plus, Diamond } from "lucide-react"

// Types
export type TimescaleType = "day" | "week" | "month" | "quarter"

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
  timescale: TimescaleType
  onTaskMove?: (taskId: string, startAt: Date, endAt: Date) => Promise<void>
  onTaskCreate?: (date: Date) => Promise<void>
  onTaskClick?: (task: GanttTask) => void
  setViewRange: (start: Date, end: Date) => void
  setTimescale: (timescale: TimescaleType) => void
}

const GanttContext = React.createContext<GanttContextValue | null>(null)

export function useGantt() {
  const context = React.useContext(GanttContext)
  if (!context) {
    throw new Error("Gantt components must be used within GanttProvider")
  }
  return context
}

// Helper functions for timeline calculations
function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

function getStartOfQuarter(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3)
  return new Date(date.getFullYear(), quarter * 3, 1, 0, 0, 0, 0)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function addQuarters(date: Date, quarters: number): Date {
  return addMonths(date, quarters * 3)
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
  defaultTimescale?: TimescaleType
}

export function GanttProvider({
  children,
  tasks,
  onTaskMove,
  onTaskCreate,
  onTaskClick,
  defaultViewStart,
  defaultViewEnd,
  defaultTimescale = "day",
}: GanttProviderProps) {
  const [viewStart, setViewStart] = React.useState<Date>(
    defaultViewStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  )
  const [viewEnd, setViewEnd] = React.useState<Date>(
    defaultViewEnd || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  )
  const [timescale, setTimescale] = React.useState<TimescaleType>(defaultTimescale)

  const setViewRange = React.useCallback((start: Date, end: Date) => {
    setViewStart(start)
    setViewEnd(end)
  }, [])

  // Adjust view range when timescale changes to align with period boundaries
  React.useEffect(() => {
    const now = new Date()
    let newStart: Date
    let newEnd: Date

    switch (timescale) {
      case "day":
        // Show 30 days before and 60 days after today
        newStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        newEnd = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
        break
      case "week":
        // Show 12 weeks before and 24 weeks after today, aligned to week start
        const weekStart = getStartOfWeek(now)
        newStart = addWeeks(weekStart, -12)
        newEnd = addWeeks(weekStart, 24)
        break
      case "month":
        // Show 6 months before and 12 months after today, aligned to month start
        const monthStart = getStartOfMonth(now)
        newStart = addMonths(monthStart, -6)
        newEnd = addMonths(monthStart, 12)
        break
      case "quarter":
        // Show 4 quarters before and 8 quarters after today, aligned to quarter start
        const quarterStart = getStartOfQuarter(now)
        newStart = addQuarters(quarterStart, -4)
        newEnd = addQuarters(quarterStart, 8)
        break
      default:
        return
    }

    setViewStart(newStart)
    setViewEnd(newEnd)
  }, [timescale])

  return (
    <GanttContext.Provider
      value={{
        tasks,
        viewStart,
        viewEnd,
        timescale,
        onTaskMove,
        onTaskCreate,
        onTaskClick,
        setViewRange,
        setTimescale,
      }}
    >
      {children}
    </GanttContext.Provider>
  )
}

// Header with navigation
export function GanttHeader({ className }: { className?: string }) {
  const { viewStart, viewEnd, timescale, setViewRange, setTimescale } = useGantt()

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
    <div className={cn("flex flex-col gap-2 p-4 border-b", className)}>
      <div className="flex items-center justify-between">
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
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Timescale:</span>
        {(["day", "week", "month", "quarter"] as TimescaleType[]).map((scale) => (
          <button
            key={scale}
            onClick={() => setTimescale(scale)}
            className={cn(
              "px-3 py-1 text-sm rounded-md transition-colors",
              timescale === scale
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            )}
          >
            {scale.charAt(0).toUpperCase() + scale.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}

// Timeline Grid with hierarchical time header
function TimelineGrid({ className }: { className?: string }) {
  const { viewStart, viewEnd, timescale } = useGantt()

  // Calculate periods based on timescale
  const getPeriods = () => {
    const periods: Array<{ date: Date; label: string; subLabel?: string }> = []
    const timeHeaders: Array<{ label: string; span: number }> = []

    let current = new Date(viewStart)
    const end = new Date(viewEnd)

    if (timescale === "day") {
      // Day view: Show months as headers, days as periods
      let currentMonth = ""
      let monthSpan = 0

      while (current <= end) {
        const monthYear = current.toLocaleDateString("en", { month: "long", year: "numeric" })

        if (monthYear !== currentMonth) {
          if (monthSpan > 0) {
            timeHeaders.push({ label: currentMonth, span: monthSpan })
          }
          currentMonth = monthYear
          monthSpan = 0
        }

        monthSpan++
        periods.push({
          date: new Date(current),
          label: current.getDate().toString(),
          subLabel: current.toLocaleDateString("en", { weekday: "short" }),
        })

        current = addDays(current, 1)
      }

      if (monthSpan > 0) {
        timeHeaders.push({ label: currentMonth, span: monthSpan })
      }
    } else if (timescale === "week") {
      // Week view: Show years as headers, weeks as periods
      let currentYear = ""
      let yearSpan = 0

      current = getStartOfWeek(current)

      while (current <= end) {
        const year = current.getFullYear().toString()

        if (year !== currentYear) {
          if (yearSpan > 0) {
            timeHeaders.push({ label: currentYear, span: yearSpan })
          }
          currentYear = year
          yearSpan = 0
        }

        yearSpan++
        periods.push({
          date: new Date(current),
          label: `W${getWeekNumber(current)}`,
          subLabel: `${current.getDate()}/${current.getMonth() + 1}`,
        })

        current = addWeeks(current, 1)
      }

      if (yearSpan > 0) {
        timeHeaders.push({ label: currentYear, span: yearSpan })
      }
    } else if (timescale === "month") {
      // Month view: Show years as headers, months as periods
      let currentYear = ""
      let yearSpan = 0

      current = getStartOfMonth(current)

      while (current <= end) {
        const year = current.getFullYear().toString()

        if (year !== currentYear) {
          if (yearSpan > 0) {
            timeHeaders.push({ label: currentYear, span: yearSpan })
          }
          currentYear = year
          yearSpan = 0
        }

        yearSpan++
        periods.push({
          date: new Date(current),
          label: current.toLocaleDateString("en", { month: "short" }),
          subLabel: current.getFullYear().toString().slice(-2),
        })

        current = addMonths(current, 1)
      }

      if (yearSpan > 0) {
        timeHeaders.push({ label: currentYear, span: yearSpan })
      }
    } else if (timescale === "quarter") {
      // Quarter view: Show years as headers, quarters as periods
      let currentYear = ""
      let yearSpan = 0

      current = getStartOfQuarter(current)

      while (current <= end) {
        const year = current.getFullYear().toString()

        if (year !== currentYear) {
          if (yearSpan > 0) {
            timeHeaders.push({ label: currentYear, span: yearSpan })
          }
          currentYear = year
          yearSpan = 0
        }

        yearSpan++
        const quarter = Math.floor(current.getMonth() / 3) + 1
        periods.push({
          date: new Date(current),
          label: `Q${quarter}`,
          subLabel: current.getFullYear().toString(),
        })

        current = addQuarters(current, 1)
      }

      if (yearSpan > 0) {
        timeHeaders.push({ label: currentYear, span: yearSpan })
      }
    }

    return { periods, timeHeaders }
  }

  const { periods, timeHeaders } = getPeriods()

  return (
    <div className={cn("relative h-full", className)}>
      {/* Time header (year/month/etc) */}
      <div className="flex h-8 border-b bg-muted/70">
        {timeHeaders.map((header, i) => (
          <div
            key={i}
            className="border-r text-xs font-semibold p-1 text-center flex items-center justify-center"
            style={{ flex: header.span }}
          >
            {header.label}
          </div>
        ))}
      </div>

      {/* Timescale periods */}
      <div className="flex h-12 border-b bg-muted/50">
        {periods.map((period, i) => {
          const isWeekend = timescale === "day" && (period.date.getDay() === 0 || period.date.getDay() === 6)
          return (
            <div
              key={i}
              className={cn(
                "flex-1 border-r text-xs p-1 text-center",
                isWeekend && "bg-muted/70"
              )}
            >
              <div className="font-medium">{period.label}</div>
              {period.subLabel && (
                <div className="text-muted-foreground">{period.subLabel}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Helper to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
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

  // Check if this is a milestone (same start and end date)
  const isMilestone = task.startAt.toDateString() === task.endAt.toDateString()

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

  // Render milestone icon for tasks with same start and end date
  if (isMilestone) {
    return (
      <div
        className="absolute cursor-pointer transition-opacity hover:opacity-80 flex items-center justify-center"
        style={{
          left: `${Math.max(0, leftPercent)}%`,
          opacity: isDragging ? 0.7 : 1,
          transform: 'translateX(-50%)',
        }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
        onClick={() => onTaskClick?.(task)}
        title={`${task.name}\n${task.startAt.toLocaleDateString()}`}
      >
        <Diamond
          className="w-8 h-8"
          fill={backgroundColor}
          stroke={backgroundColor}
          strokeWidth={2}
        />
        <span
          className="absolute text-xs font-bold whitespace-nowrap"
          style={{
            left: '100%',
            marginLeft: '8px',
            color: backgroundColor,
          }}
        >
          {task.name}
        </span>
      </div>
    )
  }

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
  const { tasks, viewStart, viewEnd, timescale, setViewRange, setTimescale } = useGantt()
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Handle scroll events for shift+scroll (horizontal pan) and ctrl+scroll (zoom)
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      // Only handle wheel events with modifiers (shift or ctrl/cmd)
      // Let normal scrolling work naturally for better performance
      const hasModifiers = e.shiftKey || e.ctrlKey || e.metaKey
      if (!hasModifiers) {
        return // Allow default scroll behavior
      }

      // Shift+scroll for horizontal panning
      if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()

        // Calculate the shift amount based on scroll delta
        const scrollDays = Math.round(e.deltaY / 10)
        const shift = scrollDays * 24 * 60 * 60 * 1000

        setViewRange(
          new Date(viewStart.getTime() + shift),
          new Date(viewEnd.getTime() + shift)
        )
      }
      // Ctrl+scroll for zooming (changing timescale)
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault()

        const scales: TimescaleType[] = ["day", "week", "month", "quarter"]
        const currentIndex = scales.indexOf(timescale)

        if (e.deltaY < 0 && currentIndex > 0) {
          // Zoom in (scroll up)
          setTimescale(scales[currentIndex - 1])
        } else if (e.deltaY > 0 && currentIndex < scales.length - 1) {
          // Zoom out (scroll down)
          setTimescale(scales[currentIndex + 1])
        }
      }
    }

    container.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      container.removeEventListener("wheel", handleWheel)
    }
  }, [viewStart, viewEnd, timescale, setViewRange, setTimescale])

  // Calculate minimum width for timeline to ensure proper scrolling
  const totalDays = (viewEnd.getTime() - viewStart.getTime()) / (24 * 60 * 60 * 1000)
  const minWidthPx = Math.max(1200, totalDays * 40) // Minimum 40px per day, at least 1200px

  return (
    <div ref={containerRef} className={cn("relative overflow-x-auto", className)}>
      <div style={{ minWidth: `${minWidthPx}px` }}>
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
