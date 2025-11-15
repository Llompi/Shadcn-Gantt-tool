'use client'

import * as React from 'react'
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion'
import { cn } from '@/lib/utils'
import { GanttTask, TimescaleType } from './gantt'

interface GanttCanvasProps {
  tasks: GanttTask[]
  viewStart: Date
  viewEnd: Date
  timescale: TimescaleType
  onViewChange: (start: Date, end: Date) => void
  onTaskMove?: (taskId: string, startAt: Date, endAt: Date) => Promise<void>
  onTaskClick?: (task: GanttTask) => void
  className?: string
}

interface ViewTransform {
  scale: number
  offsetX: number
  offsetY: number
}

// Physics constants for smooth scrolling (Apple-like feel)
const PHYSICS = {
  momentum: {
    friction: 0.92, // Higher = more glide
    threshold: 0.5, // Minimum velocity to continue momentum
    maxVelocity: 50, // Maximum pixels per frame
  },
  spring: {
    stiffness: 300,
    damping: 30,
    mass: 0.5,
  },
  zoom: {
    min: 0.1,
    max: 4,
    sensitivity: 0.001,
    stepSensitivity: 0.15,
  },
  boundaries: {
    elastic: 0.15, // Rubber band effect strength
    snapBack: 0.3, // How quickly to snap back from boundary
  },
}

