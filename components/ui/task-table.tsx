"use client"

import { useState, useRef } from "react"
import { Task, TaskStatus } from "@/types/task"
import { Download, Upload, Trash2 } from "lucide-react"
import * as XLSX from "xlsx"

interface TaskTableProps {
  tasks: Task[]
  statuses: TaskStatus[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  onTaskDelete?: (taskId: string) => Promise<void>
  onTasksImport: (tasks: Partial<Task>[]) => Promise<void>
}

export function TaskTable({
  tasks,
  statuses,
  onTaskUpdate,
  onTaskDelete,
  onTasksImport,
}: TaskTableProps) {
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Export to Excel
  const exportToExcel = () => {
    const data = tasks.map((task) => ({
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

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Tasks")

    // Set column widths
    ws["!cols"] = [
      { wch: 10 }, // ID
      { wch: 30 }, // Name
      { wch: 12 }, // Start Date
      { wch: 12 }, // End Date
      { wch: 15 }, // Status
      { wch: 20 }, // Owner
      { wch: 20 }, // Group
      { wch: 40 }, // Description
      { wch: 10 }, // Progress
    ]

    XLSX.writeFile(wb, `tasks-${new Date().toISOString().split("T")[0]}.xlsx`)
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
              <th className="px-2 py-2 text-left font-semibold border-b">Name</th>
              <th className="px-2 py-2 text-left font-semibold border-b">Start</th>
              <th className="px-2 py-2 text-left font-semibold border-b">End</th>
              <th className="px-2 py-2 text-left font-semibold border-b">Status</th>
              <th className="px-2 py-2 text-left font-semibold border-b">Owner</th>
              <th className="px-2 py-2 text-left font-semibold border-b">Group</th>
              <th className="px-2 py-2 text-left font-semibold border-b">Progress</th>
              {onTaskDelete && (
                <th className="px-2 py-2 text-left font-semibold border-b w-10"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b hover:bg-muted/50">
                <td className="px-2 py-1.5">
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
                      className="w-full px-1 py-0.5 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "name" })}
                      className="cursor-text px-1 py-0.5 hover:bg-accent/50 rounded"
                    >
                      {task.name}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5">
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
                      className="w-full px-1 py-0.5 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "startAt" })}
                      className="cursor-text px-1 py-0.5 hover:bg-accent/50 rounded"
                    >
                      {formatDate(task.startAt)}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5">
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
                      className="w-full px-1 py-0.5 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "endAt" })}
                      className="cursor-text px-1 py-0.5 hover:bg-accent/50 rounded"
                    >
                      {formatDate(task.endAt)}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5">
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
                      className="w-full px-1 py-0.5 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
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
                      className="cursor-text px-1 py-0.5 hover:bg-accent/50 rounded flex items-center gap-1.5"
                    >
                      {task.status && (
                        <>
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: task.status.color || "#3b82f6" }}
                          />
                          <span>{task.status.name}</span>
                        </>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5">
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
                      className="w-full px-1 py-0.5 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "owner" })}
                      className="cursor-text px-1 py-0.5 hover:bg-accent/50 rounded"
                    >
                      {task.owner || ""}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5">
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
                      className="w-full px-1 py-0.5 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "group" })}
                      className="cursor-text px-1 py-0.5 hover:bg-accent/50 rounded"
                    >
                      {task.group || ""}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5">
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
                      className="w-full px-1 py-0.5 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell({ taskId: task.id, field: "progress" })}
                      className="cursor-text px-1 py-0.5 hover:bg-accent/50 rounded"
                    >
                      {task.progress || 0}%
                    </div>
                  )}
                </td>
                {onTaskDelete && (
                  <td className="px-2 py-1.5">
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
