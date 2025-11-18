'use client'

import React, { useState } from 'react'
import {
  Database,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  Palette,
  Type,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FieldMapping {
  sourceField: string
  targetField: 'name' | 'startAt' | 'endAt' | 'status' | 'group' | 'owner' | 'description' | 'progress' | 'priority' | 'tags'
  transform?: 'date' | 'number' | 'string' | 'boolean' | 'json'
  defaultValue?: string
  required?: boolean
}

export interface ColorRule {
  id: string
  field: string
  condition: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan'
  value: string
  color: string
}

export interface TextTemplate {
  field: 'primary' | 'secondary' | 'tooltip'
  template: string
  fields: string[]
}

export interface ValidationError {
  row: number
  field: string
  error: string
  value?: unknown
}

interface DataFieldMapperProps {
  sourceFields: string[]
  sourceData: Record<string, unknown>[]
  onMappingChange?: (mappings: FieldMapping[]) => void
  onColorRulesChange?: (rules: ColorRule[]) => void
  onTextTemplatesChange?: (templates: TextTemplate[]) => void
  className?: string
}

const TARGET_FIELDS = [
  { name: 'name', label: 'Task Name', type: 'string', required: true },
  { name: 'startAt', label: 'Start Date', type: 'date', required: true },
  { name: 'endAt', label: 'End Date', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'string', required: false },
  { name: 'group', label: 'Group', type: 'string', required: false },
  { name: 'owner', label: 'Owner', type: 'string', required: false },
  { name: 'description', label: 'Description', type: 'string', required: false },
  { name: 'progress', label: 'Progress', type: 'number', required: false },
  { name: 'priority', label: 'Priority', type: 'string', required: false },
  { name: 'tags', label: 'Tags', type: 'json', required: false },
] as const

export function DataFieldMapper({
  sourceFields,
  sourceData,
  onMappingChange,
  onColorRulesChange,
  onTextTemplatesChange,
  className,
}: DataFieldMapperProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [colorRules, setColorRules] = useState<ColorRule[]>([])
  const [textTemplates, setTextTemplates] = useState<TextTemplate[]>([
    { field: 'primary', template: '{name}', fields: ['name'] },
  ])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [draggedField, setDraggedField] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<'mapping' | 'color' | 'text' | null>('mapping')

  // Validate data with current mappings
  const validateData = React.useCallback(() => {
    const errors: ValidationError[] = []

    sourceData.forEach((row, index) => {
      mappings.forEach((mapping) => {
        const value = row[mapping.sourceField]
        const targetField = TARGET_FIELDS.find((f) => f.name === mapping.targetField)

        // Check required fields
        if (targetField?.required && (value === null || value === undefined || value === '')) {
          errors.push({
            row: index + 1,
            field: mapping.targetField,
            error: `Required field is missing`,
            value,
          })
        }

        // Type validation
        if (value !== null && value !== undefined && value !== '') {
          switch (targetField?.type) {
            case 'date':
              if (isNaN(new Date(value as string).getTime())) {
                errors.push({
                  row: index + 1,
                  field: mapping.targetField,
                  error: 'Invalid date format',
                  value,
                })
              }
              break
            case 'number':
              if (isNaN(Number(value))) {
                errors.push({
                  row: index + 1,
                  field: mapping.targetField,
                  error: 'Invalid number format',
                  value,
                })
              }
              break
          }
        }
      })
    })

    setValidationErrors(errors)
    return errors
  }, [mappings, sourceData])

  // Add field mapping
  const addMapping = (sourceField: string, targetField: string) => {
    const existingIndex = mappings.findIndex((m) => m.targetField === targetField)
    const newMapping: FieldMapping = {
      sourceField,
      targetField: targetField as FieldMapping['targetField'],
      required: TARGET_FIELDS.find((f) => f.name === targetField)?.required,
    }

    let newMappings: FieldMapping[]
    if (existingIndex >= 0) {
      // Replace existing mapping
      newMappings = [...mappings]
      newMappings[existingIndex] = newMapping
    } else {
      // Add new mapping
      newMappings = [...mappings, newMapping]
    }

    setMappings(newMappings)
    onMappingChange?.(newMappings)
    setTimeout(validateData, 100)
  }

  // Remove mapping
  const removeMapping = (targetField: string) => {
    const newMappings = mappings.filter((m) => m.targetField !== targetField)
    setMappings(newMappings)
    onMappingChange?.(newMappings)
    setTimeout(validateData, 100)
  }

  // Add color rule
  const addColorRule = () => {
    const newRule: ColorRule = {
      id: `rule_${Date.now()}`,
      field: sourceFields[0] || 'status',
      condition: 'equals',
      value: '',
      color: '#3b82f6',
    }
    const newRules = [...colorRules, newRule]
    setColorRules(newRules)
    onColorRulesChange?.(newRules)
  }

  // Update color rule
  const updateColorRule = (id: string, updates: Partial<ColorRule>) => {
    const newRules = colorRules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule))
    setColorRules(newRules)
    onColorRulesChange?.(newRules)
  }

  // Remove color rule
  const removeColorRule = (id: string) => {
    const newRules = colorRules.filter((rule) => rule.id !== id)
    setColorRules(newRules)
    onColorRulesChange?.(newRules)
  }

  // Update text template
  const updateTextTemplate = (field: TextTemplate['field'], template: string) => {
    const fields = template.match(/\{([^}]+)\}/g)?.map((f) => f.slice(1, -1)) || []
    const newTemplates = textTemplates.map((t) =>
      t.field === field ? { ...t, template, fields } : t
    )
    setTextTemplates(newTemplates)
    onTextTemplatesChange?.(newTemplates)
  }

  // Drag and drop handlers
  const handleDragStart = (field: string) => {
    setDraggedField(field)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetField: string) => {
    if (draggedField) {
      addMapping(draggedField, targetField)
      setDraggedField(null)
    }
  }

  // Get mapped source field for a target
  const getMappedSourceField = (targetField: string) => {
    return mappings.find((m) => m.targetField === targetField)?.sourceField
  }

  // Get validation errors for a field
  const getFieldErrors = (targetField: string) => {
    return validationErrors.filter((e) => e.field === targetField)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Field Mapping Section */}
      <div className="glass-panel-strong">
        <button
          onClick={() => setExpandedSection(expandedSection === 'mapping' ? null : 'mapping')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-primary" />
            <div className="text-left">
              <h3 className="text-lg font-semibold">Field Mapping</h3>
              <p className="text-sm text-muted-foreground">
                Drag fields from your data to Gantt chart fields
              </p>
            </div>
          </div>
          {expandedSection === 'mapping' ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {expandedSection === 'mapping' && (
          <div className="p-4 pt-0 space-y-4">
            {/* Source Fields (draggable) */}
            <div>
              <div className="text-sm font-medium mb-2">Available Fields</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {sourceFields.map((field) => (
                  <div
                    key={field}
                    draggable
                    onDragStart={() => handleDragStart(field)}
                    className={cn(
                      'px-3 py-2 rounded-lg border border-border bg-background cursor-move hover:bg-accent hover:border-primary transition-all',
                      draggedField === field && 'opacity-50 scale-95'
                    )}
                  >
                    <div className="text-xs font-medium truncate">{field}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Fields (drop zones) */}
            <div>
              <div className="text-sm font-medium mb-2">Gantt Chart Fields</div>
              <div className="space-y-2">
                {TARGET_FIELDS.map((targetField) => {
                  const mappedField = getMappedSourceField(targetField.name)
                  const errors = getFieldErrors(targetField.name)

                  return (
                    <div
                      key={targetField.name}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(targetField.name)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border-2 border-dashed transition-all',
                        mappedField
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:border-primary/50 hover:bg-accent/50',
                        errors.length > 0 && 'border-destructive bg-destructive/5'
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{targetField.label}</span>
                          {targetField.required && (
                            <span className="text-xs text-destructive">*</span>
                          )}
                          <span className="text-xs text-muted-foreground">({targetField.type})</span>
                        </div>
                        {mappedField && (
                          <div className="flex items-center gap-2 mt-1">
                            <ArrowRight className="w-3 h-3 text-primary" />
                            <span className="text-xs text-muted-foreground">{mappedField}</span>
                          </div>
                        )}
                        {errors.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                            <AlertCircle className="w-3 h-3" />
                            {errors.length} error{errors.length > 1 ? 's' : ''} found
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {mappedField ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <button
                              onClick={() => removeMapping(targetField.name)}
                              className="p-1 hover:bg-destructive/10 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </>
                        ) : (
                          <div className="text-xs text-muted-foreground">Drop here</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Validation Summary */}
            {validationErrors.length > 0 && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="font-semibold text-destructive">
                    {validationErrors.length} Validation Error
                    {validationErrors.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {validationErrors.slice(0, 10).map((error, i) => (
                    <div key={i} className="text-xs text-destructive">
                      Row {error.row}, {error.field}: {error.error}
                      {error.value !== undefined && ` (value: ${JSON.stringify(error.value)})`}
                    </div>
                  ))}
                  {validationErrors.length > 10 && (
                    <div className="text-xs text-muted-foreground">
                      ... and {validationErrors.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Color Rules Section */}
      <div className="glass-panel-strong">
        <button
          onClick={() => setExpandedSection(expandedSection === 'color' ? null : 'color')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-primary" />
            <div className="text-left">
              <h3 className="text-lg font-semibold">Color Coding</h3>
              <p className="text-sm text-muted-foreground">
                Define rules to color-code tasks based on data
              </p>
            </div>
          </div>
          {expandedSection === 'color' ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {expandedSection === 'color' && (
          <div className="p-4 pt-0 space-y-3">
            {colorRules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-2 p-3 rounded-lg bg-accent/50">
                <select
                  value={rule.field}
                  onChange={(e) => updateColorRule(rule.id, { field: e.target.value })}
                  className="modern-input flex-1"
                >
                  {sourceFields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>

                <select
                  value={rule.condition}
                  onChange={(e) =>
                    updateColorRule(rule.id, { condition: e.target.value as ColorRule['condition'] })
                  }
                  className="modern-input"
                >
                  <option value="equals">equals</option>
                  <option value="contains">contains</option>
                  <option value="startsWith">starts with</option>
                  <option value="endsWith">ends with</option>
                  <option value="greaterThan">&gt;</option>
                  <option value="lessThan">&lt;</option>
                </select>

                <input
                  type="text"
                  value={rule.value}
                  onChange={(e) => updateColorRule(rule.id, { value: e.target.value })}
                  placeholder="Value"
                  className="modern-input flex-1"
                />

                <input
                  type="color"
                  value={rule.color}
                  onChange={(e) => updateColorRule(rule.id, { color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />

                <button
                  onClick={() => removeColorRule(rule.id)}
                  className="p-2 hover:bg-destructive/10 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}

            <button
              onClick={addColorRule}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-accent transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Color Rule
            </button>
          </div>
        )}
      </div>

      {/* Text Templates Section */}
      <div className="glass-panel-strong">
        <button
          onClick={() => setExpandedSection(expandedSection === 'text' ? null : 'text')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Type className="w-5 h-5 text-primary" />
            <div className="text-left">
              <h3 className="text-lg font-semibold">Text Templates</h3>
              <p className="text-sm text-muted-foreground">
                Customize how text appears on task bars
              </p>
            </div>
          </div>
          {expandedSection === 'text' ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {expandedSection === 'text' && (
          <div className="p-4 pt-0 space-y-4">
            {textTemplates.map((template) => (
              <div key={template.field}>
                <label className="text-sm font-medium mb-1 block capitalize">
                  {template.field} Text
                </label>
                <input
                  type="text"
                  value={template.template}
                  onChange={(e) => updateTextTemplate(template.field, e.target.value)}
                  placeholder="Use {fieldName} for dynamic values"
                  className="modern-input"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Available fields: {sourceFields.map((f) => `{${f}}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
