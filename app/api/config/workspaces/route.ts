/**
 * @file app/api/config/workspaces/route.ts
 * @description API route for listing Baserow workspaces (databases)
 */

import { NextRequest, NextResponse } from 'next/server'

interface BaserowApplication {
  id: number
  name: string
  order: number
  type: string
  permissions?: string
}

/**
 * GET /api/config/workspaces
 * List all accessible Baserow workspaces/databases
 *
 * Query params:
 *   - token: Baserow API token
 *   - baseUrl: Baserow base URL (optional, defaults to https://api.baserow.io)
 *
 * Response:
 * {
 *   success: true,
 *   workspaces: [
 *     {
 *       id: number,
 *       name: string,
 *       order: number,
 *       permissions: string
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const baseUrl = searchParams.get('baseUrl') || 'https://api.baserow.io'

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing token',
          message: 'Baserow API token is required',
        },
        { status: 400 }
      )
    }

    // Fetch workspaces from Baserow API
    const response = await fetch(`${baseUrl}/api/applications/`, {
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Baserow API error:', response.status, errorText)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch workspaces',
          message: `Baserow API returned ${response.status}: ${errorText}`,
        },
        { status: response.status }
      )
    }

    const data: BaserowApplication[] = await response.json()

    // Filter for database applications and transform the response
    const workspaces = data
      .filter((app) => app.type === 'database')
      .map((app) => ({
        id: app.id,
        name: app.name,
        order: app.order,
        permissions: app.permissions || 'unknown',
      }))

    return NextResponse.json({
      success: true,
      workspaces,
      total: workspaces.length,
    })
  } catch (error) {
    console.error('Workspace listing error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list workspaces',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/config/workspaces
 * Alternative method for listing workspaces (for security - token in body)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, baseUrl = 'https://api.baserow.io' } = body

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing token',
          message: 'Baserow API token is required',
        },
        { status: 400 }
      )
    }

    // Fetch workspaces from Baserow API
    const response = await fetch(`${baseUrl}/api/applications/`, {
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Baserow API error:', response.status, errorText)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch workspaces',
          message: `Baserow API returned ${response.status}`,
        },
        { status: response.status }
      )
    }

    const data: BaserowApplication[] = await response.json()

    // Filter for database applications
    const workspaces = data
      .filter((app) => app.type === 'database')
      .map((app) => ({
        id: app.id,
        name: app.name,
        order: app.order,
        permissions: app.permissions || 'unknown',
      }))

    return NextResponse.json({
      success: true,
      workspaces,
      total: workspaces.length,
    })
  } catch (error) {
    console.error('Workspace listing error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list workspaces',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
