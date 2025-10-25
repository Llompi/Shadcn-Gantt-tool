/**
 * @file app/api/config/tables/route.ts
 * @description API route for listing Baserow tables within a workspace
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/config/tables
 * List all tables in a Baserow workspace
 *
 * Query params:
 *   - token: Baserow API token
 *   - workspaceId: Baserow workspace/database ID
 *   - baseUrl: Baserow base URL (optional)
 *
 * Response:
 * {
 *   success: true,
 *   tables: [
 *     {
 *       id: number,
 *       name: string,
 *       order: number,
 *       database_id: number
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const workspaceId = searchParams.get('workspaceId')
    const baseUrl = searchParams.get('baseUrl') || 'https://api.baserow.io'

    if (!token || !workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
          message: 'Both token and workspaceId are required',
        },
        { status: 400 }
      )
    }

    // Fetch tables from Baserow API
    const response = await fetch(
      `${baseUrl}/api/database/tables/database/${workspaceId}/`,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Baserow API error:', response.status, errorText)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch tables',
          message: `Baserow API returned ${response.status}`,
        },
        { status: response.status }
      )
    }

    const tables = await response.json()

    return NextResponse.json({
      success: true,
      tables: tables.map((table: any) => ({
        id: table.id,
        name: table.name,
        order: table.order,
        database_id: table.database_id,
      })),
      total: tables.length,
    })
  } catch (error) {
    console.error('Table listing error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list tables',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/config/tables
 * Alternative method for listing tables (token in body for security)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, workspaceId, baseUrl = 'https://api.baserow.io' } = body

    if (!token || !workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
          message: 'Both token and workspaceId are required',
        },
        { status: 400 }
      )
    }

    // Fetch tables from Baserow API
    const response = await fetch(
      `${baseUrl}/api/database/tables/database/${workspaceId}/`,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Baserow API error:', response.status, errorText)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch tables',
          message: `Baserow API returned ${response.status}`,
        },
        { status: response.status }
      )
    }

    const tables = await response.json()

    return NextResponse.json({
      success: true,
      tables: tables.map((table: any) => ({
        id: table.id,
        name: table.name,
        order: table.order,
        database_id: table.database_id,
      })),
      total: tables.length,
    })
  } catch (error) {
    console.error('Table listing error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list tables',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
