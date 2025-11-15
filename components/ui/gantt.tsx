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
  // Initialize view to show time before and after today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewStart, setViewStart] = React.useState<Date>(
    defaultViewStart || new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  )
  const [viewEnd, setViewEnd] = React.useState<Date>(
    defaultViewEnd || new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
  )
  const [timescale, setTimescale] = React.useState<TimescaleType>(defaultTimescale)

  const setViewRange = React.useCallback((start: Date, end: Date) => {
    setViewStart(start)
    setViewEnd(end)
  }, [])

  // Adjust view range when timescale changes to preserve current viewport
  React.useEffect(() => {
    // Calculate the center of the current viewport
    const viewportCenter = new Date((viewStart.getTime() + viewEnd.getTime()) / 2)

    let newStart: Date
    let newEnd: Date

    switch (timescale) {
      case "day":
        // Show 30 days before and 60 days after viewport center
        newStart = new Date(viewportCenter.getTime() - 30 * 24 * 60 * 60 * 1000)
        newEnd = new Date(viewportCenter.getTime() + 60 * 24 * 60 * 60 * 1000)
        break
      case "week":
        // Show 12 weeks before and 24 weeks after viewport center, aligned to week start
        const weekStart = getStartOfWeek(viewportCenter)
        newStart = addWeeks(weekStart, -12)
        newEnd = addWeeks(weekStart, 24)
        break
      case "month":
        // Show 6 months before and 12 months after viewport center, aligned to month start
        const monthStart = getStartOfMonth(viewportCenter)
        newStart = addMonths(monthStart, -6)
        newEnd = addMonths(monthStart, 12)
        break
      case "quarter":
        // Show 4 quarters before and 8 quarters after viewport center, aligned to quarter start
        const quarterStart = getStartOfQuarter(viewportCenter)
        newStart = addQuarters(quarterStart, -4)
        newEnd = addQuarters(quarterStart, 8)
        break
      default:
        return
    }

    setViewStart(newStart)
    setViewEnd(newEnd)
    // Only run when timescale changes, not when viewStart/viewEnd change (would cause infinite loop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Calculate center point for smooth transition
    const today = Date.now()
    const rangeMs = 90 * 24 * 60 * 60 * 1000 // 90 days total range
    setViewRange(
      new Date(today - 30 * 24 * 60 * 60 * 1000),
      new Date(today + 60 * 24 * 60 * 60 * 1000)
    )
  }

  const goToToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today

    // Calculate new range based on current timescale
    let newStart: Date
    let newEnd: Date

    switch (timescale) {
      case "day":
        // Show 30 days before and 60 days after today
        newStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        newEnd = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
        break
      case "week":
        // Show 12 weeks before and 24 weeks after today
        const weekStart = getStartOfWeek(today)
        newStart = addWeeks(weekStart, -12)
        newEnd = addWeeks(weekStart, 24)
        break
      case "month":
        // Show 6 months before and 12 months after today
        const monthStart = getStartOfMonth(today)
        newStart = addMonths(monthStart, -6)
        newEnd = addMonths(monthStart, 12)
        break
      case "quarter":
        // Show 4 quarters before and 8 quarters after today
        const quarterStart = getStartOfQuarter(today)
        newStart = addQuarters(quarterStart, -4)
        newEnd = addQuarters(quarterStart, 8)
        break
      default:
        // Fallback: keep current range but center on today
        const currentRange = viewEnd.getTime() - viewStart.getTime()
        const halfRange = currentRange / 2
        newStart = new Date(today.getTime() - halfRange)
        newEnd = new Date(today.getTime() + halfRange)
    }

    setViewRange(newStart, newEnd)
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
            onClick={goToToday}
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
function TimelineGrid({ className, dayWidth }: { className?: string; dayWidth: number }) {
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

  // Calculate pixel widths for periods based on dayWidth and timescale
  const getPeriodWidth = () => {
    switch (timescale) {
      case 'day':
        return dayWidth // Each day column
      case 'week':
        return dayWidth * 7 // Each week column (7 days)
      case 'month':
        return dayWidth * 30 // Approximate month (30 days)
      case 'quarter':
        return dayWidth * 90 // Approximate quarter (90 days)
      default:
        return dayWidth
    }
  }

  const periodWidthPx = getPeriodWidth()

  return (
    <div className={cn("relative h-full", className)}>
      {/* Time header (year/month/etc) */}
      <div className="flex h-8 border-b bg-muted/70">
        {timeHeaders.map((header, i) => (
          <div
            key={i}
            className="border-r text-xs font-semibold p-1 text-center flex items-center justify-center"
            style={{ width: `${header.span * periodWidthPx}px`, minWidth: `${header.span * periodWidthPx}px` }}
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
                "border-r text-xs p-1 text-center",
                isWeekend && "bg-muted/70"
              )}
              style={{ width: `${periodWidthPx}px`, minWidth: `${periodWidthPx}px` }}
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

// Today Marker - now rendered inline in GanttFeatureList for proper positioning

// Feature Item (Task Bar)
export function GanttFeatureItem({ task, dayWidth }: { task: GanttTask; dayWidth: number }) {
  const { viewStart, viewEnd, onTaskMove, onTaskClick } = useGantt()
  const [isDragging, setIsDragging] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState<"start" | "end" | null>(null)
  const [dragOffset, setDragOffset] = React.useState({ start: 0, end: 0 })
  const [isHovered, setIsHovered] = React.useState(false)
  const [previewPosition, setPreviewPosition] = React.useState<{ left: number; width: number } | null>(null)

  const totalDays = (viewEnd.getTime() - viewStart.getTime()) / (24 * 60 * 60 * 1000)
  const startOffset = (task.startAt.getTime() - viewStart.getTime()) / (24 * 60 * 60 * 1000)
  const duration = (task.endAt.getTime() - task.startAt.getTime()) / (24 * 60 * 60 * 1000)

  // Use pixel-based positioning for proper scaling
  const leftPx = startOffset * dayWidth
  const widthPx = Math.max(duration * dayWidth, 20) // Minimum 20px width

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
    if (!isDragging && !isResizing) {
      setPreviewPosition(null)
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById("gantt-timeline-container")
      if (!container) return

      const rect = container.getBoundingClientRect()
      const relativeX = e.clientX - rect.left + container.parentElement!.scrollLeft

      if (isDragging) {
        // Calculate preview position while dragging
        const newLeft = Math.max(0, relativeX - dragOffset.start)
        setPreviewPosition({ left: newLeft, width: widthPx })
      } else if (isResizing === "start") {
        // Calculate preview while resizing start
        const newLeft = Math.max(0, relativeX)
        const newWidth = Math.max(20, leftPx + widthPx - newLeft)
        setPreviewPosition({ left: newLeft, width: newWidth })
      } else if (isResizing === "end") {
        // Calculate preview while resizing end
        const newWidth = Math.max(20, relativeX - leftPx)
        setPreviewPosition({ left: leftPx, width: newWidth })
      }
    }

    const handleMouseUp = async (e: MouseEvent) => {
      if (isDragging || isResizing) {
        const container = document.getElementById("gantt-timeline-container")
        if (!container) return

        const rect = container.getBoundingClientRect()
        const relativeX = e.clientX - rect.left + container.parentElement!.scrollLeft
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
      setPreviewPosition(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, dragOffset, task, totalDays, viewStart, onTaskMove, dayWidth, leftPx, widthPx])

  const backgroundColor = task.status?.color || "#3b82f6"

  // Render milestone icon for tasks with same start and end date
  if (isMilestone) {
    return (
      <div
        className={cn(
          "absolute cursor-pointer flex items-center justify-center transition-all duration-200 ease-out",
          isHovered && "scale-110 drop-shadow-lg"
        )}
        style={{
          left: `${leftPx}px`,
          opacity: isDragging ? 0.7 : 1,
          transform: 'translateX(-50%)',
        }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onTaskClick?.(task)}
        title={`${task.name}\n${task.startAt.toLocaleDateString()}`}
      >
        <Diamond
          className={cn(
            "w-8 h-8 transition-all duration-200",
            isHovered && "drop-shadow-md"
          )}
          fill={backgroundColor}
          stroke={backgroundColor}
          strokeWidth={2}
        />
        <span
          className={cn(
            "absolute text-xs font-bold whitespace-nowrap transition-all duration-200",
            isHovered && "font-extrabold"
          )}
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
    <>
      {/* Main task bar */}
      <div
        className={cn(
          "absolute h-8 rounded cursor-move transition-all duration-200 ease-out",
          isHovered && !isDragging && !isResizing && "shadow-lg ring-2 ring-white/30 scale-105 -translate-y-0.5",
          (isDragging || isResizing) && "opacity-30"
        )}
        style={{
          left: `${leftPx}px`,
          width: `${widthPx}px`,
          backgroundColor,
        }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onTaskClick?.(task)}
        title={`${task.name}\n${task.startAt.toLocaleDateString()} - ${task.endAt.toLocaleDateString()}`}
      >
        {/* Resize handle - start */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize transition-colors",
            isHovered ? "bg-white/20" : "bg-transparent"
          )}
          onMouseDown={(e) => handleMouseDown(e, "resize-start")}
        />

        <div className="px-2 py-1 text-xs text-white font-medium truncate flex items-center h-full">
          {task.name}
        </div>

        {/* Progress bar */}
        {task.progress !== undefined && task.progress > 0 && (
          <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/60 transition-all duration-500 ease-out"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        )}

        {/* Resize handle - end */}
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize transition-colors",
            isHovered ? "bg-white/20" : "bg-transparent"
          )}
          onMouseDown={(e) => handleMouseDown(e, "resize-end")}
        />
      </div>

      {/* Preview/ghost while dragging or resizing */}
      {previewPosition && (isDragging || isResizing) && (
        <div
          className="absolute h-8 rounded pointer-events-none z-30 shadow-2xl ring-2 ring-white/50"
          style={{
            left: `${previewPosition.left}px`,
            width: `${previewPosition.width}px`,
            backgroundColor,
            opacity: 0.8,
          }}
        >
          <div className="px-2 py-1 text-xs text-white font-bold truncate flex items-center h-full">
            {task.name}
          </div>

          {/* Date tooltip */}
          <div className="absolute -top-8 left-0 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap shadow-lg">
            {isDragging && 'Moving...'}
            {isResizing === 'start' && 'Resize start'}
            {isResizing === 'end' && 'Resize end'}
          </div>
        </div>
      )}
    </>
  )
}

// Feature List (Container for tasks)
export function GanttFeatureList({ className }: { className?: string }) {
  const { tasks, viewStart, viewEnd, timescale, setTimescale, setViewRange } = useGantt()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const scrollVelocityRef = React.useRef({ x: 0, y: 0 })
  const lastScrollRef = React.useRef({ x: 0, y: 0, time: 0 })
  const momentumFrameRef = React.useRef<number | null>(null)
  const [isSpacePressed, setIsSpacePressed] = React.useState(false)
  const [isPanning, setIsPanning] = React.useState(false)
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0, scrollX: 0, scrollY: 0 })

  // Smooth momentum scrolling
  const startMomentumScroll = React.useCallback(() => {
    if (momentumFrameRef.current) {
      cancelAnimationFrame(momentumFrameRef.current)
    }

    const container = containerRef.current
    if (!container) return

    const animate = () => {
      const friction = 0.92 // Apple-like friction
      const threshold = 0.5

      scrollVelocityRef.current.x *= friction
      scrollVelocityRef.current.y *= friction

      if (
        Math.abs(scrollVelocityRef.current.x) < threshold &&
        Math.abs(scrollVelocityRef.current.y) < threshold
      ) {
        scrollVelocityRef.current = { x: 0, y: 0 }
        momentumFrameRef.current = null
        return
      }

      container.scrollLeft += scrollVelocityRef.current.x
      container.scrollTop += scrollVelocityRef.current.y

      momentumFrameRef.current = requestAnimationFrame(animate)
    }

    momentumFrameRef.current = requestAnimationFrame(animate)
  }, [])

  // Space key for pan mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setIsSpacePressed(true)
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grab'
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(false)
        if (containerRef.current && !isPanning) {
          containerRef.current.style.cursor = ''
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPanning])

  // Mouse pan with space key
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (isSpacePressed && e.button === 0) {
        e.preventDefault()
        setIsPanning(true)
        const container = containerRef.current
        if (container) {
          container.style.cursor = 'grabbing'
          setPanStart({
            x: e.clientX,
            y: e.clientY,
            scrollX: container.scrollLeft,
            scrollY: container.scrollTop,
          })
          lastScrollRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }
          scrollVelocityRef.current = { x: 0, y: 0 }
        }
      }
    },
    [isSpacePressed]
  )

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        const container = containerRef.current
        if (!container) return

        const deltaX = e.clientX - panStart.x
        const deltaY = e.clientY - panStart.y

        container.scrollLeft = panStart.scrollX - deltaX
        container.scrollTop = panStart.scrollY - deltaY

        // Calculate velocity for momentum
        const currentTime = Date.now()
        const timeDelta = currentTime - lastScrollRef.current.time

        if (timeDelta > 0) {
          scrollVelocityRef.current = {
            x: -(e.clientX - lastScrollRef.current.x) / timeDelta * 16,
            y: -(e.clientY - lastScrollRef.current.y) / timeDelta * 16,
          }
        }

        lastScrollRef.current = { x: e.clientX, y: e.clientY, time: currentTime }
      }
    },
    [isPanning, panStart]
  )

  const handleMouseUp = React.useCallback(() => {
    if (isPanning) {
      setIsPanning(false)
      const container = containerRef.current
      if (container) {
        container.style.cursor = isSpacePressed ? 'grab' : ''

        // Start momentum
        const speed = Math.sqrt(
          scrollVelocityRef.current.x ** 2 + scrollVelocityRef.current.y ** 2
        )

        if (speed > 0.5) {
          startMomentumScroll()
        }
      }
    }
  }, [isPanning, isSpacePressed, startMomentumScroll])

  // Track zoom accumulation for smooth zooming
  const zoomAccumulatorRef = React.useRef(0)
  const zoomTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Handle scroll events for shift+scroll (horizontal pan) and ctrl+scroll (zoom)
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      // Shift+scroll for horizontal scrolling (smooth)
      if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        // Directly scroll horizontally
        const scrollAmount = e.deltaY || e.deltaX
        container.scrollLeft += scrollAmount
        scrollVelocityRef.current = { x: scrollAmount * 0.3, y: 0 }
        startMomentumScroll()
      }
      // Ctrl+scroll for zooming (changing timescale) - smooth zoom with accumulation
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault()

        // Accumulate zoom delta for smoother feel
        zoomAccumulatorRef.current += e.deltaY

        // Clear existing timeout
        if (zoomTimeoutRef.current) {
          clearTimeout(zoomTimeoutRef.current)
        }

        // Threshold for triggering zoom change (makes it less sensitive)
        const threshold = 100

        if (Math.abs(zoomAccumulatorRef.current) >= threshold) {
          const scales: TimescaleType[] = ["day", "week", "month", "quarter"]
          const currentIndex = scales.indexOf(timescale)

          if (zoomAccumulatorRef.current < 0 && currentIndex > 0) {
            setTimescale(scales[currentIndex - 1])
            zoomAccumulatorRef.current = 0
          } else if (zoomAccumulatorRef.current > 0 && currentIndex < scales.length - 1) {
            setTimescale(scales[currentIndex + 1])
            zoomAccumulatorRef.current = 0
          }
        }

        // Reset accumulator after brief pause
        zoomTimeoutRef.current = setTimeout(() => {
          zoomAccumulatorRef.current = 0
        }, 200)
      }
      // Regular scroll - add momentum
      else if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        scrollVelocityRef.current = { x: e.deltaX * 0.2, y: e.deltaY * 0.2 }
        // Natural scrolling with slight momentum enhancement
        setTimeout(() => {
          if (Math.abs(scrollVelocityRef.current.x) > 1 || Math.abs(scrollVelocityRef.current.y) > 1) {
            startMomentumScroll()
          }
        }, 50)
      }
    }

    container.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      container.removeEventListener("wheel", handleWheel)
      if (momentumFrameRef.current) {
        cancelAnimationFrame(momentumFrameRef.current)
      }
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current)
      }
    }
  }, [timescale, setTimescale, startMomentumScroll])

  // Calculate day width based on timescale for proper zoom scaling
  const totalDays = (viewEnd.getTime() - viewStart.getTime()) / (24 * 60 * 60 * 1000)

  // Dynamic day width based on timescale (zoom level)
  const dayWidth = React.useMemo(() => {
    switch (timescale) {
      case 'day':
        return 80 // 80px per day for day view (zoomed in)
      case 'week':
        return 40 // 40px per day for week view
      case 'month':
        return 20 // 20px per day for month view
      case 'quarter':
        return 10 // 10px per day for quarter view (zoomed out)
      default:
        return 40
    }
  }, [timescale])

  const minWidthPx = totalDays * dayWidth

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-auto scroll-smooth gantt-scrollbar",
        isPanning && "select-none",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        scrollBehavior: momentumFrameRef.current ? 'auto' : 'smooth',
      }}
    >
      <div style={{ minWidth: `${minWidthPx}px`, position: 'relative' }}>
        <TimelineGrid dayWidth={dayWidth} />
        <div id="gantt-timeline-container" className="relative min-h-[400px] p-4 overflow-hidden">
          {/* Today line with proper positioning */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-20"
            style={{
              left: `${((Date.now() - viewStart.getTime()) / (24 * 60 * 60 * 1000)) * dayWidth}px`,
            }}
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full shadow-lg" />
            <div className="absolute top-0 left-2 text-xs font-bold text-red-500 whitespace-nowrap">
              Today
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-2">
                <div className="text-muted-foreground text-lg">No tasks to display</div>
                <div className="text-muted-foreground text-sm">
                  Add tasks to get started with your Gantt chart
                </div>
              </div>
            </div>
          ) : (
            <div>
              {tasks.map((task) => (
                <div key={task.id} className="relative border-b" style={{ height: '48px' }}>
                  <div className="absolute inset-y-0 left-0 right-0">
                    <GanttFeatureItem task={task} dayWidth={dayWidth} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interaction hints */}
      {tasks.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg bg-background/80 backdrop-blur-sm border text-xs text-muted-foreground pointer-events-none z-50 opacity-50 hover:opacity-100 transition-opacity">
          <span className="font-medium">Tips:</span> Space + drag to pan • Ctrl + scroll to zoom • Shift + scroll for horizontal
        </div>
      )}
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
