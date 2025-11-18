import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GanttViewConfig, TaskFilter } from '@/types/task'

interface GanttUIState {
  // View configuration
  viewConfig: GanttViewConfig

  // Filters
  filter: TaskFilter
  activeFilters: number // count of active filters

  // UI State
  selectedTaskIds: Set<string>
  hoveredTaskId: string | null
  expandedGroups: Set<string>
  sidebarCollapsed: boolean
  miniMapVisible: boolean
  timelineScrollPosition: number

  // Search
  searchQuery: string
  searchResults: string[] // task IDs

  // Actions - View Config
  setScale: (scale: GanttViewConfig['scale']) => void
  setZoom: (zoom: number) => void
  toggleWeekends: () => void
  toggleDependencies: () => void
  toggleCriticalPath: () => void
  toggleMilestones: () => void
  toggleResources: () => void
  setGroupBy: (groupBy?: GanttViewConfig['groupBy']) => void
  setColorBy: (colorBy?: GanttViewConfig['colorBy']) => void
  updateViewConfig: (config: Partial<GanttViewConfig>) => void
  resetViewConfig: () => void

  // Actions - Filters
  setFilter: (filter: Partial<TaskFilter>) => void
  clearFilters: () => void
  addStatusFilter: (status: string) => void
  removeStatusFilter: (status: string) => void
  addOwnerFilter: (owner: string) => void
  removeOwnerFilter: (owner: string) => void
  addTagFilter: (tag: string) => void
  removeTagFilter: (tag: string) => void
  setDateRangeFilter: (start: Date, end: Date) => void
  clearDateRangeFilter: () => void

  // Actions - Selection
  selectTask: (taskId: string) => void
  deselectTask: (taskId: string) => void
  toggleTaskSelection: (taskId: string) => void
  selectMultipleTasks: (taskIds: string[]) => void
  clearSelection: () => void
  selectAll: (taskIds: string[]) => void

  // Actions - UI
  setHoveredTask: (taskId: string | null) => void
  toggleGroup: (groupId: string) => void
  expandGroup: (groupId: string) => void
  collapseGroup: (groupId: string) => void
  expandAllGroups: () => void
  collapseAllGroups: () => void
  toggleSidebar: () => void
  toggleMiniMap: () => void
  setTimelineScrollPosition: (position: number) => void

  // Actions - Search
  setSearchQuery: (query: string) => void
  setSearchResults: (results: string[]) => void
  clearSearch: () => void
}

const defaultViewConfig: GanttViewConfig = {
  scale: 'week',
  zoom: 1.0,
  showWeekends: true,
  showDependencies: true,
  showCriticalPath: false,
  showMilestones: true,
  showResources: false,
  groupBy: undefined,
  colorBy: 'status',
}

