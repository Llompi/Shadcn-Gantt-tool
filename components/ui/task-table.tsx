"use client"

import React, { useState, useRef, useMemo, useEffect } from "react"
import { Task, TaskStatus } from "@/types/task"
import { Download, Upload, Trash2, GripVertical, Eye, EyeOff, ChevronDown } from "lucide-react"
import * as XLSX from "xlsx"
import { TableToolbar, SortConfig, FilterConfig, GroupConfig } from "@/components/table-toolbar"

export type TimescaleType = "day" | "week" | "month" | "quarter"

interface TaskTableProps {
  tasks: Task[]
  statuses: TaskStatus[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  onTaskDelete?: (taskId: string) => Promise<void>
  onTasksImport: (tasks: Partial<Task>[]) => Promise<void>
  onProcessedTasksChange?: (tasks: Task[]) => void
  searchQuery: string
  sortConfig: SortConfig | null
  filterConfigs: FilterConfig[]
  groupConfig: GroupConfig | null
  columnVisibility: Record<string, boolean>
  headersOnly?: boolean
}

export function TaskTable({
  tasks,
  statuses,
  onTaskUpdate,
  onTaskDelete,
  onTasksImport,
  onProcessedTasksChange,
  searchQuery,
  sortConfig,
  filterConfigs,
  groupConfig,
  columnVisibility,
  headersOnly = false,
}: TaskTableProps) {
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Apply search, filter, sort, and group to tasks
  const processedTasks = useMemo(() => {
    let result = [...tasks]

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(task =>
        task.name.toLowerCase().includes(query) ||
        task.owner?.toLowerCase().includes(query) ||
        task.group?.toLowerCase().includes(query) ||
        task.status?.name.toLowerCase().includes(query)
      )
    }

    // Apply filters
    filterConfigs.forEach(filter => {
      if (!filter.value) return

      result = result.filter(task => {
        const value = task[filter.field as keyof Task]
        const filterValue = filter.value

        if (value === undefined || value === null) return false

        switch (filter.operator) {
          case 'equals':
            if (typeof value === 'object' && 'name' in value) {
              return String(value.name).toLowerCase() === String(filterValue).toLowerCase()
            }
            return String(value).toLowerCase() === String(filterValue).toLowerCase()

          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase())

          case 'greaterThan':
            if (typeof value === 'number') {
              return value > Number(filterValue)
            }
            if (value instanceof Date) {
              return value > new Date(String(filterValue))
            }
            return false

          case 'lessThan':
            if (typeof value === 'number') {
              return value < Number(filterValue)
            }
            if (value instanceof Date) {
              return value < new Date(String(filterValue))
            }
            return false

          default:
            return true
        }
      })
    })

    // Apply sort
    if (sortConfig) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.field as keyof Task]
        let bValue = b[sortConfig.field as keyof Task]

        // Handle status object
        if (sortConfig.field === 'status' && aValue && typeof aValue === 'object' && 'name' in aValue) {
          aValue = aValue.name as string
          bValue = (bValue && typeof bValue === 'object' && 'name' in bValue) ? bValue.name as string : ''
        }

        // Handle null/undefined
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1

