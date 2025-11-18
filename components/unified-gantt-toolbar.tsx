'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  FolderTree,
  X,
  ChevronDown,
  Download,
  Upload,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/task'
import { SortConfig, FilterConfig, GroupConfig } from '@/components/table-toolbar'

export type TimescaleType = "day" | "week" | "month" | "quarter"

interface UnifiedGanttToolbarProps {
  // Search
  searchQuery: string
  onSearchChange: (query: string) => void

  // Filter/Sort/Group
  sortConfig: SortConfig | null
  onSortChange: (config: SortConfig | null) => void
  filterConfigs: FilterConfig[]
  onFilterChange: (configs: FilterConfig[]) => void
  groupConfig: GroupConfig | null
  onGroupChange: (config: GroupConfig | null) => void
  availableFields: Array<{ key: string; label: string; type: 'string' | 'number' | 'date' }>

  // Export/Import
  onExportCSV: () => void
  onExportExcel: () => void
  onImportClick: () => void

  // Column visibility
  columnVisibility: Record<string, boolean>
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void

  // Gantt controls
  viewStart: Date
  viewEnd: Date
  timescale: TimescaleType
  onTimescaleChange: (scale: TimescaleType) => void
  onShiftView: (days: number) => void
  onGoToToday: () => void

  className?: string
}

