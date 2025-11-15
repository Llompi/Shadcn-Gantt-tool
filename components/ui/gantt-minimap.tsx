'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Task } from '@/types/task'
import { X } from 'lucide-react'

interface GanttMinimapProps {
  tasks: Task[]
  viewportStart: Date
  viewportEnd: Date
  onViewportChange: (start: Date, end: Date) => void
  onClose: () => void
}

export function GanttMinimap({
  tasks,
  viewportStart,
  viewportEnd,
  onViewportChange,
  onClose,
}: GanttMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dimensions] = useState({ width: 300, height: 150 })

  // Calculate the full date range of all tasks
  const getDateRange = () => {
    if (tasks.length === 0) {
      return { start: new Date(), end: new Date() }
    }

    let minDate = tasks[0].startAt
    let maxDate = tasks[0].endAt

    tasks.forEach((task) => {
      if (task.startAt < minDate) minDate = task.startAt
      if (task.endAt > maxDate) maxDate = task.endAt
    })

    // Add padding
    const padding = (maxDate.getTime() - minDate.getTime()) * 0.1
    return {
      start: new Date(minDate.getTime() - padding),
      end: new Date(maxDate.getTime() + padding),
    }
  }

  const dateRange = getDateRange()

  const drawMinimap = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensions
    const dpr = window.devicePixelRatio || 1

    // Set canvas size
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
    ctx.fillRect(0, 0, width, height)

    const timeSpan = dateRange.end.getTime() - dateRange.start.getTime()
    const rowHeight = height / Math.max(tasks.length, 1)

    // Draw tasks
    tasks.forEach((task, index) => {
      const taskStart =
        ((task.startAt.getTime() - dateRange.start.getTime()) / timeSpan) * width
      const taskEnd =
        ((task.endAt.getTime() - dateRange.start.getTime()) / timeSpan) * width
      const taskWidth = Math.max(taskEnd - taskStart, 2)

      // Task bar
      ctx.fillStyle = task.status?.color || '#3b82f6'
      ctx.globalAlpha = 0.7
      ctx.fillRect(taskStart, index * rowHeight, taskWidth, rowHeight - 1)
      ctx.globalAlpha = 1
    })

    // Draw viewport indicator
    const viewportStartX =
      ((viewportStart.getTime() - dateRange.start.getTime()) / timeSpan) * width
    const viewportEndX =
      ((viewportEnd.getTime() - dateRange.start.getTime()) / timeSpan) * width
    const viewportWidth = viewportEndX - viewportStartX

    // Viewport overlay (darken outside viewport)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(0, 0, viewportStartX, height)
    ctx.fillRect(viewportEndX, 0, width - viewportEndX, height)

    // Viewport border
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.strokeRect(viewportStartX, 0, viewportWidth, height)

    // Drag handles
    ctx.fillStyle = '#3b82f6'
    const handleWidth = 8
    const handleHeight = 30
    const handleY = (height - handleHeight) / 2

    ctx.fillRect(viewportStartX - handleWidth / 2, handleY, handleWidth, handleHeight)
    ctx.fillRect(viewportEndX - handleWidth / 2, handleY, handleWidth, handleHeight)
  }, [tasks, viewportStart, viewportEnd, dimensions, dateRange])

  useEffect(() => {
    drawMinimap()
  }, [drawMinimap])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    handleMouseMove(e)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging && e.buttons !== 1) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = x / dimensions.width

    const timeSpan = dateRange.end.getTime() - dateRange.start.getTime()
    const viewportSpan = viewportEnd.getTime() - viewportStart.getTime()

    const newCenter = new Date(dateRange.start.getTime() + timeSpan * ratio)

    const newStart = new Date(newCenter.getTime() - viewportSpan / 2)
    const newEnd = new Date(newCenter.getTime() + viewportSpan / 2)

    onViewportChange(newStart, newEnd)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="fixed bottom-8 right-8 glass-card p-4 rounded-2xl shadow-smooth-lg z-50 animate-scale-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Minimap</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="rounded-lg cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Click and drag to navigate
      </div>
    </div>
  )
}