        // Compare values
        let comparison = 0
        if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime()
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue
        } else {
          comparison = String(aValue).localeCompare(String(bValue))
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [tasks, searchQuery, filterConfigs, sortConfig])

  // Group tasks if grouping is enabled
  const groupedTasks = useMemo(() => {
    if (!groupConfig) return { ungrouped: processedTasks }

    const groups: Record<string, Task[]> = {}

    processedTasks.forEach(task => {
      let groupKey = task[groupConfig.field as keyof Task]

      // Handle status object
      if (groupConfig.field === 'status' && groupKey && typeof groupKey === 'object' && 'name' in groupKey) {
        groupKey = groupKey.name as string
      }

      const key = groupKey ? String(groupKey) : 'Ungrouped'
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(task)
    })

    return groups
  }, [processedTasks, groupConfig])

  // Notify parent when processed tasks change
  useEffect(() => {
    if (onProcessedTasksChange) {
      onProcessedTasksChange(processedTasks)
    }
  }, [processedTasks, onProcessedTasksChange])

  // Define column order for navigation
  const columns = ['name', 'start', 'end', 'status', 'owner', 'group', 'progress']

  // Navigate to next/previous cell (Excel-like)
  const navigateCell = (direction: 'up' | 'down' | 'left' | 'right' | 'tab' | 'shiftTab') => {
    if (!editingCell) return

    const taskIndex = tasks.findIndex(t => t.id === editingCell.taskId)
    const fieldMap: Record<string, string> = {
      'name': 'name',
      'startAt': 'start',
      'start': 'startAt',
      'endAt': 'end',
      'end': 'endAt',
      'status': 'status',
      'owner': 'owner',
      'group': 'group',
      'progress': 'progress'
    }
    const currentField = fieldMap[editingCell.field] || editingCell.field
    const colIndex = columns.indexOf(currentField)

    let newTaskIndex = taskIndex
    let newColIndex = colIndex

    switch (direction) {
      case 'up':
        newTaskIndex = Math.max(0, taskIndex - 1)
        break
      case 'down':
      case 'tab':
        if (direction === 'down') {
          newTaskIndex = Math.min(tasks.length - 1, taskIndex + 1)
        } else {
          // Tab: move right, wrap to next row
          newColIndex = colIndex + 1
          if (newColIndex >= columns.length) {
            newColIndex = 0
            newTaskIndex = Math.min(tasks.length - 1, taskIndex + 1)
          }
        }
        break
      case 'left':
      case 'shiftTab':
        if (direction === 'left') {
          newColIndex = Math.max(0, colIndex - 1)
        } else {
          // Shift+Tab: move left, wrap to previous row
          newColIndex = colIndex - 1
          if (newColIndex < 0) {
            newColIndex = columns.length - 1
            newTaskIndex = Math.max(0, taskIndex - 1)
          }
        }
        break
      case 'right':
        newColIndex = Math.min(columns.length - 1, colIndex + 1)
        break
    }

    if (newTaskIndex >= 0 && newTaskIndex < tasks.length) {
      const newField = columns[newColIndex]
      const newFieldName = newField === 'start' ? 'startAt' : newField === 'end' ? 'endAt' : newField
      setEditingCell({ taskId: tasks[newTaskIndex].id, field: newFieldName })
    }
  }

  // Column width state
  const [columnWidths, setColumnWidths] = useState({
    name: 250,
    start: 120,
    end: 120,
    status: 140,
    owner: 150,
    group: 150,
    progress: 100,
  })

  // Column resizing state
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({ x: 0, width: 0 })

  // Handle column resize start
  const handleResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault()
    setResizingColumn(column)
    setResizeStart({
      x: e.clientX,
      width: columnWidths[column as keyof typeof columnWidths],
    })
  }

  // Handle column resize
  React.useEffect(() => {
    if (!resizingColumn) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x
      const newWidth = Math.max(80, resizeStart.width + deltaX)

      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: newWidth,
      }))
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingColumn, resizeStart])

  const formatDate = (date: Date | undefined): string => {
    if (!date) return ""
    const d = new Date(date)
    return d.toISOString().split("T")[0]
  }

  // Centralized keyboard handler for all inputs
  const handleKeyDown = (e: React.KeyboardEvent, taskId: string, field: keyof Task, getValue: () => string | TaskStatus) => {
    // Handle Tab/Shift+Tab
    if (e.key === 'Tab') {
      e.preventDefault()
      const value = getValue()
      handleCellEdit(taskId, field, value)
      navigateCell(e.shiftKey ? 'shiftTab' : 'tab')
      return
    }

    // Handle Arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
      const value = getValue()
      handleCellEdit(taskId, field, value)
      const directionMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right'
      }
      navigateCell(directionMap[e.key])
      return
    }

    // Handle Enter (move down, like Excel)
    if (e.key === 'Enter') {
      e.preventDefault()
      const value = getValue()
      handleCellEdit(taskId, field, value)
      navigateCell('down')
      return
    }

    // Handle Escape
    if (e.key === 'Escape') {
      e.preventDefault()
      setEditingCell(null)
      return
    }
  }

  const handleCellEdit = async (taskId: string, field: keyof Task, value: string | number | TaskStatus) => {
    try {
      let processedValue: string | number | Date | TaskStatus | undefined = value

      // Handle date fields
      if (field === "startAt" || field === "endAt") {
        const dateValue = new Date(value as string)
        if (isNaN(dateValue.getTime())) {
          alert("Invalid date format")
          return
        }
        processedValue = dateValue
      }

      // Handle progress field
      if (field === "progress") {
        processedValue = Math.min(100, Math.max(0, parseFloat(value as string) || 0))
      }

      // Handle status field
      if (field === "status") {
        const status = statuses.find((s) => s.name === value || s.id === value)
        if (status) {
          processedValue = status
        }
      }

      await onTaskUpdate(taskId, { [field]: processedValue })
      setEditingCell(null)
    } catch (error) {
      console.error("Failed to update task:", error)
      alert("Failed to update task")
    }
  }

  const handleDelete = async (taskId: string) => {
    if (onTaskDelete && confirm("Are you sure you want to delete this task?")) {
      try {
        await onTaskDelete(taskId)
      } catch (error) {
        console.error("Failed to delete task:", error)
        alert("Failed to delete task")
      }
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["ID", "Name", "Start Date", "End Date", "Status", "Owner", "Group", "Description", "Progress"]
    const rows = tasks.map((task) => [
      task.id,
      task.name,
      formatDate(task.startAt),
      formatDate(task.endAt),
      task.status?.name || "",
      task.owner || "",
      task.group || "",
      task.description || "",
      task.progress?.toString() || "",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `tasks-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Helper functions for timeline calculations
  const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const getStartOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
  }

  const getStartOfQuarter = (date: Date): Date => {
    const quarter = Math.floor(date.getMonth() / 3)
    return new Date(date.getFullYear(), quarter * 3, 1, 0, 0, 0, 0)
  }

  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  const addWeeks = (date: Date, weeks: number): Date => {
    return addDays(date, weeks * 7)
  }

  const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date)
    result.setMonth(result.getMonth() + months)
    return result
  }

  const addQuarters = (date: Date, quarters: number): Date => {
    return addMonths(date, quarters * 3)
  }

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  // Export to Excel with task data (Gantt visualization removed - handled by parent)
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()

    // Task data
    const taskData = tasks.map((task) => ({
      ID: task.id,
      Name: task.name,
      "Start Date": formatDate(task.startAt),
      "End Date": formatDate(task.endAt),
      Status: task.status?.name || "",
      Owner: task.owner || "",
      Group: task.group || "",
      Progress: task.progress || 0,
    }))

    const wsData = XLSX.utils.json_to_sheet(taskData)
    wsData["!cols"] = [
      { wch: 10 }, { wch: 30 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 10 },
    ]
    XLSX.utils.book_append_sheet(wb, wsData, "Tasks")

    // Gantt Chart visualization removed (now handled by parent component)
    if (false) {
      const ganttData = { data: [], periodCount: 0 } // createGanttChartData(viewStart, viewEnd, timescale)
      const wsGantt = XLSX.utils.aoa_to_sheet(ganttData.data)

      // Set column widths for Gantt chart
      wsGantt["!cols"] = [
        { wch: 25 }, // Task name column
        ...Array(ganttData.periodCount).fill({ wch: 4 }) // Timeline columns
      ]

      // Set row heights
      wsGantt["!rows"] = Array(ganttData.data.length).fill({ hpt: 20 })

      // Apply cell styling for better visualization
      const range = XLSX.utils.decode_range(wsGantt["!ref"] || "A1")
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          if (!wsGantt[cellAddress]) continue

          const cell = wsGantt[cellAddress]

          // Header rows styling
          if (R === 0 || R === 1) {
            cell.s = {
              font: { bold: true, sz: 11 },
              fill: { fgColor: { rgb: "E0E0E0" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
              },
            }
          }
          // Task name column styling
          else if (C === 0) {
            cell.s = {
              font: { sz: 10 },
              alignment: { horizontal: "left", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "CCCCCC" } },
                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                left: { style: "thin", color: { rgb: "CCCCCC" } },
                right: { style: "thin", color: { rgb: "CCCCCC" } },
              },
            }
          }
          // Task bar cells (with █ character)
          else if (cell.v === "█") {
            const taskIndex = R - 2 // Subtract header rows
            const task = tasks[taskIndex]
            const statusColor = task?.status?.color || "#3b82f6"
            const rgb = statusColor.replace("#", "")

            cell.s = {
              font: { sz: 10, color: { rgb } },
              fill: { fgColor: { rgb } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb } },
                bottom: { style: "thin", color: { rgb } },
                left: { style: "thin", color: { rgb } },
                right: { style: "thin", color: { rgb } },
              },
            }
          }
          // Empty timeline cells
          else {
            cell.s = {
              border: {
                top: { style: "hair", color: { rgb: "EEEEEE" } },
                bottom: { style: "hair", color: { rgb: "EEEEEE" } },
                left: { style: "hair", color: { rgb: "EEEEEE" } },
                right: { style: "hair", color: { rgb: "EEEEEE" } },
              },
            }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, wsGantt, "Gantt Chart")
    }

    XLSX.writeFile(wb, `tasks-gantt-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  // Create Gantt chart data for Excel
  const createGanttChartData = (start: Date, end: Date, scale: TimescaleType) => {
    const periods: Array<{ date: Date; label: string }> = []
    const timeHeaders: Array<{ label: string; span: number }> = []

    let current = new Date(start)
    const endDate = new Date(end)

    // Calculate periods based on timescale
    if (scale === "day") {
      let currentMonth = ""
      let monthSpan = 0

      while (current <= endDate) {
        const monthYear = current.toLocaleDateString("en", { month: "short", year: "numeric" })

        if (monthYear !== currentMonth) {
          if (monthSpan > 0) {
            timeHeaders.push({ label: currentMonth, span: monthSpan })
          }
          currentMonth = monthYear
          monthSpan = 0
        }

        monthSpan++
        periods.push({ date: new Date(current), label: current.getDate().toString() })
        current = addDays(current, 1)
      }

      if (monthSpan > 0) {
        timeHeaders.push({ label: currentMonth, span: monthSpan })
      }
    } else if (scale === "week") {
      current = getStartOfWeek(current)
      let currentYear = ""
      let yearSpan = 0

      while (current <= endDate) {
        const year = current.getFullYear().toString()

        if (year !== currentYear) {
          if (yearSpan > 0) {
            timeHeaders.push({ label: currentYear, span: yearSpan })
          }
          currentYear = year
          yearSpan = 0
        }

        yearSpan++
        periods.push({ date: new Date(current), label: `W${getWeekNumber(current)}` })
        current = addWeeks(current, 1)
      }

      if (yearSpan > 0) {
        timeHeaders.push({ label: currentYear, span: yearSpan })
      }
    } else if (scale === "month") {
      current = getStartOfMonth(current)
      let currentYear = ""
      let yearSpan = 0

      while (current <= endDate) {
        const year = current.getFullYear().toString()

        if (year !== currentYear) {
          if (yearSpan > 0) {
            timeHeaders.push({ label: currentYear, span: yearSpan })
          }
          currentYear = year
          yearSpan = 0
        }

        yearSpan++
        periods.push({ date: new Date(current), label: current.toLocaleDateString("en", { month: "short" }) })
        current = addMonths(current, 1)
      }

      if (yearSpan > 0) {
        timeHeaders.push({ label: currentYear, span: yearSpan })
      }
    } else if (scale === "quarter") {
      current = getStartOfQuarter(current)
      let currentYear = ""
      let yearSpan = 0

      while (current <= endDate) {
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
        periods.push({ date: new Date(current), label: `Q${quarter}` })
        current = addQuarters(current, 1)
      }

      if (yearSpan > 0) {
        timeHeaders.push({ label: currentYear, span: yearSpan })
      }
    }

    // Build header rows
    const headerRow1: string[] = ["Task"]
    const headerRow2: string[] = [""]

    for (const header of timeHeaders) {
      headerRow1.push(header.label)
      for (let i = 1; i < header.span; i++) {
        headerRow1.push("")
      }
    }

    for (const period of periods) {
      headerRow2.push(period.label)
    }

    // Build task rows with visual bars
    const taskRows = tasks.map((task) => {
      const row: string[] = [task.name]

      for (const period of periods) {
        const periodStart = period.date
        let periodEnd: Date

        if (scale === "day") {
          periodEnd = addDays(periodStart, 1)
        } else if (scale === "week") {
          periodEnd = addWeeks(periodStart, 1)
        } else if (scale === "month") {
          periodEnd = addMonths(periodStart, 1)
        } else {
          periodEnd = addQuarters(periodStart, 1)
        }

        // Check if task overlaps with this period
        const taskStart = new Date(task.startAt)
        const taskEnd = new Date(task.endAt)

        const overlaps = taskStart < periodEnd && taskEnd >= periodStart

        row.push(overlaps ? "█" : "")
      }

      return row
    })

    return {
      data: [headerRow1, headerRow2, ...taskRows],
      periodCount: periods.length,
    }
  }

  // Import from file (CSV or Excel)
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const fileType = file.name.split(".").pop()?.toLowerCase()

      if (fileType === "csv") {
        await importFromCSV(file)
      } else if (fileType === "xlsx" || fileType === "xls") {
        await importFromExcel(file)
      } else {
        alert("Unsupported file format. Please upload CSV or Excel file.")
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Import failed:", error)
      alert("Failed to import file. Please check the file format.")
    }
  }

  const importFromCSV = async (file: File) => {
    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      alert("CSV file is empty or invalid")
      return
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
    const tasks: Partial<Task>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map((v) => v.trim().replace(/^"|"$/g, "")) || []

      if (values.length === 0) continue

      const task: Partial<Task> = {}
      headers.forEach((header, index) => {
        const value = values[index]?.trim()
        if (!value) return

        switch (header.toLowerCase()) {
          case "id":
            task.id = value
            break
          case "name":
            task.name = value
            break
          case "start date":
          case "startdate":
            task.startAt = new Date(value)
            break
          case "end date":
          case "enddate":
            task.endAt = new Date(value)
            break
          case "status":
            const status = statuses.find((s) => s.name === value)
            if (status) task.status = status
            break
          case "owner":
            task.owner = value
            break
          case "group":
            task.group = value
            break
          case "description":
            task.description = value
            break
          case "progress":
            task.progress = parseFloat(value) || 0
            break
        }
      })

      if (task.name && task.startAt && task.endAt) {
        tasks.push(task)
      }
    }

    if (tasks.length > 0) {
      await onTasksImport(tasks)
      alert(`Successfully imported ${tasks.length} task(s)`)
    } else {
      alert("No valid tasks found in CSV file")
    }
  }

  const importFromExcel = async (file: File) => {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: "array" })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(firstSheet)

    if (rows.length === 0) {
      alert("Excel file is empty")
      return
    }

    const tasks: Partial<Task>[] = rows.map((row) => {
      const task: Partial<Task> = {}

      if (row.ID) task.id = String(row.ID)
      if (row.Name) task.name = String(row.Name)
      if (row["Start Date"]) task.startAt = new Date(row["Start Date"])
      if (row["End Date"]) task.endAt = new Date(row["End Date"])
      if (row.Status) {
        const status = statuses.find((s) => s.name === row.Status)
        if (status) task.status = status
      }
      if (row.Owner) task.owner = String(row.Owner)
      if (row.Group) task.group = String(row.Group)
      if (row.Description) task.description = String(row.Description)
      if (row.Progress !== undefined) {
        task.progress = typeof row.Progress === 'number' ? row.Progress : parseFloat(String(row.Progress)) || 0
      }

      return task
    }).filter((task) => task.name && task.startAt && task.endAt)

    if (tasks.length > 0) {
      await onTasksImport(tasks)
      alert(`Successfully imported ${tasks.length} task(s)`)
    } else {
      alert("No valid tasks found in Excel file")
    }
  }

  return (
    <div className="flex flex-col" style={{ '--task-row-height': '48px' } as React.CSSProperties}>
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
          <thead className="sticky top-0 bg-muted z-10" style={{ height: '80px' }}>
            <tr style={{ height: '80px', margin: 0, padding: 0 }}>
              {columnVisibility.name && (
              <th className="px-2 py-2 text-left font-semibold border-b relative group" style={{ width: columnWidths.name }}>
                <div className="flex items-center justify-between">
                  <span>Name</span>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onMouseDown={(e) => handleResizeStart(e, 'name')}
                  >
                    <GripVertical className="w-3 h-3 text-primary" />
                  </div>
                </div>
              </th>
              )}
              {columnVisibility.start && (
              <th className="px-2 py-2 text-left font-semibold border-b relative group" style={{ width: columnWidths.start }}>
                <div className="flex items-center justify-between">
                  <span>Start</span>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onMouseDown={(e) => handleResizeStart(e, 'start')}
                  >
                    <GripVertical className="w-3 h-3 text-primary" />
                  </div>
                </div>
              </th>
              )}
              {columnVisibility.end && (
              <th className="px-2 py-2 text-left font-semibold border-b relative group" style={{ width: columnWidths.end }}>
                <div className="flex items-center justify-between">
                  <span>End</span>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onMouseDown={(e) => handleResizeStart(e, 'end')}
                  >
                    <GripVertical className="w-3 h-3 text-primary" />
                  </div>
                </div>
              </th>
              )}
              {columnVisibility.status && (
              <th className="px-2 py-2 text-left font-semibold border-b relative group" style={{ width: columnWidths.status }}>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onMouseDown={(e) => handleResizeStart(e, 'status')}
                  >
                    <GripVertical className="w-3 h-3 text-primary" />
                  </div>
                </div>
              </th>
              )}
              {columnVisibility.owner && (
              <th className="px-2 py-2 text-left font-semibold border-b relative group" style={{ width: columnWidths.owner }}>
                <div className="flex items-center justify-between">
                  <span>Owner</span>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onMouseDown={(e) => handleResizeStart(e, 'owner')}
                  >
                    <GripVertical className="w-3 h-3 text-primary" />
                  </div>
                </div>
              </th>
              )}
              {columnVisibility.group && (
              <th className="px-2 py-2 text-left font-semibold border-b relative group" style={{ width: columnWidths.group }}>
                <div className="flex items-center justify-between">
                  <span>Group</span>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onMouseDown={(e) => handleResizeStart(e, 'group')}
                  >
                    <GripVertical className="w-3 h-3 text-primary" />
                  </div>
                </div>
              </th>
              )}
              {columnVisibility.progress && (
              <th className="px-2 py-2 text-left font-semibold border-b relative group" style={{ width: columnWidths.progress }}>
                <div className="flex items-center justify-between">
                  <span>Progress</span>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onMouseDown={(e) => handleResizeStart(e, 'progress')}
                  >
                    <GripVertical className="w-3 h-3 text-primary" />
                  </div>
                </div>
              </th>
              )}
              {onTaskDelete && (
                <th className="px-2 py-2 text-left font-semibold border-b w-10"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {/* Render grouped or ungrouped tasks */}
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <React.Fragment key={groupName}>
                {/* Group header if grouping is active */}
                {groupConfig && Object.keys(groupedTasks).length > 1 && (
                  <tr className="bg-muted/70">
                    <td colSpan={onTaskDelete ? 8 : 7} className="px-2 py-2 font-semibold text-sm">
                      {groupName} ({groupTasks.length})
                    </td>
                  </tr>
                )}

                {/* Tasks in this group */}
                {groupTasks.map((task) => (
              <tr
                key={task.id}
                className="border-b hover:bg-muted/50"
                style={{
                  height: 'var(--task-row-height, 48px)',
                  minHeight: 'var(--task-row-height, 48px)',
                  maxHeight: 'var(--task-row-height, 48px)',
                  margin: 0,
                  padding: 0,
                  boxSizing: 'border-box'
                }}
              >
                {columnVisibility.name && (
                <td className="px-2 align-middle" style={{
                  height: 'var(--task-row-height, 48px)',
                  minHeight: 'var(--task-row-height, 48px)',
                  maxHeight: 'var(--task-row-height, 48px)',
                  lineHeight: '1',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  padding: '0 0.5rem'
                }}>
                  {editingCell?.taskId === task.id && editingCell.field === "name" ? (
                    <input
                      type="text"
                      defaultValue={task.name}
                      autoFocus
                      onBlur={(e) => handleCellEdit(task.id, "name", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, task.id, "name", () => e.currentTarget.value)}
                      className="w-full h-8 px-2 py-1 bg-background border border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "name" })}
                      className="flex items-center cursor-text px-2 hover:bg-accent/30 rounded-md transition-colors h-full"
                    >
                      {task.name || <span className="text-muted-foreground text-xs">Click to edit</span>}
                    </div>
                  )}
                </td>
                )}
                {columnVisibility.start && (
                <td className="px-2 align-middle" style={{
                  height: 'var(--task-row-height, 48px)',
                  minHeight: 'var(--task-row-height, 48px)',
                  maxHeight: 'var(--task-row-height, 48px)',
                  lineHeight: '1',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  padding: '0 0.5rem'
                }}>
                  {editingCell?.taskId === task.id && editingCell.field === "startAt" ? (
                    <input
                      type="date"
                      defaultValue={formatDate(task.startAt)}
                      autoFocus
                      onBlur={(e) => handleCellEdit(task.id, "startAt", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, task.id, "startAt", () => e.currentTarget.value)}
                      className="w-full h-8 px-2 py-1 bg-background border border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "startAt" })}
                      className="flex items-center cursor-text px-2 hover:bg-accent/30 rounded-md transition-colors h-full"
                    >
                      {formatDate(task.startAt) || <span className="text-muted-foreground text-xs">Click to edit</span>}
                    </div>
                  )}
                </td>
                )}
                {columnVisibility.end && (
                <td className="px-2 align-middle" style={{
                  height: 'var(--task-row-height, 48px)',
                  minHeight: 'var(--task-row-height, 48px)',
                  maxHeight: 'var(--task-row-height, 48px)',
                  lineHeight: '1',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  padding: '0 0.5rem'
                }}>
                  {editingCell?.taskId === task.id && editingCell.field === "endAt" ? (
                    <input
                      type="date"
                      defaultValue={formatDate(task.endAt)}
                      autoFocus
                      onBlur={(e) => handleCellEdit(task.id, "endAt", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, task.id, "endAt", () => e.currentTarget.value)}
                      className="w-full h-8 px-2 py-1 bg-background border border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "endAt" })}
                      className="flex items-center cursor-text px-2 hover:bg-accent/30 rounded-md transition-colors h-full"
                    >
                      {formatDate(task.endAt) || <span className="text-muted-foreground text-xs">Click to edit</span>}
                    </div>
                  )}
                </td>
                )}
                {columnVisibility.status && (
                <td className="px-2 align-middle" style={{
                  height: 'var(--task-row-height, 48px)',
                  minHeight: 'var(--task-row-height, 48px)',
                  maxHeight: 'var(--task-row-height, 48px)',
                  lineHeight: '1',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  padding: '0 0.5rem'
                }}>
                  {editingCell?.taskId === task.id && editingCell.field === "status" ? (
                    <select
                      defaultValue={task.status?.id}
                      autoFocus
                      onBlur={(e) => {
                        const status = statuses.find((s) => s.id === e.target.value)
                        if (status) handleCellEdit(task.id, "status", status)
                      }}
                      onKeyDown={(e) => handleKeyDown(e, task.id, "status", () => {
                        const status = statuses.find((s) => s.id === e.currentTarget.value)
                        return status || task.status?.id || ''
                      })}
                      className="w-full h-8 px-2 py-1 bg-background border border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                    >
                      <option value="">None</option>
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "status" })}
                      className="flex items-center cursor-text px-2 hover:bg-accent/30 rounded-md transition-colors gap-1.5 h-full"
                    >
                      {task.status ? (
                        <>
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: task.status.color || "#3b82f6" }}
                          />
                          <span>{task.status.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs">Click to edit</span>
                      )}
                    </div>
                  )}
                </td>
                )}
                {columnVisibility.owner && (
                <td className="px-2 align-middle" style={{
                  height: 'var(--task-row-height, 48px)',
                  minHeight: 'var(--task-row-height, 48px)',
                  maxHeight: 'var(--task-row-height, 48px)',
                  lineHeight: '1',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  padding: '0 0.5rem'
                }}>
                  {editingCell?.taskId === task.id && editingCell.field === "owner" ? (
                    <input
                      type="text"
                      defaultValue={task.owner || ""}
                      autoFocus
                      onBlur={(e) => handleCellEdit(task.id, "owner", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, task.id, "owner", () => e.currentTarget.value)}
                      className="w-full h-8 px-2 py-1 bg-background border border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "owner" })}
                      className="flex items-center cursor-text px-2 hover:bg-accent/30 rounded-md transition-colors h-full"
                    >
                      {task.owner || <span className="text-muted-foreground text-xs">Click to edit</span>}
                    </div>
                  )}
                </td>
                )}
                {columnVisibility.group && (
                <td className="px-2 align-middle" style={{
                  height: 'var(--task-row-height, 48px)',
                  minHeight: 'var(--task-row-height, 48px)',
                  maxHeight: 'var(--task-row-height, 48px)',
                  lineHeight: '1',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  padding: '0 0.5rem'
                }}>
                  {editingCell?.taskId === task.id && editingCell.field === "group" ? (
                    <input
                      type="text"
                      defaultValue={task.group || ""}
                      autoFocus
                      onBlur={(e) => handleCellEdit(task.id, "group", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, task.id, "group", () => e.currentTarget.value)}
                      className="w-full h-8 px-2 py-1 bg-background border border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "group" })}
                      className="flex items-center cursor-text px-2 hover:bg-accent/30 rounded-md transition-colors h-full"
                    >
                      {task.group || <span className="text-muted-foreground text-xs">Click to edit</span>}
                    </div>
                  )}
                </td>
                )}
                {columnVisibility.progress && (
                <td className="px-2 align-middle" style={{
                  height: 'var(--task-row-height, 48px)',
                  minHeight: 'var(--task-row-height, 48px)',
                  maxHeight: 'var(--task-row-height, 48px)',
                  lineHeight: '1',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  padding: '0 0.5rem'
                }}>
                  {editingCell?.taskId === task.id && editingCell.field === "progress" ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={task.progress || 0}
                      autoFocus
                      onBlur={(e) => handleCellEdit(task.id, "progress", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, task.id, "progress", () => e.currentTarget.value)}
                      className="w-full h-8 px-2 py-1 bg-background border border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "progress" })}
                      className="flex items-center cursor-text px-2 hover:bg-accent/30 rounded-md transition-colors h-full"
                    >
                      {task.progress !== undefined ? `${task.progress}%` : <span className="text-muted-foreground text-xs">Click to edit</span>}
                    </div>
                  )}
                </td>
                )}
                {onTaskDelete && (
                  <td className="px-2 align-middle" style={{
                  height: 'var(--task-row-height, 48px)',
                  minHeight: 'var(--task-row-height, 48px)',
                  maxHeight: 'var(--task-row-height, 48px)',
                  lineHeight: '1',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  padding: '0 0.5rem'
                }}>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
    </div>
  )
}