export function UnifiedGanttToolbar({
  searchQuery,
  onSearchChange,
  sortConfig,
  onSortChange,
  filterConfigs,
  onFilterChange,
  groupConfig,
  onGroupChange,
  availableFields,
  onExportCSV,
  onExportExcel,
  onImportClick,
  columnVisibility,
  onColumnVisibilityChange,
  viewStart,
  viewEnd,
  timescale,
  onTimescaleChange,
  onShiftView,
  onGoToToday,
  className,
}: UnifiedGanttToolbarProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [showGroup, setShowGroup] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showColumns, setShowColumns] = useState(false)

  const exportRef = useRef<HTMLDivElement>(null)
  const columnsRef = useRef<HTMLDivElement>(null)

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExport(false)
      }
      if (columnsRef.current && !columnsRef.current.contains(event.target as Node)) {
        setShowColumns(false)
      }
    }

    if (showExport || showColumns) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExport, showColumns])

  const activeFiltersCount = filterConfigs.filter(f => f.value !== '').length
  const hasActiveSort = sortConfig !== null
  const hasActiveGroup = groupConfig !== null

  const handleAddFilter = () => {
    const newFilter: FilterConfig = {
      field: availableFields[0]?.key || 'name',
      operator: 'contains',
      value: '',
    }
    onFilterChange([...filterConfigs, newFilter])
  }

  const handleRemoveFilter = (index: number) => {
    const newFilters = filterConfigs.filter((_, i) => i !== index)
    onFilterChange(newFilters)
  }

  const handleUpdateFilter = (index: number, updates: Partial<FilterConfig>) => {
    const newFilters = filterConfigs.map((filter, i) =>
      i === index ? { ...filter, ...updates } : filter
    )
    onFilterChange(newFilters)
  }

  const handleSort = (field: string) => {
    if (sortConfig?.field === field) {
      if (sortConfig.direction === 'asc') {
        onSortChange({ field, direction: 'desc' })
      } else {
        onSortChange(null)
      }
    } else {
      onSortChange({ field, direction: 'asc' })
    }
  }

  return (
    <div className={cn('border-b bg-background', className)}>
      {/* Main Compact Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        {/* Left: Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Center: View Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 border rounded text-xs font-medium transition-colors',
              showFilters || activeFiltersCount > 0 ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            )}
            title="Filter"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {activeFiltersCount > 0 && (
              <span className="px-1 py-0.5 bg-background/20 rounded text-[10px]">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowSort(!showSort)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 border rounded text-xs font-medium transition-colors',
              showSort || hasActiveSort ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            )}
            title="Sort"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {hasActiveSort && (
              <span className="text-[10px]">
                {sortConfig.direction === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowGroup(!showGroup)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 border rounded text-xs font-medium transition-colors',
              showGroup || hasActiveGroup ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            )}
            title="Group"
          >
            <FolderTree className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Right: Export/Import/Columns */}
        <div className="flex items-center gap-1">
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border rounded text-xs hover:bg-accent transition-colors"
              title="Export"
            >
              <Download className="w-3.5 h-3.5" />
              <ChevronDown className="w-3 h-3" />
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-background border rounded-lg shadow-lg z-50 py-1">
                <button
                  onClick={() => {
                    onExportCSV()
                    setShowExport(false)
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent transition-colors"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    onExportExcel()
                    setShowExport(false)
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent transition-colors"
                >
                  Export Excel
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onImportClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border rounded text-xs hover:bg-accent transition-colors"
            title="Import"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <div ref={columnsRef} className="relative">
            <button
              onClick={() => setShowColumns(!showColumns)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border rounded text-xs hover:bg-accent transition-colors"
              title="Columns"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            {showColumns && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-background border rounded-lg shadow-lg z-50 p-2">
                <div className="text-[10px] font-semibold text-muted-foreground mb-1.5 px-2">Show/Hide</div>
                {Object.entries(columnVisibility).map(([col, visible]) => (
                  <label
                    key={col}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-accent rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={(e) => onColumnVisibilityChange({ ...columnVisibility, [col]: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs capitalize">
                      {col === 'start' ? 'Start Date' : col === 'end' ? 'End Date' : col}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Gantt Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onShiftView(-7)}
            className="p-1.5 hover:bg-accent rounded transition-colors"
            title="Previous week"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onGoToToday}
            className="px-2.5 py-1.5 text-xs border rounded hover:bg-accent transition-colors"
            title="Go to today"
          >
            <Calendar className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onShiftView(7)}
            className="p-1.5 hover:bg-accent rounded transition-colors"
            title="Next week"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Timescale */}
        <div className="flex items-center gap-0.5">
          {(['day', 'week', 'month', 'quarter'] as TimescaleType[]).map((scale) => (
            <button
              key={scale}
              onClick={() => onTimescaleChange(scale)}
              className={cn(
                'px-2 py-1.5 text-[11px] font-medium rounded transition-colors',
                timescale === scale
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
              title={`${scale.charAt(0).toUpperCase() + scale.slice(1)} view`}
            >
              {scale.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>

        {/* Clear All */}
        {(searchQuery || activeFiltersCount > 0 || hasActiveSort || hasActiveGroup) && (
          <>
            <div className="h-5 w-px bg-border" />
            <button
              onClick={() => {
                onSearchChange('')
                onFilterChange([])
                onSortChange(null)
                onGroupChange(null)
              }}
              className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* Expandable Panels */}
      {showFilters && (
        <div className="px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold">Filters</h3>
            <button
              onClick={handleAddFilter}
              className="text-[11px] text-primary hover:underline"
            >
              + Add filter
            </button>
          </div>
          {filterConfigs.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No filters applied. Click &quot;Add filter&quot; to start.
            </p>
          ) : (
            <div className="space-y-2">
              {filterConfigs.map((filter, index) => {
                const field = availableFields.find(f => f.key === filter.field)
                return (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={filter.field}
                      onChange={(e) => handleUpdateFilter(index, { field: e.target.value })}
                      className="px-2 py-1 border rounded text-xs"
                    >
                      {availableFields.map((field) => (
                        <option key={field.key} value={field.key}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filter.operator}
                      onChange={(e) => handleUpdateFilter(index, { operator: e.target.value as FilterConfig['operator'] })}
                      className="px-2 py-1 border rounded text-xs"
                    >
                      <option value="equals">equals</option>
                      <option value="contains">contains</option>
                      {field?.type === 'number' && (
                        <>
                          <option value="greaterThan">greater than</option>
                          <option value="lessThan">less than</option>
                        </>
                      )}
                    </select>
                    <input
                      type={field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'}
                      value={filter.value as string}
                      onChange={(e) => handleUpdateFilter(index, { value: e.target.value })}
                      className="flex-1 px-2 py-1 border rounded text-xs"
                      placeholder="Value..."
                    />
                    <button
                      onClick={() => handleRemoveFilter(index)}
                      className="p-1 hover:bg-accent rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showSort && (
        <div className="px-4 py-3 border-b bg-muted/30">
          <h3 className="text-xs font-semibold mb-2">Sort By</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {availableFields.map((field) => {
              const isActive = sortConfig?.field === field.key
              const direction = isActive ? sortConfig.direction : null
              return (
                <button
                  key={field.key}
                  onClick={() => handleSort(field.key)}
                  className={cn(
                    'px-2 py-1.5 text-xs border rounded flex items-center justify-between transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  )}
                >
                  <span>{field.label}</span>
                  {direction && (
                    <span className="text-[10px]">
                      {direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {showGroup && (
        <div className="px-4 py-3 border-b bg-muted/30">
          <h3 className="text-xs font-semibold mb-2">Group By</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {availableFields
              .filter(f => f.type === 'string')
              .map((field) => {
                const isActive = groupConfig?.field === field.key
                return (
                  <button
                    key={field.key}
                    onClick={() => onGroupChange(isActive ? null : { field: field.key })}
                    className={cn(
                      'px-2 py-1.5 text-xs border rounded transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    )}
                  >
                    {field.label}
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
