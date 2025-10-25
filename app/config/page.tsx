"use client"

/**
 * @file app/config/page.tsx
 * @description Configuration page for managing data provider settings
 * @created 2025-10-25
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClientSessionManager } from '@/lib/client-session-manager'

type ProviderType = 'demo' | 'baserow' | 'postgres'
type DeploymentMode = 'server' | 'client'

interface BaserowConfig {
  baseUrl: string
  token: string
  tasksTableId: string
  statusesTableId: string
}

interface PostgresConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl: boolean
}

interface Workspace {
  id: number
  name: string
  order: number
  permissions: string
}

interface Table {
  id: number
  name: string
  order: number
  database_id: number
}

interface Field {
  id: number
  name: string
  type: string
  primary?: boolean
  order: number
}

export default function ConfigPage() {
  const router = useRouter()
  const [deploymentMode, setDeploymentMode] = useState<DeploymentMode>('server')
  const [providerType, setProviderType] = useState<ProviderType>('demo')
  const [baserowConfig, setBaserowConfig] = useState<BaserowConfig>({
    baseUrl: 'https://api.baserow.io',
    token: '',
    tasksTableId: '',
    statusesTableId: '',
  })
  const [postgresConfig, setPostgresConfig] = useState<PostgresConfig>({
    host: 'localhost',
    port: 5432,
    database: 'gantt_db',
    user: 'gantt_user',
    password: '',
    ssl: false,
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('')

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: providerType,
          ...(providerType === 'baserow' && baserowConfig),
          ...(providerType === 'postgres' && postgresConfig),
        }),
      })

      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      })
    } finally {
      setTesting(false)
    }
  }

  const loadWorkspaces = async () => {
    if (providerType !== 'baserow' || !baserowConfig.token) return

    try {
      const response = await fetch('/api/config/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: baserowConfig.token,
          baseUrl: baserowConfig.baseUrl,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setWorkspaces(data.workspaces)
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error)
    }
  }

  const loadTables = async (workspaceId: string) => {
    if (!baserowConfig.token) return

    try {
      const response = await fetch('/api/config/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: baserowConfig.token,
          workspaceId,
          baseUrl: baserowConfig.baseUrl,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setTables(data.tables)
      }
    } catch (error) {
      console.error('Failed to load tables:', error)
    }
  }

  const loadFields = async (tableId: string) => {
    if (!baserowConfig.token) return

    try {
      const response = await fetch('/api/config/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: baserowConfig.token,
          tableId,
          baseUrl: baserowConfig.baseUrl,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setFields(data.fields)
      }
    } catch (error) {
      console.error('Failed to load fields:', error)
    }
  }

  const startClientSession = () => {
    // Save config to session storage
    ClientSessionManager.saveConfig({
      baseUrl: baserowConfig.baseUrl,
      token: baserowConfig.token,
      tasksTableId: baserowConfig.tasksTableId,
      statusesTableId: baserowConfig.statusesTableId,
    })

    // Navigate to gantt chart with client mode
    router.push('/gantt?mode=client')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuration</h1>
          <p className="text-gray-600 mt-2">
            Configure your data provider connection settings
          </p>
          <Link
            href="/gantt"
            className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
          >
            ← Back to Gantt Chart
          </Link>
        </div>

        {/* Connection Mode Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Mode</h2>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                deploymentMode === 'server'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setDeploymentMode('server')}
            >
              <div className="font-semibold">🔒 Server Mode</div>
              <div className="text-sm text-gray-600 mt-1">
                Secure, persistent, production-ready
              </div>
              <ul className="text-xs text-gray-500 mt-2 space-y-1">
                <li>• Credentials stored server-side</li>
                <li>• Requires environment variables</li>
                <li>• Best for production use</li>
              </ul>
            </div>

            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                deploymentMode === 'client'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setDeploymentMode('client')}
            >
              <div className="font-semibold">⚡ Client Mode</div>
              <div className="text-sm text-gray-600 mt-1">
                Fast setup, temporary sessions
              </div>
              <ul className="text-xs text-gray-500 mt-2 space-y-1">
                <li>• Direct browser-to-Baserow connection</li>
                <li>• No server configuration needed</li>
                <li>• Perfect for quick analysis</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Client Mode Info Banner */}
        {deploymentMode === 'client' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">
              🚀 Client Mode - Rapid Analysis Setup
            </h3>
            <div className="text-green-800 text-sm space-y-2">
              <p>
                <strong>What this does:</strong> Your browser connects directly to Baserow,
                bypassing this server entirely.
              </p>

              <div className="mt-3">
                <p>
                  <strong>✅ Perfect for:</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Quick data analysis and visualization</li>
                  <li>Demo and presentation purposes</li>
                  <li>Personal productivity sessions</li>
                  <li>Evaluation without infrastructure setup</li>
                </ul>
              </div>

              <div className="mt-3">
                <p>
                  <strong>⚠️ Note:</strong> Your Baserow token will be stored only in your
                  browser session and cleared when you close the tab.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Provider Type Selection */}
        {deploymentMode === 'server' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Provider Type</h2>
            <div className="grid grid-cols-3 gap-4">
              {(['demo', 'baserow', 'postgres'] as ProviderType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setProviderType(type)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    providerType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold capitalize">{type}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {type === 'demo' && 'Built-in sample data'}
                    {type === 'baserow' && 'Connect to Baserow'}
                    {type === 'postgres' && 'PostgreSQL database'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Demo Configuration */}
        {deploymentMode === 'server' && providerType === 'demo' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Demo Mode</h2>
            <p className="text-gray-600 mb-4">
              Demo mode uses built-in sample data. No configuration required.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>8 sample tasks with different statuses</li>
              <li>5 default statuses (To Do, In Progress, In Review, Done, Blocked)</li>
              <li>Perfect for testing and evaluation</li>
            </ul>
          </div>
        )}

        {/* Baserow Configuration - Client Mode */}
        {deploymentMode === 'client' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Baserow Configuration <span className="text-green-600">(Client Mode)</span>
            </h2>

            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <p className="text-sm text-blue-800">
                <strong>Client Mode:</strong> Enter your credentials below. They&apos;ll be
                stored only in your browser session and used for direct API calls to Baserow.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  value={baserowConfig.baseUrl}
                  onChange={(e) =>
                    setBaserowConfig({ ...baserowConfig, baseUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://api.baserow.io"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Token
                </label>
                <input
                  type="password"
                  value={baserowConfig.token}
                  onChange={(e) =>
                    setBaserowConfig({ ...baserowConfig, token: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Your Baserow API token"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Get your token from{' '}
                  <a
                    href="https://baserow.io/user/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Baserow Settings
                  </a>
                </p>
              </div>

              {baserowConfig.token && (
                <>
                  <div>
                    <button
                      onClick={loadWorkspaces}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Browse Workspaces
                    </button>
                  </div>

                  {workspaces.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Workspace
                      </label>
                      <select
                        value={selectedWorkspace}
                        onChange={(e) => {
                          setSelectedWorkspace(e.target.value)
                          loadTables(e.target.value)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">-- Select a workspace --</option>
                        {workspaces.map((ws) => (
                          <option key={ws.id} value={ws.id}>
                            {ws.name} (ID: {ws.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {tables.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Tasks Table
                      </label>
                      <select
                        value={baserowConfig.tasksTableId}
                        onChange={(e) => {
                          setBaserowConfig({
                            ...baserowConfig,
                            tasksTableId: e.target.value,
                          })
                          loadFields(e.target.value)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">-- Select tasks table --</option>
                        {tables.map((table) => (
                          <option key={table.id} value={table.id}>
                            {table.name} (ID: {table.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {fields.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium mb-2">Available Fields:</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {fields.map((field) => (
                          <div key={field.id} className="text-gray-600">
                            {field.name} ({field.type})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tasks Table ID
                </label>
                <input
                  type="text"
                  value={baserowConfig.tasksTableId}
                  onChange={(e) =>
                    setBaserowConfig({
                      ...baserowConfig,
                      tasksTableId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statuses Table ID
                </label>
                <input
                  type="text"
                  value={baserowConfig.statusesTableId}
                  onChange={(e) =>
                    setBaserowConfig({
                      ...baserowConfig,
                      statusesTableId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="12346"
                />
              </div>
            </div>

            {/* Client Mode Test & Start Session */}
            {baserowConfig.token && baserowConfig.tasksTableId && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex space-x-3">
                  <button
                    onClick={testConnection}
                    disabled={testing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {testing ? 'Testing...' : '🔌 Test Connection'}
                  </button>

                  {testResult?.success && (
                    <button
                      onClick={startClientSession}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                    >
                      🚀 Start Client Session
                    </button>
                  )}
                </div>

                {testResult?.success && (
                  <p className="text-sm text-gray-600 mt-2">
                    ✅ Connection successful! Click &quot;Start Client Session&quot; to begin
                    your temporary analysis session.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Baserow Configuration - Server Mode */}
        {deploymentMode === 'server' && providerType === 'baserow' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Baserow Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  value={baserowConfig.baseUrl}
                  onChange={(e) =>
                    setBaserowConfig({ ...baserowConfig, baseUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://api.baserow.io"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Token
                </label>
                <input
                  type="password"
                  value={baserowConfig.token}
                  onChange={(e) =>
                    setBaserowConfig({ ...baserowConfig, token: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Your Baserow API token"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Get your token from{' '}
                  <a
                    href="https://baserow.io/user/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Baserow Settings
                  </a>
                </p>
              </div>

              {baserowConfig.token && (
                <>
                  <div>
                    <button
                      onClick={loadWorkspaces}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Browse Workspaces
                    </button>
                  </div>

                  {workspaces.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Workspace
                      </label>
                      <select
                        value={selectedWorkspace}
                        onChange={(e) => {
                          setSelectedWorkspace(e.target.value)
                          loadTables(e.target.value)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">-- Select a workspace --</option>
                        {workspaces.map((ws) => (
                          <option key={ws.id} value={ws.id}>
                            {ws.name} (ID: {ws.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {tables.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Tasks Table
                      </label>
                      <select
                        value={baserowConfig.tasksTableId}
                        onChange={(e) => {
                          setBaserowConfig({
                            ...baserowConfig,
                            tasksTableId: e.target.value,
                          })
                          loadFields(e.target.value)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">-- Select tasks table --</option>
                        {tables.map((table) => (
                          <option key={table.id} value={table.id}>
                            {table.name} (ID: {table.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {fields.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium mb-2">Available Fields:</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {fields.map((field) => (
                          <div key={field.id} className="text-gray-600">
                            {field.name} ({field.type})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tasks Table ID
                </label>
                <input
                  type="text"
                  value={baserowConfig.tasksTableId}
                  onChange={(e) =>
                    setBaserowConfig({
                      ...baserowConfig,
                      tasksTableId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statuses Table ID
                </label>
                <input
                  type="text"
                  value={baserowConfig.statusesTableId}
                  onChange={(e) =>
                    setBaserowConfig({
                      ...baserowConfig,
                      statusesTableId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="12346"
                />
              </div>
            </div>
          </div>
        )}

        {/* PostgreSQL Configuration */}
        {deploymentMode === 'server' && providerType === 'postgres' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">PostgreSQL Configuration</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Host
                  </label>
                  <input
                    type="text"
                    value={postgresConfig.host}
                    onChange={(e) =>
                      setPostgresConfig({ ...postgresConfig, host: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="localhost"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={postgresConfig.port}
                    onChange={(e) =>
                      setPostgresConfig({
                        ...postgresConfig,
                        port: parseInt(e.target.value) || 5432,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="5432"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database
                </label>
                <input
                  type="text"
                  value={postgresConfig.database}
                  onChange={(e) =>
                    setPostgresConfig({ ...postgresConfig, database: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="gantt_db"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User
                </label>
                <input
                  type="text"
                  value={postgresConfig.user}
                  onChange={(e) =>
                    setPostgresConfig({ ...postgresConfig, user: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="gantt_user"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={postgresConfig.password}
                  onChange={(e) =>
                    setPostgresConfig({ ...postgresConfig, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter password"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ssl"
                  checked={postgresConfig.ssl}
                  onChange={(e) =>
                    setPostgresConfig({ ...postgresConfig, ssl: e.target.checked })
                  }
                  className="mr-2"
                />
                <label htmlFor="ssl" className="text-sm font-medium text-gray-700">
                  Use SSL
                </label>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium text-blue-900 mb-2">Database Setup</h3>
                <p className="text-sm text-blue-800 mb-2">
                  To set up the PostgreSQL database, run the schema script:
                </p>
                <code className="block bg-white p-2 rounded text-sm">
                  psql -U gantt_user -d gantt_db -f lib/providers/postgres/schema.sql
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Test Connection - Server Mode Only */}
        {deploymentMode === 'server' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Test Connection</h2>
            <button
              onClick={testConnection}
              disabled={testing}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>

            {testResult && (
              <div
                className={`mt-4 p-4 rounded-md ${
                  testResult.success
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                <div className="font-medium">
                  {testResult.success ? '✓ Success' : '✗ Failed'}
                </div>
                <div className="text-sm mt-1">{testResult.message}</div>
              </div>
            )}
          </div>
        )}

        {/* Instructions - Server Mode Only */}
        {deploymentMode === 'server' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">
              Configuration Instructions
            </h2>
            <p className="text-yellow-800 text-sm mb-2">
              To apply these settings, update your <code>.env.local</code> file:
            </p>
            <div className="bg-white p-3 rounded-md font-mono text-xs overflow-x-auto">
              {providerType === 'demo' && <div>DATA_PROVIDER=demo</div>}

              {providerType === 'baserow' && (
                <>
                  <div>DATA_PROVIDER=baserow</div>
                  <div>BASEROW_BASE_URL={baserowConfig.baseUrl}</div>
                  <div>BASEROW_TOKEN=your_token_here</div>
                  <div>BASEROW_TABLE_ID_TASKS={baserowConfig.tasksTableId}</div>
                  <div>BASEROW_TABLE_ID_STATUSES={baserowConfig.statusesTableId}</div>
                </>
              )}

              {providerType === 'postgres' && (
                <>
                  <div>DATA_PROVIDER=postgres</div>
                  <div>POSTGRES_HOST={postgresConfig.host}</div>
                  <div>POSTGRES_PORT={postgresConfig.port}</div>
                  <div>POSTGRES_DB={postgresConfig.database}</div>
                  <div>POSTGRES_USER={postgresConfig.user}</div>
                  <div>POSTGRES_PASSWORD=your_password_here</div>
                  <div>POSTGRES_SSL={postgresConfig.ssl.toString()}</div>
                </>
              )}
            </div>
            <p className="text-yellow-800 text-sm mt-3">
              Then restart your development server with <code>npm run dev</code>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