export const useGanttUIStore = create<GanttUIState>()(
  persist(
    (set, get) => ({
      // Initial state
      viewConfig: defaultViewConfig,
      filter: {},
      activeFilters: 0,
      selectedTaskIds: new Set(),
      hoveredTaskId: null,
      expandedGroups: new Set(),
      sidebarCollapsed: false,
      miniMapVisible: false,
      timelineScrollPosition: 0,
      searchQuery: '',
      searchResults: [],

      // View Config Actions
      setScale: (scale) => {
        set((state) => ({
          viewConfig: { ...state.viewConfig, scale },
        }))
      },

      setZoom: (zoom) => {
        // Clamp zoom between 0.5 and 2.0
        const clampedZoom = Math.max(0.5, Math.min(2.0, zoom))
        set((state) => ({
          viewConfig: { ...state.viewConfig, zoom: clampedZoom },
        }))
      },

      toggleWeekends: () => {
        set((state) => ({
          viewConfig: {
            ...state.viewConfig,
            showWeekends: !state.viewConfig.showWeekends,
          },
        }))
      },

      toggleDependencies: () => {
        set((state) => ({
          viewConfig: {
            ...state.viewConfig,
            showDependencies: !state.viewConfig.showDependencies,
          },
        }))
      },

      toggleCriticalPath: () => {
        set((state) => ({
          viewConfig: {
            ...state.viewConfig,
            showCriticalPath: !state.viewConfig.showCriticalPath,
          },
        }))
      },

      toggleMilestones: () => {
        set((state) => ({
          viewConfig: {
            ...state.viewConfig,
            showMilestones: !state.viewConfig.showMilestones,
          },
        }))
      },

      toggleResources: () => {
        set((state) => ({
          viewConfig: {
            ...state.viewConfig,
            showResources: !state.viewConfig.showResources,
          },
        }))
      },

      setGroupBy: (groupBy) => {
        set((state) => ({
          viewConfig: { ...state.viewConfig, groupBy },
        }))
      },

      setColorBy: (colorBy) => {
        set((state) => ({
          viewConfig: { ...state.viewConfig, colorBy },
        }))
      },

      updateViewConfig: (config) => {
        set((state) => ({
          viewConfig: { ...state.viewConfig, ...config },
        }))
      },

      resetViewConfig: () => {
        set({ viewConfig: defaultViewConfig })
      },

      // Filter Actions
      setFilter: (newFilter) => {
        const updatedFilter = { ...get().filter, ...newFilter }
        const activeCount = Object.values(updatedFilter).filter(
          (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
        ).length

        set({
          filter: updatedFilter,
          activeFilters: activeCount,
        })
      },

      clearFilters: () => {
        set({ filter: {}, activeFilters: 0 })
      },

      addStatusFilter: (status) => {
        const currentStatuses = get().filter.statuses || []
        if (!currentStatuses.includes(status)) {
          get().setFilter({ statuses: [...currentStatuses, status] })
        }
      },

      removeStatusFilter: (status) => {
        const currentStatuses = get().filter.statuses || []
        get().setFilter({
          statuses: currentStatuses.filter((s) => s !== status),
        })
      },

      addOwnerFilter: (owner) => {
        const currentOwners = get().filter.owners || []
        if (!currentOwners.includes(owner)) {
          get().setFilter({ owners: [...currentOwners, owner] })
        }
      },

      removeOwnerFilter: (owner) => {
        const currentOwners = get().filter.owners || []
        get().setFilter({
          owners: currentOwners.filter((o) => o !== owner),
        })
      },

      addTagFilter: (tag) => {
        const currentTags = get().filter.tags || []
        if (!currentTags.includes(tag)) {
          get().setFilter({ tags: [...currentTags, tag] })
        }
      },

      removeTagFilter: (tag) => {
        const currentTags = get().filter.tags || []
        get().setFilter({
          tags: currentTags.filter((t) => t !== tag),
        })
      },

      setDateRangeFilter: (start, end) => {
        get().setFilter({ dateRange: { start, end } })
      },

      clearDateRangeFilter: () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { dateRange, ...rest } = get().filter
        set({ filter: rest })
      },

      // Selection Actions
      selectTask: (taskId) => {
        const newSelection = new Set(get().selectedTaskIds)
        newSelection.add(taskId)
        set({ selectedTaskIds: newSelection })
      },

      deselectTask: (taskId) => {
        const newSelection = new Set(get().selectedTaskIds)
        newSelection.delete(taskId)
        set({ selectedTaskIds: newSelection })
      },

      toggleTaskSelection: (taskId) => {
        const newSelection = new Set(get().selectedTaskIds)
        if (newSelection.has(taskId)) {
          newSelection.delete(taskId)
        } else {
          newSelection.add(taskId)
        }
        set({ selectedTaskIds: newSelection })
      },

      selectMultipleTasks: (taskIds) => {
        set({ selectedTaskIds: new Set(taskIds) })
      },

      clearSelection: () => {
        set({ selectedTaskIds: new Set() })
      },

      selectAll: (taskIds) => {
        set({ selectedTaskIds: new Set(taskIds) })
      },

      // UI Actions
      setHoveredTask: (taskId) => {
        set({ hoveredTaskId: taskId })
      },

      toggleGroup: (groupId) => {
        const expandedGroups = new Set(get().expandedGroups)
        if (expandedGroups.has(groupId)) {
          expandedGroups.delete(groupId)
        } else {
          expandedGroups.add(groupId)
        }
        set({ expandedGroups })
      },

      expandGroup: (groupId) => {
        const expandedGroups = new Set(get().expandedGroups)
        expandedGroups.add(groupId)
        set({ expandedGroups })
      },

      collapseGroup: (groupId) => {
        const expandedGroups = new Set(get().expandedGroups)
        expandedGroups.delete(groupId)
        set({ expandedGroups })
      },

      expandAllGroups: () => {
        // This would need task group IDs passed in
        // For now, just clear the set to show all
        set({ expandedGroups: new Set() })
      },

      collapseAllGroups: () => {
        // This would need all group IDs
        // For now, just a placeholder
        set({ expandedGroups: new Set() })
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },

      toggleMiniMap: () => {
        set((state) => ({ miniMapVisible: !state.miniMapVisible }))
      },

      setTimelineScrollPosition: (position) => {
        set({ timelineScrollPosition: position })
      },

      // Search Actions
      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },

      setSearchResults: (results) => {
        set({ searchResults: results })
      },

      clearSearch: () => {
        set({ searchQuery: '', searchResults: [] })
      },
    }),
    {
      name: 'gantt-ui-storage',
      partialize: (state) => ({
        viewConfig: state.viewConfig,
        sidebarCollapsed: state.sidebarCollapsed,
        miniMapVisible: state.miniMapVisible,
      }),
    }
  )
)
