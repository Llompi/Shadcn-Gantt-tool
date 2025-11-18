'use client'

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  separator?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleScroll = () => {
      onClose()
    }

    // Small delay to prevent immediate closing from the same click that opened it
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      window.addEventListener('scroll', handleScroll, true)
    }, 10)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [onClose])

  // Adjust position if menu would go off-screen
  const adjustPosition = () => {
    if (!menuRef.current) return { x, y }

    const rect = menuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let adjustedX = x
    let adjustedY = y

    // Adjust horizontal position
    if (x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 10
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 10
    }

    return { x: adjustedX, y: adjustedY }
  }

  const { x: finalX, y: finalY } = adjustPosition()

  if (!mounted) return null

  const menu = (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] rounded-md border bg-background p-1 shadow-md animate-in fade-in-0 zoom-in-95"
      style={{
        left: `${finalX}px`,
        top: `${finalY}px`,
      }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="my-1 h-px bg-border" />
        }

        return (
          <button
            key={index}
            onClick={() => {
              if (!item.disabled) {
                item.onClick()
                onClose()
              }
            }}
            disabled={item.disabled}
            className={cn(
              'flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none transition-colors',
              item.disabled && 'cursor-not-allowed opacity-50',
              item.danger
                ? 'text-red-600 hover:bg-red-50 focus:bg-red-50'
                : 'hover:bg-accent focus:bg-accent',
              'disabled:pointer-events-none'
            )}
          >
            {item.icon && <span className="w-4 h-4">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )

  return createPortal(menu, document.body)
}
