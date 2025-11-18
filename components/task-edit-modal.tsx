'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Calendar, User, Folder, BarChart2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types/task'

interface TaskEditModalProps {
  task: Task
  statuses: TaskStatus[]
  onSave: (taskId: string, updates: Partial<Task>) => Promise<void>
  onClose: () => void
}

export function TaskEditModal({ task, statuses, onSave, onClose }: TaskEditModalProps) {
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    name: task.name || '',
    startAt: task.startAt instanceof Date ? task.startAt.toISOString().split('T')[0] : '',
    endAt: task.endAt instanceof Date ? task.endAt.toISOString().split('T')[0] : '',
    statusId: task.status?.id || '',
    owner: task.owner || '',
    group: task.group || '',
    description: task.description || '',
    progress: task.progress || 0,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Task name is required'
    }

    if (!formData.startAt) {
      newErrors.startAt = 'Start date is required'
    }

    if (!formData.endAt) {
      newErrors.endAt = 'End date is required'
    }

    if (formData.startAt && formData.endAt) {
      const start = new Date(formData.startAt)
      const end = new Date(formData.endAt)
      if (end < start) {
        newErrors.endAt = 'End date must be after start date'
      }
    }

    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.progress = 'Progress must be between 0 and 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSaving(true)
    try {
      const updates: Partial<Task> = {
        name: formData.name,
        startAt: new Date(formData.startAt),
        endAt: new Date(formData.endAt),
        owner: formData.owner || undefined,
        group: formData.group || undefined,
        description: formData.description || undefined,
        progress: formData.progress,
      }

      if (formData.statusId) {
        const status = statuses.find(s => s.id === formData.statusId)
        if (status) {
          updates.status = status
        }
      }

      await onSave(task.id, updates)
      onClose()
    } catch (error) {
      console.error('Failed to save task:', error)
      setErrors({ submit: 'Failed to save task. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!mounted) return null

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0">
      <div
        className="relative w-full max-w-2xl m-4 bg-background border rounded-lg shadow-2xl animate-in zoom-in-95"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Edit Task</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Update task details and save changes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Close"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Task Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <FileText className="w-4 h-4" />
              Task Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.name && 'border-red-500'
              )}
              placeholder="Enter task name"
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Calendar className="w-4 h-4" />
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startAt}
                onChange={(e) => handleChange('startAt', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 border rounded-md text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.startAt && 'border-red-500'
                )}
              />
              {errors.startAt && <p className="text-xs text-red-600 mt-1">{errors.startAt}</p>}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Calendar className="w-4 h-4" />
                End Date *
              </label>
              <input
                type="date"
                value={formData.endAt}
                onChange={(e) => handleChange('endAt', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 border rounded-md text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.endAt && 'border-red-500'
                )}
              />
              {errors.endAt && <p className="text-xs text-red-600 mt-1">{errors.endAt}</p>}
            </div>
          </div>

          {/* Status and Progress Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <BarChart2 className="w-4 h-4" />
                Status
              </label>
              <select
                value={formData.statusId}
                onChange={(e) => handleChange('statusId', e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No status</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <BarChart2 className="w-4 h-4" />
                Progress (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => handleChange('progress', parseInt(e.target.value) || 0)}
                className={cn(
                  'w-full px-3 py-2 border rounded-md text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.progress && 'border-red-500'
                )}
              />
              {errors.progress && <p className="text-xs text-red-600 mt-1">{errors.progress}</p>}
            </div>
          </div>

          {/* Owner and Group Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <User className="w-4 h-4" />
                Owner
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => handleChange('owner', e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Assign to..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Folder className="w-4 h-4" />
                Group
              </label>
              <input
                type="text"
                value={formData.group}
                onChange={(e) => handleChange('group', e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Team or department..."
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Add task description..."
            />
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Save className="w-4 h-4 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
