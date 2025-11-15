'use client'

import React, { useState } from 'react'
import {
  Database,
  Table,
  Columns,
  Eye,
  Link2,
  ChevronRight,
  ChevronDown,
  Search,
  RefreshCw,
} from 'lucide-react'
import { DatabaseSchema, DataPreview } from '@/types/task'

interface ConnectionConfig {
  type: 'postgres' | 'mysql' | 'mongodb'
  host: string
  port: number
  database: string
  username: string
  password: string
}

interface DatabaseExplorerProps {
  onConnect?: (config: ConnectionConfig) => void
  onTableSelect?: (tableName: string) => void
  onFieldMap?: (mapping: string) => void
}

export function DatabaseExplorer({
  onConnect,
  onTableSelect,
  onFieldMap,
}: DatabaseExplorerProps) {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [schema, setSchema] = useState<DatabaseSchema | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<DataPreview | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Mock connection config
  const [connectionConfig, setConnectionConfig] = useState({
    type: 'postgres' as const,
    host: 'localhost',
    port: 5432,
    database: 'gantt_db',
    username: 'postgres',
    password: '',
  })

  const handleConnect = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock schema data
      const mockSchema: DatabaseSchema = {
        name: connectionConfig.database,
        tables: [
          {
            name: 'tasks',
            rowCount: 156,
            columns: [
              { name: 'id', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: true },
              { name: 'name', type: 'VARCHAR(500)', nullable: false },
              { name: 'start_at', type: 'TIMESTAMP', nullable: false },
              { name: 'end_at', type: 'TIMESTAMP', nullable: false },
              { name: 'status_id', type: 'VARCHAR(255)', nullable: true, isForeignKey: true },
              { name: 'group_name', type: 'VARCHAR(255)', nullable: true },
              { name: 'owner', type: 'VARCHAR(255)', nullable: true },
              { name: 'description', type: 'TEXT', nullable: true },
              { name: 'progress', type: 'INT', nullable: true },
              { name: 'priority', type: 'ENUM', nullable: true },
              { name: 'created_at', type: 'TIMESTAMP', nullable: true },
              { name: 'updated_at', type: 'TIMESTAMP', nullable: true },
            ],
          },
          {
            name: 'task_statuses',
            rowCount: 5,
            columns: [
              { name: 'id', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: true },
              { name: 'name', type: 'VARCHAR(255)', nullable: false },
              { name: 'color', type: 'VARCHAR(50)', nullable: true },
            ],
          },
          {
            name: 'task_dependencies',
            rowCount: 42,
            columns: [
              { name: 'id', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: true },
              { name: 'predecessor_id', type: 'VARCHAR(255)', nullable: false, isForeignKey: true },
              { name: 'successor_id', type: 'VARCHAR(255)', nullable: false, isForeignKey: true },
              { name: 'type', type: 'ENUM', nullable: false },
              { name: 'lag_days', type: 'INT', nullable: true },
            ],
          },
          {
            name: 'resources',
            rowCount: 24,
            columns: [
              { name: 'id', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: true },
              { name: 'name', type: 'VARCHAR(255)', nullable: false },
              { name: 'email', type: 'VARCHAR(255)', nullable: true },
              { name: 'role', type: 'VARCHAR(255)', nullable: true },
              { name: 'availability', type: 'INT', nullable: true },
            ],
          },
        ],
      }

      setSchema(mockSchema)
      setConnected(true)
      onConnect?.(connectionConfig)
    } catch (error) {
      console.error('Connection failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables)
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName)
    } else {
      newExpanded.add(tableName)
    }
    setExpandedTables(newExpanded)
  }

  const handleTableSelect = async (tableName: string) => {
    setSelectedTable(tableName)
    setLoading(true)

    try {
      // Simulate preview data fetch
      await new Promise((resolve) => setTimeout(resolve, 500))

      const mockPreview: DataPreview = {
        columns: ['id', 'name', 'start_at', 'end_at', 'status_id'],
        rows: [
          ['task_1', 'Design Homepage', '2024-01-01', '2024-01-15', 'status_2'],
          ['task_2', 'Build Backend API', '2024-01-10', '2024-02-01', 'status_2'],
          ['task_3', 'Deploy to Production', '2024-02-15', '2024-02-20', 'status_1'],
        ],
        totalRows: 156,
      }

      setPreview(mockPreview)
      onTableSelect?.(tableName)
    } catch (error) {
      console.error('Failed to load preview:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTables = schema?.tables.filter((table) =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Left Panel - Connection & Schema */}
      <div className="w-1/3 glass-card rounded-2xl p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Explorer
          </h2>
          {connected && (
            <button
              onClick={handleConnect}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {!connected ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Database Type</label>
              <select
                value={connectionConfig.type}
                onChange={(e) =>
                  setConnectionConfig({ ...connectionConfig, type: e.target.value as any })
                }
                className="modern-input"
              >
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="mongodb">MongoDB</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Host</label>
              <input
                type="text"
                value={connectionConfig.host}
                onChange={(e) =>
                  setConnectionConfig({ ...connectionConfig, host: e.target.value })
                }
                className="modern-input"
                placeholder="localhost"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Port</label>
                <input
                  type="number"
                  value={connectionConfig.port}
                  onChange={(e) =>
                    setConnectionConfig({
                      ...connectionConfig,
                      port: parseInt(e.target.value),
                    })
                  }
                  className="modern-input"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Database</label>
                <input
                  type="text"
                  value={connectionConfig.database}
                  onChange={(e) =>
                    setConnectionConfig({ ...connectionConfig, database: e.target.value })
                  }
                  className="modern-input"
                />
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tables..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-sm"
              />
            </div>

            {/* Tables List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {filteredTables?.map((table) => (
                <div key={table.name} className="space-y-1">
                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedTable === table.name
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      toggleTable(table.name)
                      handleTableSelect(table.name)
                    }}
                  >
                    <button onClick={(e) => {
                      e.stopPropagation()
                      toggleTable(table.name)
                    }}>
                      {expandedTables.has(table.name) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <Table className="w-4 h-4" />
                    <span className="flex-1 text-sm font-medium">{table.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {table.rowCount} rows
                    </span>
                  </div>

                  {expandedTables.has(table.name) && (
                    <div className="ml-6 space-y-1 animate-slide-in">
                      {table.columns.map((column) => (
                        <div
                          key={column.name}
                          className="flex items-center gap-2 p-2 text-xs rounded hover:bg-muted/50 transition-colors"
                        >
                          <Columns className="w-3 h-3 text-muted-foreground" />
                          <span className="flex-1">{column.name}</span>
                          <span className="text-muted-foreground">{column.type}</span>
                          {column.isPrimaryKey && (
                            <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[10px] font-medium">
                              PK
                            </span>
                          )}
                          {column.isForeignKey && (
                            <Link2 className="w-3 h-3 text-accent" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Preview & Field Mapping */}
      <div className="flex-1 glass-card rounded-2xl p-6">
        {selectedTable && preview ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Data Preview: {selectedTable}
              </h3>
              <div className="text-sm text-muted-foreground">
                Showing first 3 of {preview.totalRows} rows
              </div>
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-auto custom-scrollbar rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    {preview.columns.map((col) => (
                      <th key={col} className="px-4 py-3 text-left font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-t border-border hover:bg-muted/30">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-3">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onFieldMap?.(selectedTable)}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Link2 className="w-4 h-4" />
                Map Fields to Gantt
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Database className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Select a table to preview data</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
