'use client'

import React from 'react'
import { Download, FileImage, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExportButtonsProps {
  ganttRef: React.RefObject<HTMLElement>
  tableRef?: React.RefObject<HTMLElement>
  filename?: string
  className?: string
}

export function ExportButtons({ ganttRef, tableRef, filename = 'gantt-chart', className }: ExportButtonsProps) {
  const [exporting, setExporting] = React.useState<'png' | 'pdf' | null>(null)

  const exportToPNG = async (element: HTMLElement, name: string) => {
    try {
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      })

      const link = document.createElement('a')
      link.download = `${name}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('PNG export failed:', error)
      alert('Failed to export PNG. Please try again.')
    }
  }

  const exportToPDF = async (element: HTMLElement, name: string) => {
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Calculate PDF dimensions to fit content
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight],
      })

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`${name}.pdf`)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }

  const handleExport = async (format: 'png' | 'pdf', target: 'gantt' | 'table') => {
    const element = target === 'gantt' ? ganttRef.current : tableRef?.current

    if (!element) {
      alert(`${target === 'gantt' ? 'Gantt chart' : 'Table'} not found`)
      return
    }

    setExporting(format)

    try {
      const name = `${filename}-${target}`
      if (format === 'png') {
        await exportToPNG(element, name)
      } else {
        await exportToPDF(element, name)
      }
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1 p-1 rounded-lg bg-accent/50">
        <button
          onClick={() => handleExport('png', 'gantt')}
          disabled={exporting !== null}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-all',
            exporting === 'png' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
            exporting !== null && 'opacity-50 cursor-not-allowed'
          )}
          title="Export Gantt to PNG"
        >
          {exporting === 'png' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <FileImage className="w-3 h-3" />
          )}
          PNG
        </button>

        <button
          onClick={() => handleExport('pdf', 'gantt')}
          disabled={exporting !== null}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-all',
            exporting === 'pdf' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
            exporting !== null && 'opacity-50 cursor-not-allowed'
          )}
          title="Export Gantt to PDF"
        >
          {exporting === 'pdf' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <FileText className="w-3 h-3" />
          )}
          PDF
        </button>
      </div>

      {tableRef && (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-accent/50">
          <span className="text-xs text-muted-foreground px-2">Table:</span>
          <button
            onClick={() => handleExport('png', 'table')}
            disabled={exporting !== null}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded transition-all',
              'hover:bg-accent',
              exporting !== null && 'opacity-50 cursor-not-allowed'
            )}
            title="Export Table to PNG"
          >
            <FileImage className="w-3 h-3" />
          </button>

          <button
            onClick={() => handleExport('pdf', 'table')}
            disabled={exporting !== null}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded transition-all',
              'hover:bg-accent',
              exporting !== null && 'opacity-50 cursor-not-allowed'
            )}
            title="Export Table to PDF"
          >
            <FileText className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
