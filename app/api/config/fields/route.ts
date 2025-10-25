/**
 * @file app/api/config/fields/route.ts
 * @description API route for listing fields in a Baserow table
 */

import { NextRequest, NextResponse } from 'next/server'

interface BaserowField {
  id: number
  name: string
  type: string
  primary?: boolean
  order: number
}

/**
 * GET /api/config/fields
 * List all fields in a Baserow table
 *
 * Query params:
 *   - token: Baserow API token
 *   - tableId: Baserow table ID
 *   - baseUrl: Baserow base URL (optional)
 *
 * Response:
 * {
 *   success: true,
 *   fields: [
 *     {
 *       id: number,
 *       name: string,
 *       type: string,
 *       primary: boolean,
 *       order: number
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

    // Fetch fields from Baserow API
    const response = await fetch(
      `${baseUrl}/api/database/fields/table/${tableId}/`,
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
          error: 'Failed to fetch fields',
          message: `Baserow API returned ${response.status}`,
        },
        { status: response.status }
      )
    }

    const fields: BaserowField[] = await response.json()

    return NextResponse.json({
      success: true,
      fields: fields.map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type,
        primary: field.primary || false,
        order: field.order,
      })),
      total: fields.length,
    })
  } catch (error) {
    console.error('Field listing error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list fields',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/config/fields
 * Alternative method for listing fields (token in body for security)
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

    // Fetch fields from Baserow API
    const response = await fetch(
      `${baseUrl}/api/database/fields/table/${tableId}/`,
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
          error: 'Failed to fetch fields',
          message: `Baserow API returned ${response.status}`,
        },
        { status: response.status }
      )
    }

    const fields: BaserowField[] = await response.json()

    // Categorize fields by type for easier UI consumption
    const categorizedFields = {
      text: fields.filter((f) => ['text', 'long_text', 'url', 'email', 'phone_number'].includes(f.type)),
      number: fields.filter((f) => ['number', 'rating', 'count', 'rollup', 'formula'].includes(f.type)),
      date: fields.filter((f) => ['date', 'last_modified', 'created_on'].includes(f.type)),
      select: fields.filter((f) => ['single_select', 'multiple_select'].includes(f.type)),
      link: fields.filter((f) => ['link_row'].includes(f.type)),
      boolean: fields.filter((f) => ['boolean'].includes(f.type)),
      other: fields.filter((f) => !['text', 'long_text', 'url', 'email', 'phone_number', 'number', 'rating', 'count', 'rollup', 'formula', 'date', 'last_modified', 'created_on', 'single_select', 'multiple_select', 'link_row', 'boolean'].includes(f.type)),
    }

    return NextResponse.json({
      success: true,
      fields: fields.map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type,
        primary: field.primary || false,
        order: field.order,
      })),
      categorizedFields,
      total: fields.length,
    })
  } catch (error) {
    console.error('Field listing error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list fields',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