export function GanttCanvas({
  tasks,
  viewStart,
  viewEnd,
  timescale,
  onViewChange,
  onTaskMove,
  onTaskClick,
  className,
}: GanttCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })

  // Transform state with smooth spring physics
  const scale = useMotionValue(1)
  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)

  // Smooth springs for all transforms
  const smoothScale = useSpring(scale, PHYSICS.spring)
  const smoothOffsetX = useSpring(offsetX, PHYSICS.spring)
  const smoothOffsetY = useSpring(offsetY, PHYSICS.spring)

  // Interaction state
  const [isPanning, setIsPanning] = React.useState(false)
  const [isSpacePressed, setIsSpacePressed] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })
  const velocityRef = React.useRef({ x: 0, y: 0 })
  const lastMouseRef = React.useRef({ x: 0, y: 0, time: 0 })
  const momentumRef = React.useRef<number | null>(null)

  // Task interaction state
  const [draggedTask, setDraggedTask] = React.useState<string | null>(null)
  const [hoveredTask, setHoveredTask] = React.useState<string | null>(null)

  // Measure container dimensions
  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Keyboard handlers for space key (pan mode)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !isSpacePressed) {
        e.preventDefault()
        setIsSpacePressed(true)
        document.body.style.cursor = 'grab'
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(false)
        document.body.style.cursor = ''
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      document.body.style.cursor = ''
    }
  }, [isSpacePressed])

  // Momentum scrolling animation
  const startMomentum = React.useCallback(() => {
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current)
    }

    const animate = () => {
      const vx = velocityRef.current.x
      const vy = velocityRef.current.y

      // Apply friction
      velocityRef.current.x *= PHYSICS.momentum.friction
      velocityRef.current.y *= PHYSICS.momentum.friction

      // Stop if velocity is too low
      if (Math.abs(vx) < PHYSICS.momentum.threshold && Math.abs(vy) < PHYSICS.momentum.threshold) {
        velocityRef.current = { x: 0, y: 0 }
        momentumRef.current = null
        return
      }

      // Apply momentum
      offsetX.set(offsetX.get() + velocityRef.current.x)
      offsetY.set(offsetY.get() + velocityRef.current.y)

      // Continue animation
      momentumRef.current = requestAnimationFrame(animate)
    }

    momentumRef.current = requestAnimationFrame(animate)
  }, [offsetX, offsetY])

  // Handle wheel events (scroll and zoom)
  const handleWheel = React.useCallback(
    (e: WheelEvent) => {
      e.preventDefault()

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Ctrl/Cmd + scroll = zoom (Figma-style: zoom to cursor)
      if (e.ctrlKey || e.metaKey) {
        const currentScale = scale.get()
        const delta = -e.deltaY * PHYSICS.zoom.sensitivity

        // Calculate new scale with limits
        let newScale = currentScale * (1 + delta)
        newScale = Math.max(PHYSICS.zoom.min, Math.min(PHYSICS.zoom.max, newScale))

        // Zoom to cursor position (Figma-style)
        const currentOffsetX = offsetX.get()
        const currentOffsetY = offsetY.get()

        // Calculate the point under the cursor in the scaled coordinate space
        const pointX = (mouseX - currentOffsetX) / currentScale
        const pointY = (mouseY - currentOffsetY) / currentScale

        // Calculate new offset to keep the point under the cursor
        const newOffsetX = mouseX - pointX * newScale
        const newOffsetY = mouseY - pointY * newScale

        scale.set(newScale)
        offsetX.set(newOffsetX)
        offsetY.set(newOffsetY)
      }
      // Shift + scroll = horizontal pan
      else if (e.shiftKey) {
        offsetX.set(offsetX.get() - e.deltaY)
        velocityRef.current = { x: -e.deltaY * 0.3, y: 0 }
        startMomentum()
      }
      // Regular scroll = vertical pan
      else {
        offsetX.set(offsetX.get() - e.deltaX)
        offsetY.set(offsetY.get() - e.deltaY)

        // Calculate velocity for momentum
        velocityRef.current = {
          x: -e.deltaX * 0.3,
          y: -e.deltaY * 0.3,
        }
        startMomentum()
      }
    },
    [scale, offsetX, offsetY, startMomentum]
  )

  // Handle mouse down (start pan)
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return // Only left click

      // Space + click = pan mode
      if (isSpacePressed) {
        setIsPanning(true)
        setDragStart({ x: e.clientX, y: e.clientY })
        lastMouseRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }
        document.body.style.cursor = 'grabbing'
        velocityRef.current = { x: 0, y: 0 }

        if (momentumRef.current) {
          cancelAnimationFrame(momentumRef.current)
          momentumRef.current = null
        }
      }
    },
    [isSpacePressed]
  )

  // Handle mouse move (pan and calculate velocity)
  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) {
        // Update hover state
        // (Task hover detection would go here)
        return
      }

      const currentX = e.clientX
      const currentY = e.clientY
      const currentTime = Date.now()

      const deltaX = currentX - dragStart.x
      const deltaY = currentY - dragStart.y

      offsetX.set(offsetX.get() + (currentX - lastMouseRef.current.x))
      offsetY.set(offsetY.get() + (currentY - lastMouseRef.current.y))

      // Calculate velocity for momentum
      const timeDelta = currentTime - lastMouseRef.current.time
      if (timeDelta > 0) {
        velocityRef.current = {
          x: (currentX - lastMouseRef.current.x) / timeDelta * 16, // Normalize to 60fps
          y: (currentY - lastMouseRef.current.y) / timeDelta * 16,
        }

        // Clamp velocity
        velocityRef.current.x = Math.max(
          -PHYSICS.momentum.maxVelocity,
          Math.min(PHYSICS.momentum.maxVelocity, velocityRef.current.x)
        )
        velocityRef.current.y = Math.max(
          -PHYSICS.momentum.maxVelocity,
          Math.min(PHYSICS.momentum.maxVelocity, velocityRef.current.y)
        )
      }

      lastMouseRef.current = { x: currentX, y: currentY, time: currentTime }
      setDragStart({ x: currentX, y: currentY })
    },
    [isPanning, dragStart, offsetX, offsetY]
  )

  // Handle mouse up (end pan, start momentum)
  const handleMouseUp = React.useCallback(() => {
    if (isPanning) {
      setIsPanning(false)
      document.body.style.cursor = isSpacePressed ? 'grab' : ''

      // Start momentum if velocity is significant
      const speed = Math.sqrt(
        velocityRef.current.x ** 2 + velocityRef.current.y ** 2
      )

      if (speed > PHYSICS.momentum.threshold) {
        startMomentum()
      }
    }
  }, [isPanning, isSpacePressed, startMomentum])

  // Pinch zoom support (trackpad)
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let lastScale = 1

    const handleGestureStart = (e: Event) => {
      e.preventDefault()
      lastScale = 1
    }

    const handleGestureChange = (e: Event) => {
      e.preventDefault()
      const gestureEvent = e as unknown as { scale: number }

      const delta = gestureEvent.scale - lastScale
      const currentScale = scale.get()
      let newScale = currentScale * (1 + delta)

      newScale = Math.max(PHYSICS.zoom.min, Math.min(PHYSICS.zoom.max, newScale))
      scale.set(newScale)

      lastScale = gestureEvent.scale
    }

    const handleGestureEnd = (e: Event) => {
      e.preventDefault()
    }

    container.addEventListener('gesturestart', handleGestureStart)
    container.addEventListener('gesturechange', handleGestureChange)
    container.addEventListener('gestureend', handleGestureEnd)

    return () => {
      container.removeEventListener('gesturestart', handleGestureStart)
      container.removeEventListener('gesturechange', handleGestureChange)
      container.removeEventListener('gestureend', handleGestureEnd)
    }
  }, [scale])

  // Attach wheel event listener
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Calculate timeline dimensions and grid
  const totalDays = React.useMemo(() => {
    return (viewEnd.getTime() - viewStart.getTime()) / (24 * 60 * 60 * 1000)
  }, [viewStart, viewEnd])

  const dayWidth = React.useMemo(() => {
    // Dynamic day width based on zoom level
    const baseWidth = Math.max(dimensions.width / totalDays, 40)
    return baseWidth
  }, [dimensions.width, totalDays])

  // Render tasks
  const renderTasks = () => {
    if (tasks.length === 0) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="text-muted-foreground text-lg">No tasks to display</div>
            <div className="text-muted-foreground text-sm">Add tasks to get started</div>
          </div>
        </div>
      )
    }

    return tasks.map((task, index) => {
      const startOffset = (task.startAt.getTime() - viewStart.getTime()) / (24 * 60 * 60 * 1000)
      const duration = (task.endAt.getTime() - task.startAt.getTime()) / (24 * 60 * 60 * 1000)

      const x = startOffset * dayWidth
      const y = index * 60 + 40 // 60px per row, 40px offset for header
      const width = Math.max(duration * dayWidth, 20) // Minimum 20px width

      const isHovered = hoveredTask === task.id
      const isDragged = draggedTask === task.id

      return (
        <motion.div
          key={task.id}
          className={cn(
            'absolute rounded-lg cursor-pointer transition-shadow',
            isHovered && 'shadow-lg ring-2 ring-primary/50',
            isDragged && 'opacity-50'
          )}
          style={{
            left: x,
            top: y,
            width,
            height: 40,
            backgroundColor: task.status?.color || '#3b82f6',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onMouseEnter={() => setHoveredTask(task.id)}
          onMouseLeave={() => setHoveredTask(null)}
          onClick={() => onTaskClick?.(task)}
        >
          <div className="px-3 py-2 text-xs text-white font-medium truncate flex items-center h-full">
            {task.name}
          </div>

          {/* Progress bar */}
          {task.progress !== undefined && task.progress > 0 && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-white/40 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${task.progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </motion.div>
      )
    })
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full overflow-hidden bg-background',
        isPanning && 'cursor-grabbing',
        isSpacePressed && !isPanning && 'cursor-grab',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Zoom indicator */}
      <motion.div
        className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-background/80 backdrop-blur-sm border text-xs font-medium z-50"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {Math.round(smoothScale.get() * 100)}%
      </motion.div>

      {/* Canvas content with transforms */}
      <motion.div
        className="absolute inset-0"
        style={{
          x: smoothOffsetX,
          y: smoothOffsetY,
          scale: smoothScale,
          transformOrigin: '0 0',
        }}
      >
        {/* Timeline grid background */}
        <div className="absolute inset-0 pointer-events-none">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern
                id="grid"
                width={dayWidth}
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${dayWidth} 0 L 0 0 0 60`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border/30"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Today indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
          style={{
            left: ((Date.now() - viewStart.getTime()) / (24 * 60 * 60 * 1000)) * dayWidth,
          }}
        >
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full shadow-lg" />
        </div>

        {/* Tasks */}
        <div className="relative">
          {renderTasks()}
        </div>
      </motion.div>

      {/* Instructions overlay (shows when empty or first time) */}
      {tasks.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border text-xs text-muted-foreground z-50 pointer-events-none">
          <span className="font-medium">Tip:</span> Space + drag to pan • Ctrl + scroll to zoom • Shift + scroll to pan horizontally
        </div>
      )}
    </div>
  )
}
