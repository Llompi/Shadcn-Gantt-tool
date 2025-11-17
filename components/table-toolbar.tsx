'use client'

import React, { useState } from 'react'
import { Search, SlidersHorizontal, ArrowUpDown, FolderTree, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/task'

export interface SortConfig {
  field: keyof Task | string
  direction: 'asc' | 'desc'
}

export interface FilterConfig {
  field: keyof Task | string
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between'
  value: string | number | [string, string] | [number, number]
}

export interface GroupConfig {
  field: keyof Task | string
}

interface TableToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  sortConfig: SortConfig | null
  onSortChange: (config: SortConfig | null) => void
  filterConfigs: FilterConfig[]
  onFilterChange: (configs: FilterConfig[]) => void
  groupConfig: GroupConfig | null
  onGroupChange: (config: GroupConfig | null) => void
  availableFields: Array<{ key: string; label: string; type: 'string' | 'number' | 'date' }>
  className?: string
}

export function TableToolbar({
  searchQuery,
  onSearchChange,
  sortConfig,
  onSortChange,
  filterConfigs,
  onFilterChange,
  groupConfig,
  onGroupChange,
  availableFields,
  className,
}: TableToolbarProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [showGroup, setShowGroup] = useState(false)

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
      // Toggle direction or clear
      if (sortConfig.direction === 'asc') {
        onSortChange({ field, direction: 'desc' })
      } else {
        onSortChange(null)
      }
    } else {
      onSortChange({ field, direction: 'asc' })
    }
  }

  const activeFiltersCount = filterConfigs.filter(f => f.value !== '').length
  const hasActiveSort = sortConfig !== null
  const hasActiveGroup = groupConfig !== null

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Toolbar */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-colors',
            showFilters || activeFiltersCount > 0 ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {activeFiltersCount > 0 && (
            <span className="px-1.5 py-0.5 bg-background/20 rounded text-xs">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Sort Button */}
        <button
          onClick={() => setShowSort(!showSort)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-colors',
            showSort || hasActiveSort ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          )}
        >
          <ArrowUpDown className="w-4 h-4" />
          Sort
          {hasActiveSort && (
            <span className="text-xs">
              ({sortConfig.direction === 'asc' ? '↑' : '↓'})
            </span>
          )}
        </button>

        {/* Group Button */}
        <button
          onClick={() => setShowGroup(!showGroup)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-colors',
            showGroup || hasActiveGroup ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          )}
        >
          <FolderTree className="w-4 h-4" />
          Group
          {hasActiveGroup && <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Clear All */}
        {(searchQuery || activeFiltersCount > 0 || hasActiveSort || hasActiveGroup) && (
          <button
            onClick={() => {
              onSearchChange('')
              onFilterChange([])
              onSortChange(null)
              onGroupChange(null)
            }}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 border rounded-md bg-muted/50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Filters</h3>
            <button
              onClick={handleAddFilter}
              className="text-xs text-primary hover:underline"
            >
              + Add filter
            </button>
          </div>

          {filterConfigs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
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
                      className="px-2 py-1.5 border rounded text-sm"
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
                      className="px-2 py-1.5 border rounded text-sm"
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
                      className="flex-1 px-2 py-1.5 border rounded text-sm"
                      placeholder="Value..."
                    />

                    <button
                      onClick={() => handleRemoveFilter(index)}
                      className="p-1.5 hover:bg-accent rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Sort Panel */}
      {showSort && (
        <div className="p-4 border rounded-md bg-muted/50 space-y-3">
          <h3 className="text-sm font-semibold">Sort By</h3>
          <div className="grid grid-cols-2 gap-2">
            {availableFields.map((field) => {
              const isActive = sortConfig?.field === field.key
              const direction = isActive ? sortConfig.direction : null
              return (
                <button
                  key={field.key}
                  onClick={() => handleSort(field.key)}
                  className={cn(
                    'px-3 py-2 text-sm border rounded flex items-center justify-between transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  )}
                >
                  <span>{field.label}</span>
                  {direction && (
                    <span className="text-xs">
                      {direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Group Panel */}
      {showGroup && (
        <div className="p-4 border rounded-md bg-muted/50 space-y-3">
          <h3 className="text-sm font-semibold">Group By</h3>
          <div className="grid grid-cols-2 gap-2">
            {availableFields
              .filter(f => f.type === 'string') // Only allow string fields for grouping
              .map((field) => {
                const isActive = groupConfig?.field === field.key
                return (
                  <button
                    key={field.key}
                    onClick={() => onGroupChange(isActive ? null : { field: field.key })}
                    className={cn(
                      'px-3 py-2 text-sm border rounded transition-colors',
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
