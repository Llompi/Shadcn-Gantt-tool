'use client'

import { useHotkeys } from 'react-hotkeys-hook'

export interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  enabled?: boolean
}

export interface UseKeyboardShortcutsOptions {
  onUndo?: () => void
  onRedo?: () => void
  onSave?: () => void
  onSearch?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitToScreen?: () => void
  onToggleMinimap?: () => void
  onSelectAll?: () => void
  onCopy?: () => void
  onPaste?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onNewTask?: () => void
  onEditTask?: () => void
  onToggleDependencies?: () => void
  onToggleCriticalPath?: () => void
  onPanLeft?: () => void
  onPanRight?: () => void
  onPanUp?: () => void
  onPanDown?: () => void
  onEscape?: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true } = options

  // Navigation and View
  useHotkeys(
    'ctrl+z,cmd+z',
    (e) => {
      e.preventDefault()
      options.onUndo?.()
    },
    { enabled }
  )

  useHotkeys(
    'ctrl+y,cmd+y,ctrl+shift+z,cmd+shift+z',
    (e) => {
      e.preventDefault()
      options.onRedo?.()
    },
    { enabled }
  )

  useHotkeys(
    'ctrl+s,cmd+s',
    (e) => {
      e.preventDefault()
      options.onSave?.()
    },
    { enabled }
  )

  useHotkeys(
    'ctrl+f,cmd+f',
    (e) => {
      e.preventDefault()
      options.onSearch?.()
    },
    { enabled }
  )

  useHotkeys(
    'ctrl+=,cmd+=',
    (e) => {
      e.preventDefault()
      options.onZoomIn?.()
    },
    { enabled }
  )

  useHotkeys(
    'ctrl+-,cmd+-',
    (e) => {
      e.preventDefault()
      options.onZoomOut?.()
    },
    { enabled }
  )

  useHotkeys(
    'ctrl+0,cmd+0',
    (e) => {
      e.preventDefault()
      options.onFitToScreen?.()
    },
    { enabled }
  )

  useHotkeys(
    'ctrl+m,cmd+m',
    (e) => {
      e.preventDefault()
      options.onToggleMinimap?.()
    },
    { enabled }
  )

  // Selection and Editing
  useHotkeys(
    'ctrl+a,cmd+a',
    (e) => {
      e.preventDefault()
      options.onSelectAll?.()
    },
    { enabled }
  )

  useHotkeys(
    'ctrl+c,cmd+c',
    (e) => {
      e.preventDefault()
      options.onCopy?.()
    },
    { enabled }
  )

  useHotkeys(
    'ctrl+v,cmd+v',
    (e) => {
      e.preventDefault()
      options.onPaste?.()
    },
    { enabled }
  )

  useHotkeys(
    'delete,backspace',
    (e) => {
      e.preventDefault()
      options.onDelete?.()
    },
    { enabled }
  )

  useHotkeys(
    'ctrl+d,cmd+d',
    (e) => {
      e.preventDefault()
      options.onDuplicate?.()
    },
    { enabled }
  )

  useHotkeys(
    'ctrl+n,cmd+n',
    (e) => {
      e.preventDefault()
      options.onNewTask?.()
    },
    { enabled }
  )

  useHotkeys(
    'enter',
    () => {
      options.onEditTask?.()
    },
    { enabled }
  )

  // View Toggles
  useHotkeys(
    'alt+d',
    (e) => {
      e.preventDefault()
      options.onToggleDependencies?.()
    },
    { enabled }
  )

  useHotkeys(
    'alt+c',
    (e) => {
      e.preventDefault()
      options.onToggleCriticalPath?.()
    },
    { enabled }
  )

  // Arrow key navigation (when not in input)
  useHotkeys(
    'left',
    (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      e.preventDefault()
      options.onPanLeft?.()
    },
    { enabled }
  )

  useHotkeys(
    'right',
    (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      e.preventDefault()
      options.onPanRight?.()
    },
    { enabled }
  )

  useHotkeys(
    'up',
    (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      e.preventDefault()
      options.onPanUp?.()
    },
    { enabled }
  )

  useHotkeys(
    'down',
    (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      e.preventDefault()
      options.onPanDown?.()
    },
    { enabled }
  )

  // Escape
  useHotkeys(
    'escape',
    () => {
      options.onEscape?.()
    },
    { enabled }
  )
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'Ctrl+Z / Cmd+Z',
    description: 'Undo last action',
    action: () => {},
  },
  {
    key: 'Ctrl+Y / Cmd+Y',
    description: 'Redo last action',
    action: () => {},
  },
  {
    key: 'Ctrl+S / Cmd+S',
    description: 'Save changes',
    action: () => {},
  },
  {
    key: 'Ctrl+F / Cmd+F',
    description: 'Search tasks',
    action: () => {},
  },
  {
    key: 'Ctrl++ / Cmd++',
    description: 'Zoom in',
    action: () => {},
  },
  {
    key: 'Ctrl+- / Cmd+-',
    description: 'Zoom out',
    action: () => {},
  },
  {
    key: 'Ctrl+0 / Cmd+0',
    description: 'Fit to screen',
    action: () => {},
  },
  {
    key: 'Ctrl+M / Cmd+M',
    description: 'Toggle minimap',
    action: () => {},
  },
  {
    key: 'Ctrl+A / Cmd+A',
    description: 'Select all tasks',
    action: () => {},
  },
  {
    key: 'Ctrl+C / Cmd+C',
    description: 'Copy selected tasks',
    action: () => {},
  },
  {
    key: 'Ctrl+V / Cmd+V',
    description: 'Paste tasks',
    action: () => {},
  },
  {
    key: 'Delete',
    description: 'Delete selected tasks',
    action: () => {},
  },
  {
    key: 'Ctrl+D / Cmd+D',
    description: 'Duplicate selected tasks',
    action: () => {},
  },
  {
    key: 'Ctrl+N / Cmd+N',
    description: 'Create new task',
    action: () => {},
  },
  {
    key: 'Enter',
    description: 'Edit selected task',
    action: () => {},
  },
  {
    key: 'Alt+D',
    description: 'Toggle dependencies',
    action: () => {},
  },
  {
    key: 'Alt+C',
    description: 'Toggle critical path',
    action: () => {},
  },
  {
    key: 'Arrow Keys',
    description: 'Pan timeline',
    action: () => {},
  },
  {
    key: 'Escape',
    description: 'Cancel / Deselect',
    action: () => {},
  },
]
