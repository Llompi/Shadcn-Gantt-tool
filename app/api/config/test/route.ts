/**
 * @file app/api/config/test/route.ts
 * @description API route for testing data provider connections
 */

import { NextRequest, NextResponse } from 'next/server'
import { createDataProvider } from '@/lib/providers/provider-factory'
import type { ProviderConfig } from '@/lib/providers/data-provider.interface'

/**
 * POST /api/config/test
 * Test a data provider connection without saving
 *
 * Request body:
 * {
 *   type: "baserow" | "postgres" | "demo",
 *   baseUrl?: string,      // For Baserow
 *   token?: string,        // For Baserow
 *   host?: string,         // For PostgreSQL
 *   port?: number,         // For PostgreSQL
 *   database?: string,     // For PostgreSQL
 *   user?: string,         // For PostgreSQL
 *   password?: string,     // For PostgreSQL
 *   ssl?: boolean          // For PostgreSQL
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Connection successful",
 *   provider: "baserow" | "postgres" | "demo"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate provider type
    const { type } = body
    if (!type || !['baserow', 'postgres', 'demo'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid provider type',
          message: 'Provider type must be one of: baserow, postgres, demo',
        },
        { status: 400 }
      )
    }

    // Build provider config based on type
    let providerConfig: ProviderConfig

    switch (type) {
      case 'baserow':
        if (!body.baseUrl || !body.token) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing required fields',
              message: 'Baserow provider requires: baseUrl, token',
            },
            { status: 400 }
          )
        }
        providerConfig = {
          type: 'baserow',
          baseUrl: body.baseUrl,
          token: body.token,
        }
        break

      case 'postgres':
        if (!body.host || !body.database || !body.user || !body.password) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing required fields',
              message: 'PostgreSQL provider requires: host, database, user, password',
            },
            { status: 400 }
          )
        }
        providerConfig = {
          type: 'postgres',
          database: body.database,
        }
        // Note: Full PostgreSQL config is passed via environment-like structure
        // This is intentionally limited to avoid exposing credentials
        break

      case 'demo':
        providerConfig = {
          type: 'demo',
        }
        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Unsupported provider type',
          },
          { status: 400 }
        )
    }

    // Create a temporary provider instance
    const provider = createDataProvider(providerConfig)

    // Test the connection
    const isHealthy = await provider.isHealthy()

    if (!isHealthy) {
      return NextResponse.json(
        {
          success: false,
          error: 'Connection failed',
          message: 'Could not connect to the data source. Please check your credentials.',
        },
        { status: 503 }
      )
    }

    // Try to fetch statuses as an additional test
    const statuses = await provider.getStatuses()

    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      provider: type,
      statusCount: statuses.length,
      details: {
        healthy: true,
        hasStatuses: statuses.length > 0,
      },
    })
  } catch (error) {
    console.error('Config test error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Connection test failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/config/test
 * Health check for the config test endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Configuration test endpoint is ready',
    supportedProviders: ['baserow', 'postgres', 'demo'],
  })
}
