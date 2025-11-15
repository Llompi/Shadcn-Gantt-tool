import { create } from 'zustand'
import { TaskChange, ChangeSet } from '@/types/task'
import { v4 as uuidv4 } from 'uuid'

interface VersionControlState {
  // Change history
  changeSets: ChangeSet[]
  currentIndex: number

  // Current user info
  userId?: string
  userName?: string

  // State
  canUndo: boolean
  canRedo: boolean
  maxHistorySize: number

  // Actions
  recordChange: (taskId: string, changeType: 'create' | 'update' | 'delete', field?: string, oldValue?: unknown, newValue?: unknown) => void
  recordBatchChanges: (changes: Omit<TaskChange, 'id' | 'timestamp'>[]) => void
  undo: () => ChangeSet | null
  redo: () => ChangeSet | null
  clearHistory: () => void
  setUser: (userId: string, userName: string) => void
  getHistory: () => ChangeSet[]
  exportHistory: () => string
  importHistory: (data: string) => void
}

export const useVersionControlStore = create<VersionControlState>((set, get) => ({
  changeSets: [],
  currentIndex: -1,
  canUndo: false,
  canRedo: false,
  maxHistorySize: 100,

  recordChange: (taskId, changeType, field, oldValue, newValue) => {
    const state = get()
    const change: TaskChange = {
      id: uuidv4(),
      taskId,
      changeType,
      field,
      oldValue,
      newValue,
      timestamp: new Date(),
      userId: state.userId,
      userName: state.userName,
    }

    const changeSet: ChangeSet = {
      id: uuidv4(),
      changes: [change],
      timestamp: new Date(),
      userId: state.userId,
      userName: state.userName,
    }

    // Remove any changeSets after current index (if we undid and then made a new change)
    const newChangeSets = state.changeSets.slice(0, state.currentIndex + 1)
    newChangeSets.push(changeSet)

    // Limit history size
    const trimmedChangeSets = newChangeSets.slice(-state.maxHistorySize)

    set({
      changeSets: trimmedChangeSets,
      currentIndex: trimmedChangeSets.length - 1,
      canUndo: true,
      canRedo: false,
    })
  },

  recordBatchChanges: (changes) => {
    const state = get()
    const changeSet: ChangeSet = {
      id: uuidv4(),
      changes: changes.map((c) => ({
        ...c,
        id: uuidv4(),
        timestamp: new Date(),
        userId: state.userId,
        userName: state.userName,
      })),
      timestamp: new Date(),
      userId: state.userId,
      userName: state.userName,
    }

    const newChangeSets = state.changeSets.slice(0, state.currentIndex + 1)
    newChangeSets.push(changeSet)
    const trimmedChangeSets = newChangeSets.slice(-state.maxHistorySize)

    set({
      changeSets: trimmedChangeSets,
      currentIndex: trimmedChangeSets.length - 1,
      canUndo: true,
      canRedo: false,
    })
  },

  undo: () => {
    const state = get()
    if (state.currentIndex < 0) return null

    const changeSet = state.changeSets[state.currentIndex]
    const newIndex = state.currentIndex - 1

    set({
      currentIndex: newIndex,
      canUndo: newIndex >= 0,
      canRedo: true,
    })

    return changeSet
  },

  redo: () => {
    const state = get()
    if (state.currentIndex >= state.changeSets.length - 1) return null

    const newIndex = state.currentIndex + 1
    const changeSet = state.changeSets[newIndex]

    set({
      currentIndex: newIndex,
      canUndo: true,
      canRedo: newIndex < state.changeSets.length - 1,
    })

    return changeSet
  },

  clearHistory: () => {
    set({
      changeSets: [],
      currentIndex: -1,
      canUndo: false,
      canRedo: false,
    })
  },

  setUser: (userId, userName) => {
    set({ userId, userName })
  },

  getHistory: () => {
    return get().changeSets
  },

  exportHistory: () => {
    return JSON.stringify(get().changeSets, null, 2)
  },

  importHistory: (data) => {
    try {
      const changeSets = JSON.parse(data) as ChangeSet[]
      set({
        changeSets,
        currentIndex: changeSets.length - 1,
        canUndo: changeSets.length > 0,
        canRedo: false,
      })
    } catch (error) {
      console.error('Failed to import history:', error)
    }
  },
}))
