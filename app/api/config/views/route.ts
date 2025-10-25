/**
 * @file app/api/config/views/route.ts
 * @description API route for listing views in a Baserow table
 */

import { NextRequest, NextResponse } from 'next/server'

interface BaserowView {
  id: number
  name: string
  type: string
  order: number
  table: number
}

/**
 * GET /api/config/views
 * List all views in a Baserow table
 *
 * Query params:
 *   - token: Baserow API token
 *   - tableId: Baserow table ID
 *   - baseUrl: Baserow base URL (optional)
 *
 * Response:
 * {
 *   success: true,
 *   views: [
 *     {
 *       id: number,
 *       name: string,
 *       type: string,
 *       order: number,
 *       table_id: number
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const tableId = searchParams.get('tableId')
    const baseUrl = searchParams.get('baseUrl') || 'https://api.baserow.io'

    if (!token || !tableId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
          message: 'Both token and tableId are required',
        },
        { status: 400 }
      )
    }

    // Fetch views from Baserow API
    const response = await fetch(
      `${baseUrl}/api/database/views/table/${tableId}/`,
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
          error: 'Failed to fetch views',
          message: `Baserow API returned ${response.status}`,
        },
        { status: response.status }
      )
    }

    const views: BaserowView[] = await response.json()

    return NextResponse.json({
      success: true,
      views: views.map((view) => ({
        id: view.id,
        name: view.name,
        type: view.type,
        order: view.order,
        table_id: view.table,
      })),
      total: views.length,
    })
  } catch (error) {
    console.error('View listing error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list views',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/config/views
 * Alternative method for listing views (token in body for security)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, tableId, baseUrl = 'https://api.baserow.io' } = body

    if (!token || !tableId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
          message: 'Both token and tableId are required',
        },
        { status: 400 }
      )
    }

    // Fetch views from Baserow API
    const response = await fetch(
      `${baseUrl}/api/database/views/table/${tableId}/`,
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
          error: 'Failed to fetch views',
          message: `Baserow API returned ${response.status}`,
        },
        { status: response.status }
      )
    }

    const views: BaserowView[] = await response.json()

    return NextResponse.json({
      success: true,
      views: views.map((view) => ({
        id: view.id,
        name: view.name,
        type: view.type,
        order: view.order,
        table_id: view.table,
      })),
      total: views.length,
    })
  } catch (error) {
    console.error('View listing error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list views',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
