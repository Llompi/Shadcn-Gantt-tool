"use client"

import React, { useState, useRef } from "react"
import { Task, TaskStatus } from "@/types/task"
import { Download, Upload, Trash2, GripVertical } from "lucide-react"
import * as XLSX from "xlsx"

export type TimescaleType = "day" | "week" | "month" | "quarter"

interface TaskTableProps {
  tasks: Task[]
  statuses: TaskStatus[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  onTaskDelete?: (taskId: string) => Promise<void>
  onTasksImport: (tasks: Partial<Task>[]) => Promise<void>
  viewStart?: Date
  viewEnd?: Date
  timescale?: TimescaleType
}

export function TaskTable({
  tasks,
  statuses,
  onTaskUpdate,
  onTaskDelete,
  onTasksImport,
  viewStart,
  viewEnd,
  timescale = "day",
}: TaskTableProps) {
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Export to Excel with Gantt chart visualization
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()

    // Sheet 1: Task data
    const taskData = tasks.map((task) => ({
      ID: task.id,
      Name: task.name,
      "Start Date": formatDate(task.startAt),
      "End Date": formatDate(task.endAt),
      Status: task.status?.name || "",
      Owner: task.owner || "",
      Group: task.group || "",
      Description: task.description || "",
      Progress: task.progress || 0,
    }))

    const wsData = XLSX.utils.json_to_sheet(taskData)
    wsData["!cols"] = [
      { wch: 10 }, { wch: 30 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 40 }, { wch: 10 },
    ]
    XLSX.utils.book_append_sheet(wb, wsData, "Tasks")

    // Sheet 2: Gantt Chart visualization
    if (viewStart && viewEnd) {
      const ganttData = createGanttChartData(viewStart, viewEnd, timescale)
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
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex gap-2 p-2 border-b bg-muted/50">
        <button
          onClick={exportToCSV}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-accent transition-colors"
          title="Export to CSV"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-accent transition-colors"
          title="Export to Excel"
        >
          <Download className="h-4 w-4" />
          Excel
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-accent transition-colors"
          title="Import from CSV or Excel"
        >
          <Upload className="h-4 w-4" />
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileImport}
          className="hidden"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted z-10">
            <tr>
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
              {onTaskDelete && (
                <th className="px-2 py-2 text-left font-semibold border-b w-10"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b hover:bg-muted/50" style={{ height: '48px' }}>
                <td className="px-2 py-1.5 align-middle">
                  {editingCell?.taskId === task.id && editingCell.field === "name" ? (
                    <input
                      type="text"
                      defaultValue={task.name}
                      autoFocus
                      onBlur={(e) => handleCellEdit(task.id, "name", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCellEdit(task.id, "name", e.currentTarget.value)
                        } else if (e.key === "Escape") {
                          setEditingCell(null)
                        }
                      }}
                      className="w-full h-8 px-2 py-1 bg-background border border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "name" })}
                      className="min-h-[2rem] flex items-center cursor-text px-2 py-1 hover:bg-accent/30 rounded-md transition-colors"
                    >
                      {task.name || <span className="text-muted-foreground text-xs">Click to edit</span>}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5 align-middle">
                  {editingCell?.taskId === task.id && editingCell.field === "startAt" ? (
                    <input
                      type="date"
                      defaultValue={formatDate(task.startAt)}
                      autoFocus
                      onBlur={(e) => handleCellEdit(task.id, "startAt", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCellEdit(task.id, "startAt", e.currentTarget.value)
                        } else if (e.key === "Escape") {
                          setEditingCell(null)
                        }
                      }}
                      className="w-full h-8 px-2 py-1 bg-background border border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "startAt" })}
                      className="min-h-[2rem] flex items-center cursor-text px-2 py-1 hover:bg-accent/30 rounded-md transition-colors"
                    >
                      {formatDate(task.startAt) || <span className="text-muted-foreground text-xs">Click to edit</span>}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5 align-middle">
                  {editingCell?.taskId === task.id && editingCell.field === "endAt" ? (
                    <input
                      type="date"
                      defaultValue={formatDate(task.endAt)}
                      autoFocus
                      onBlur={(e) => handleCellEdit(task.id, "endAt", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCellEdit(task.id, "endAt", e.currentTarget.value)
                        } else if (e.key === "Escape") {
                          setEditingCell(null)
                        }
                      }}
                      className="w-full h-8 px-2 py-1 bg-background border border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "endAt" })}
                      className="min-h-[2rem] flex items-center cursor-text px-2 py-1 hover:bg-accent/30 rounded-md transition-colors"
                    >
                      {formatDate(task.endAt) || <span className="text-muted-foreground text-xs">Click to edit</span>}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5 align-middle">
                  {editingCell?.taskId === task.id && editingCell.field === "status" ? (
                    <select
                      defaultValue={task.status?.id}
                      autoFocus
                      onBlur={(e) => {
                        const status = statuses.find((s) => s.id === e.target.value)
                        if (status) handleCellEdit(task.id, "status", status)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const status = statuses.find((s) => s.id === e.currentTarget.value)
                          if (status) handleCellEdit(task.id, "status", status)
                        } else if (e.key === "Escape") {
                          setEditingCell(null)
                        }
                      }}
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
                      className="min-h-[2rem] flex items-center cursor-text px-2 py-1 hover:bg-accent/30 rounded-md transition-colors gap-1.5"
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
                <td className="px-2 py-1.5 align-middle">
                  {editingCell?.taskId === task.id && editingCell.field === "owner" ? (
                    <input
                      type="text"
                      defaultValue={task.owner || ""}
                      autoFocus
                      onBlur={(e) => handleCellEdit(task.id, "owner", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCellEdit(task.id, "owner", e.currentTarget.value)
                        } else if (e.key === "Escape") {
                          setEditingCell(null)
                        }
                      }}
                      className="w-full h-8 px-2 py-1 bg-background border border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "owner" })}
                      className="min-h-[2rem] flex items-center cursor-text px-2 py-1 hover:bg-accent/30 rounded-md transition-colors"
                    >
                      {task.owner || <span className="text-muted-foreground text-xs">Click to edit</span>}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5 align-middle">
                  {editingCell?.taskId === task.id && editingCell.field === "group" ? (
                    <input
                      type="text"
                      defaultValue={task.group || ""}
                      autoFocus
                      onBlur={(e) => handleCellEdit(task.id, "group", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCellEdit(task.id, "group", e.currentTarget.value)
                        } else if (e.key === "Escape") {
                          setEditingCell(null)
                        }
                      }}
                      className="w-full h-8 px-2 py-1 bg-background border border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "group" })}
                      className="min-h-[2rem] flex items-center cursor-text px-2 py-1 hover:bg-accent/30 rounded-md transition-colors"
                    >
                      {task.group || <span className="text-muted-foreground text-xs">Click to edit</span>}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5 align-middle">
                  {editingCell?.taskId === task.id && editingCell.field === "progress" ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={task.progress || 0}
                      autoFocus
                      onBlur={(e) => handleCellEdit(task.id, "progress", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCellEdit(task.id, "progress", e.currentTarget.value)
                        } else if (e.key === "Escape") {
                          setEditingCell(null)
                        }
                      }}
                      className="w-full h-8 px-2 py-1 bg-background border border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "progress" })}
                      className="min-h-[2rem] flex items-center cursor-text px-2 py-1 hover:bg-accent/30 rounded-md transition-colors"
                    >
                      {task.progress !== undefined ? `${task.progress}%` : <span className="text-muted-foreground text-xs">Click to edit</span>}
                    </div>
                  )}
                </td>
                {onTaskDelete && (
                  <td className="px-2 py-1.5 align-middle">
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
          </tbody>
        </table>
      </div>
    </div>
  )
}
