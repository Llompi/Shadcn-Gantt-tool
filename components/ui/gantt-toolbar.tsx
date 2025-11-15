'use client'

import React, { useState } from 'react'
import {
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Map,
  Undo2,
  Redo2,
  Download,
  Upload,
  Settings,
  Calendar,
  Users,
  GitBranch,
  Eye,
  Grid,
  List,
} from 'lucide-react'
import { useGanttUIStore } from '@/lib/stores/gantt-ui-store'
import { useVersionControlStore } from '@/lib/stores/version-control-store'
import { GanttViewConfig } from '@/types/task'

interface GanttToolbarProps {
  onSearch?: (query: string) => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitToScreen?: () => void
  onToggleMinimap?: () => void
  onExport?: () => void
  onImport?: () => void
  onOpenSettings?: () => void
}

export function GanttToolbar({
  onSearch,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onToggleMinimap,
  onExport,
  onImport,
  onOpenSettings,
}: GanttToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const {
    viewConfig,
    miniMapVisible,
    searchQuery,
    setSearchQuery,
    setScale,
    toggleDependencies,
    toggleCriticalPath,
    toggleMilestones,
    toggleResources,
    toggleWeekends,
    toggleMiniMap,
  } = useGanttUIStore()

  const { canUndo, canRedo, undo, redo } = useVersionControlStore()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch?.(query)
  }

  const scales: Array<{ value: typeof viewConfig.scale; label: string }> = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
  ]

  return (
    <div className="glass-card border-b border-border/50">
      {/* Main Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4">
        {/* Left Section - Main Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            {searchOpen ? (
              <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl animate-scale-in">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search tasks..."
                  className="bg-transparent border-none outline-none w-64 text-sm"
                  autoFocus
                  onBlur={() => {
                    if (!searchQuery) setSearchOpen(false)
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 hover:bg-muted rounded-xl transition-all duration-200 hover:scale-105"
                title="Search (Ctrl+F)"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="relative">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`p-2 hover:bg-muted rounded-xl transition-all duration-200 hover:scale-105 ${
                filtersOpen ? 'bg-muted' : ''
              }`}
              title="Filters"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Version Control */}
          <button
            onClick={() => undo()}
            disabled={!canUndo}
            className="p-2 hover:bg-muted rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => redo()}
            disabled={!canRedo}
            className="p-2 hover:bg-muted rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-border" />

          {/* View Controls */}
          <button
            onClick={onZoomIn}
            className="p-2 hover:bg-muted rounded-xl transition-all duration-200 hover:scale-105"
            title="Zoom In (Ctrl++)"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={onZoomOut}
            className="p-2 hover:bg-muted rounded-xl transition-all duration-200 hover:scale-105"
            title="Zoom Out (Ctrl+-)"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={onFitToScreen}
            className="p-2 hover:bg-muted rounded-xl transition-all duration-200 hover:scale-105"
            title="Fit to Screen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              toggleMiniMap()
              onToggleMinimap?.()
            }}
            className={`p-2 hover:bg-muted rounded-xl transition-all duration-200 hover:scale-105 ${
              miniMapVisible ? 'bg-primary/10 text-primary' : ''
            }`}
            title="Toggle Minimap"
          >
            <Map className="w-5 h-5" />
          </button>
        </div>

        {/* Center Section - Scale Selector */}
        <div className="flex items-center gap-1 glass px-2 py-1 rounded-xl">
          {scales.map((scale) => (
            <button
              key={scale.value}
              onClick={() => setScale(scale.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewConfig.scale === scale.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted'
              }`}
            >
              {scale.label}
            </button>
          ))}
        </div>

        {/* Right Section - Additional Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onImport}
            className="p-2 hover:bg-muted rounded-xl transition-all duration-200 hover:scale-105"
            title="Import Data"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            onClick={onExport}
            className="p-2 hover:bg-muted rounded-xl transition-all duration-200 hover:scale-105"
            title="Export Data"
          >
            <Download className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-border" />

          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-muted rounded-xl transition-all duration-200 hover:scale-105"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {filtersOpen && (
        <div className="border-t border-border/50 p-4 animate-slide-in bg-muted/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Show/Hide Options */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Display
              </h4>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={viewConfig.showDependencies}
                  onChange={toggleDependencies}
                  className="rounded"
                />
                <GitBranch className="w-4 h-4" />
                Dependencies
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={viewConfig.showCriticalPath}
                  onChange={toggleCriticalPath}
                  className="rounded"
                />
                Critical Path
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={viewConfig.showMilestones}
                  onChange={toggleMilestones}
                  className="rounded"
                />
                Milestones
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={viewConfig.showResources}
                  onChange={toggleResources}
                  className="rounded"
                />
                <Users className="w-4 h-4" />
                Resources
              </label>
            </div>

            {/* Timeline Options */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Timeline
              </h4>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={viewConfig.showWeekends}
                  onChange={toggleWeekends}
                  className="rounded"
                />
                Show Weekends
              </label>
            </div>

            {/* Group By */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Grid className="w-4 h-4" />
                Group By
              </h4>
              <select
                value={viewConfig.groupBy || 'none'}
                onChange={(e) => {
                  const value = e.target.value
                  useGanttUIStore.getState().setGroupBy(
                    value === 'none'
                      ? undefined
                      : (value as GanttViewConfig['groupBy'])
                  )
                }}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
              >
                <option value="none">None</option>
                <option value="status">Status</option>
                <option value="owner">Owner</option>
                <option value="group">Group</option>
                <option value="priority">Priority</option>
              </select>
            </div>

            {/* Color By */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <List className="w-4 h-4" />
                Color By
              </h4>
              <select
                value={viewConfig.colorBy || 'status'}
                onChange={(e) => {
                  const value = e.target.value as GanttViewConfig['colorBy']
                  useGanttUIStore.getState().setColorBy(value)
                }}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
              >
                <option value="status">Status</option>
                <option value="owner">Owner</option>
                <option value="priority">Priority</option>
                <option value="progress">Progress</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
