'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { TimescaleType } from '@/components/ui/gantt'

export interface GanttViewState {
  scale: number
  offsetX: number
  offsetY: number
  viewStart: Date
  viewEnd: Date
  timescale: TimescaleType
}

export interface GanttViewControls {
  // Transform controls
  setScale: (scale: number) => void
  setOffset: (x: number, y: number) => void
  zoomIn: () => void
  zoomOut: () => void
  zoomToFit: () => void
  zoomToSelection: (startDate: Date, endDate: Date) => void

  // View controls
  setViewRange: (start: Date, end: Date) => void
  setTimescale: (timescale: TimescaleType) => void
  panTo: (x: number, y: number, animated?: boolean) => void
  resetView: () => void

  // Date navigation
  goToToday: () => void
  goToDate: (date: Date) => void
  shiftView: (days: number) => void

  // State
  state: GanttViewState
}

interface UseGanttViewOptions {
  defaultViewStart?: Date
  defaultViewEnd?: Date
  defaultTimescale?: TimescaleType
  minScale?: number
  maxScale?: number
  onViewChange?: (state: GanttViewState) => void
}

const DEFAULT_OPTIONS: Required<UseGanttViewOptions> = {
  defaultViewStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  defaultViewEnd: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  defaultTimescale: 'day',
  minScale: 0.1,
  maxScale: 4,
  onViewChange: () => {},
}

export function useGanttView(options: UseGanttViewOptions = {}): GanttViewControls {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const [state, setState] = useState<GanttViewState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    viewStart: opts.defaultViewStart,
    viewEnd: opts.defaultViewEnd,
    timescale: opts.defaultTimescale,
  })

  const animationRef = useRef<number | null>(null)

  // Notify parent of view changes
  useEffect(() => {
    opts.onViewChange(state)
  }, [state, opts])

  // Transform controls
  const setScale = useCallback(
    (scale: number) => {
      const clampedScale = Math.max(opts.minScale, Math.min(opts.maxScale, scale))
      setState((prev) => ({ ...prev, scale: clampedScale }))
    },
    [opts.minScale, opts.maxScale]
  )

  const setOffset = useCallback((x: number, y: number) => {
    setState((prev) => ({ ...prev, offsetX: x, offsetY: y }))
  }, [])

  const zoomIn = useCallback(() => {
    setState((prev) => {
      const newScale = Math.min(opts.maxScale, prev.scale * 1.2)
      return { ...prev, scale: newScale }
    })
  }, [opts.maxScale])

  const zoomOut = useCallback(() => {
    setState((prev) => {
      const newScale = Math.max(opts.minScale, prev.scale / 1.2)
      return { ...prev, scale: newScale }
    })
  }, [opts.minScale])

  const zoomToFit = useCallback(() => {
    setState((prev) => ({
      ...prev,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    }))
  }, [])

  const zoomToSelection = useCallback((startDate: Date, endDate: Date) => {
    // Calculate the scale needed to fit the selection
    const duration = endDate.getTime() - startDate.getTime()
    const viewDuration = state.viewEnd.getTime() - state.viewStart.getTime()
    const scale = viewDuration / duration

    setState((prev) => ({
      ...prev,
      scale: Math.max(opts.minScale, Math.min(opts.maxScale, scale)),
      viewStart: startDate,
      viewEnd: endDate,
    }))
  }, [state.viewEnd, state.viewStart, opts.minScale, opts.maxScale])

  // View controls
  const setViewRange = useCallback((start: Date, end: Date) => {
    setState((prev) => ({
      ...prev,
      viewStart: start,
      viewEnd: end,
    }))
  }, [])

  const setTimescale = useCallback((timescale: TimescaleType) => {
    setState((prev) => {
      // Calculate new view range based on timescale
      const center = new Date((prev.viewStart.getTime() + prev.viewEnd.getTime()) / 2)

      let newStart: Date
      let newEnd: Date

      switch (timescale) {
        case 'day':
          newStart = new Date(center.getTime() - 30 * 24 * 60 * 60 * 1000)
          newEnd = new Date(center.getTime() + 60 * 24 * 60 * 60 * 1000)
          break
        case 'week':
          newStart = new Date(center.getTime() - 12 * 7 * 24 * 60 * 60 * 1000)
          newEnd = new Date(center.getTime() + 24 * 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          newStart = new Date(center.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
          newEnd = new Date(center.getTime() + 12 * 30 * 24 * 60 * 60 * 1000)
          break
        case 'quarter':
          newStart = new Date(center.getTime() - 4 * 90 * 24 * 60 * 60 * 1000)
          newEnd = new Date(center.getTime() + 8 * 90 * 24 * 60 * 60 * 1000)
          break
      }

      return {
        ...prev,
        timescale,
        viewStart: newStart,
        viewEnd: newEnd,
      }
    })
  }, [])

  const panTo = useCallback(
    (x: number, y: number, animated: boolean = true) => {
      if (!animated) {
        setOffset(x, y)
        return
      }

      // Smooth animation to target position
      const startX = state.offsetX
      const startY = state.offsetY
      const startTime = performance.now()
      const duration = 300

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3)

        const currentX = startX + (x - startX) * eased
        const currentY = startY + (y - startY) * eased

        setOffset(currentX, currentY)

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          animationRef.current = null
        }
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [state.offsetX, state.offsetY, setOffset]
  )

  const resetView = useCallback(() => {
    setState({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      viewStart: opts.defaultViewStart,
      viewEnd: opts.defaultViewEnd,
      timescale: opts.defaultTimescale,
    })
  }, [opts.defaultViewStart, opts.defaultViewEnd, opts.defaultTimescale])

  // Date navigation
  const goToToday = useCallback(() => {
    const today = new Date()
    const halfRange = (state.viewEnd.getTime() - state.viewStart.getTime()) / 2

    setViewRange(
      new Date(today.getTime() - halfRange),
      new Date(today.getTime() + halfRange)
    )
  }, [state.viewEnd, state.viewStart, setViewRange])

  const goToDate = useCallback(
    (date: Date) => {
      const halfRange = (state.viewEnd.getTime() - state.viewStart.getTime()) / 2

      setViewRange(
        new Date(date.getTime() - halfRange),
        new Date(date.getTime() + halfRange)
      )
    },
    [state.viewEnd, state.viewStart, setViewRange]
  )

  const shiftView = useCallback(
    (days: number) => {
      const shift = days * 24 * 60 * 60 * 1000
      setViewRange(
        new Date(state.viewStart.getTime() + shift),
        new Date(state.viewEnd.getTime() + shift)
      )
    },
    [state.viewStart, state.viewEnd, setViewRange]
  )

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return {
    setScale,
    setOffset,
    zoomIn,
    zoomOut,
    zoomToFit,
    zoomToSelection,
    setViewRange,
    setTimescale,
    panTo,
    resetView,
    goToToday,
    goToDate,
    shiftView,
    state,
  }
}
