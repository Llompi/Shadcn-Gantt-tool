"use client"

/**
 * Field Mapping Component
 *
 * Allows users to map Baserow table fields to Gantt chart fields
 * with intelligent auto-detection and validation.
 */

import React, { useEffect, useState } from 'react'
import {
  BaserowFieldMetadata,
  detectTaskFieldMappings,
  detectStatusFieldMappings,
  validateFieldMapping,
  FieldSuggestion
} from '@/lib/providers/baserow/field-detector'
import { BaserowFieldMapping } from '@/lib/providers/baserow/field-mapping'

interface FieldMapperProps {
  taskFields: BaserowFieldMetadata[]
  statusFields: BaserowFieldMetadata[]
  initialMapping?: Partial<BaserowFieldMapping>
  onChange: (mapping: Partial<BaserowFieldMapping>) => void
}

interface FieldOption {
  label: string
  value: string
  confidence?: number
  reason?: string
}

export function FieldMapper({
  taskFields,
  statusFields,
  initialMapping,
  onChange,
}: FieldMapperProps) {
  const [taskMapping, setTaskMapping] = useState({
    id: initialMapping?.tasks?.id || '',
    name: initialMapping?.tasks?.name || '',
    startAt: initialMapping?.tasks?.startAt || '',
    endAt: initialMapping?.tasks?.endAt || '',
    status: initialMapping?.tasks?.status || '',
    group: initialMapping?.tasks?.group || '',
    owner: initialMapping?.tasks?.owner || '',
    description: initialMapping?.tasks?.description || '',
    progress: initialMapping?.tasks?.progress || '',
  })

  const [statusMapping, setStatusMapping] = useState({
    id: initialMapping?.statuses?.id || '',
    name: initialMapping?.statuses?.name || '',
    color: initialMapping?.statuses?.color || '',
  })

  const [suggestions, setSuggestions] = useState<{
    tasks: ReturnType<typeof detectTaskFieldMappings>
    statuses: ReturnType<typeof detectStatusFieldMappings>
  } | null>(null)

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Auto-detect field mappings on mount
  useEffect(() => {
    if (taskFields.length > 0 && statusFields.length > 0) {
      const taskSuggestions = detectTaskFieldMappings(taskFields)
      const statusSuggestions = detectStatusFieldMappings(statusFields)

      setSuggestions({
        tasks: taskSuggestions,
        statuses: statusSuggestions,
      })

      // Auto-fill with best suggestions if no initial mapping
      if (!initialMapping) {
        const autoTaskMapping = {
          id: taskSuggestions.id[0]?.field.name || 'id',
          name: taskSuggestions.name[0]?.field.name || '',
          startAt: taskSuggestions.startAt[0]?.field.name || '',
          endAt: taskSuggestions.endAt[0]?.field.name || '',
          status: taskSuggestions.status[0]?.field.name || '',
          group: taskSuggestions.group?.[0]?.field.name || '',
          owner: taskSuggestions.owner?.[0]?.field.name || '',
          description: taskSuggestions.description?.[0]?.field.name || '',
          progress: taskSuggestions.progress?.[0]?.field.name || '',
        }

        const autoStatusMapping = {
          id: statusSuggestions.id[0]?.field.name || 'id',
          name: statusSuggestions.name[0]?.field.name || '',
          color: statusSuggestions.color?.[0]?.field.name || '',
        }

        setTaskMapping(autoTaskMapping)
        setStatusMapping(autoStatusMapping)
      }
    }
  }, [taskFields, statusFields, initialMapping])

  // Validate and notify parent of changes
  useEffect(() => {
    const mapping: Partial<BaserowFieldMapping> = {
      tasks: {
        ...taskMapping,
        createdAt: 'created_on',
        updatedAt: 'updated_on',
      },
      statuses: statusMapping,
    }

    const validation = validateFieldMapping(mapping)
    setValidationErrors(validation.errors)

    if (validation.valid) {
      onChange(mapping)
    }
  }, [taskMapping, statusMapping, onChange])

  const getFieldOptions = (
    fields: BaserowFieldMetadata[],
    fieldSuggestions?: FieldSuggestion[]
  ): FieldOption[] => {
    const options: FieldOption[] = [{ label: '-- Not mapped --', value: '' }]

    // Add all fields with their confidence scores if available
    for (const field of fields) {
      const suggestion = fieldSuggestions?.find(s => s.field.id === field.id)
      options.push({
        label: `${field.name} (${field.type})${suggestion ? ` - ${Math.round(suggestion.confidence * 100)}% match` : ''}`,
        value: field.name,
        confidence: suggestion?.confidence,
        reason: suggestion?.reason,
      })
    }

    // Sort by confidence (if available)
    return options.sort((a, b) => {
      if (!a.confidence && !b.confidence) return 0
      if (!a.confidence) return 1
      if (!b.confidence) return -1
      return b.confidence - a.confidence
    })
  }

  const getConfidenceBadge = (fieldName: string, suggestions?: FieldSuggestion[]) => {
    if (!suggestions || !fieldName) return null

    const suggestion = suggestions.find(s => s.field.name === fieldName)
    if (!suggestion || suggestion.confidence < 0.5) return null

    const confidence = Math.round(suggestion.confidence * 100)
    const color = confidence >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'

    return (
      <span className={`ml-2 px-2 py-1 text-xs rounded ${color}`} title={suggestion.reason}>
        {confidence}% match
      </span>
    )
  }

  const renderFieldSelect = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: FieldOption[],
    required: boolean = false,
    suggestions?: FieldSuggestion[]
  ) => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`flex-1 px-3 py-2 border rounded-md ${
              required && !value ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {getConfidenceBadge(value, suggestions)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Auto-detected Field Mappings</h3>
            <p className="mt-1 text-sm text-blue-700">
              We&apos;ve automatically detected the best field matches based on field names and types.
              Review and adjust the mappings below. Required fields are marked with *.
            </p>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Mapping Incomplete</h3>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {validationErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Task Fields Mapping */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">📋</span>
          Task Fields Mapping
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderFieldSelect(
            'Task ID',
            taskMapping.id,
            (v) => setTaskMapping({ ...taskMapping, id: v }),
            getFieldOptions(taskFields, suggestions?.tasks.id),
            true,
            suggestions?.tasks.id
          )}
          {renderFieldSelect(
            'Task Name',
            taskMapping.name,
            (v) => setTaskMapping({ ...taskMapping, name: v }),
            getFieldOptions(taskFields, suggestions?.tasks.name),
            true,
            suggestions?.tasks.name
          )}
          {renderFieldSelect(
            'Start Date',
            taskMapping.startAt,
            (v) => setTaskMapping({ ...taskMapping, startAt: v }),
            getFieldOptions(taskFields, suggestions?.tasks.startAt),
            true,
            suggestions?.tasks.startAt
          )}
          {renderFieldSelect(
            'End Date',
            taskMapping.endAt,
            (v) => setTaskMapping({ ...taskMapping, endAt: v }),
            getFieldOptions(taskFields, suggestions?.tasks.endAt),
            true,
            suggestions?.tasks.endAt
          )}
          {renderFieldSelect(
            'Status',
            taskMapping.status,
            (v) => setTaskMapping({ ...taskMapping, status: v }),
            getFieldOptions(taskFields, suggestions?.tasks.status),
            false,
            suggestions?.tasks.status
          )}
          {renderFieldSelect(
            'Group',
            taskMapping.group,
            (v) => setTaskMapping({ ...taskMapping, group: v }),
            getFieldOptions(taskFields, suggestions?.tasks.group),
            false,
            suggestions?.tasks.group
          )}
          {renderFieldSelect(
            'Owner',
            taskMapping.owner,
            (v) => setTaskMapping({ ...taskMapping, owner: v }),
            getFieldOptions(taskFields, suggestions?.tasks.owner),
            false,
            suggestions?.tasks.owner
          )}
          {renderFieldSelect(
            'Description',
            taskMapping.description,
            (v) => setTaskMapping({ ...taskMapping, description: v }),
            getFieldOptions(taskFields, suggestions?.tasks.description),
            false,
            suggestions?.tasks.description
          )}
          {renderFieldSelect(
            'Progress',
            taskMapping.progress,
            (v) => setTaskMapping({ ...taskMapping, progress: v }),
            getFieldOptions(taskFields, suggestions?.tasks.progress),
            false,
            suggestions?.tasks.progress
          )}
        </div>
      </div>

      {/* Status Fields Mapping */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🏷️</span>
          Status Fields Mapping
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderFieldSelect(
            'Status ID',
            statusMapping.id,
            (v) => setStatusMapping({ ...statusMapping, id: v }),
            getFieldOptions(statusFields, suggestions?.statuses.id),
            true,
            suggestions?.statuses.id
          )}
          {renderFieldSelect(
            'Status Name',
            statusMapping.name,
            (v) => setStatusMapping({ ...statusMapping, name: v }),
            getFieldOptions(statusFields, suggestions?.statuses.name),
            true,
            suggestions?.statuses.name
          )}
          {renderFieldSelect(
            'Status Color',
            statusMapping.color,
            (v) => setStatusMapping({ ...statusMapping, color: v }),
            getFieldOptions(statusFields, suggestions?.statuses.color),
            false,
            suggestions?.statuses.color
          )}
        </div>
      </div>

      {/* Mapping Summary */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Mapping Summary</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div><strong>Required fields mapped:</strong> {
            [taskMapping.id, taskMapping.name, taskMapping.startAt, taskMapping.endAt, statusMapping.id, statusMapping.name]
              .filter(Boolean).length
          } / 6</div>
          <div><strong>Optional fields mapped:</strong> {
            [taskMapping.status, taskMapping.group, taskMapping.owner, taskMapping.description, taskMapping.progress, statusMapping.color]
              .filter(Boolean).length
          } / 6</div>
        </div>
      </div>
    </div>
  )
}
