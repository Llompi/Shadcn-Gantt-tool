/**
 * @file app/api/config/field-mapping/route.ts
 * @description API routes for managing field mapping configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { saveFieldMapping, loadFieldMapping } from '@/lib/config-storage'
import { BaserowFieldMapping } from '@/lib/providers/baserow/field-mapping'
import { validateFieldMapping } from '@/lib/providers/baserow/field-detector'

/**
 * GET /api/config/field-mapping
 * Load saved field mapping configuration
 */
export async function GET() {
  try {
    const mapping = await loadFieldMapping()

    if (!mapping) {
      return NextResponse.json({
        success: false,
        message: 'No saved field mapping found',
      })
    }

    return NextResponse.json({
      success: true,
      mapping,
    })
  } catch (error) {
    console.error('Failed to load field mapping:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load field mapping',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/config/field-mapping
 * Save field mapping configuration
 *
 * Request body:
 * {
 *   mapping: BaserowFieldMapping
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mapping } = body as { mapping: BaserowFieldMapping }

    if (!mapping) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing mapping in request body',
        },
        { status: 400 }
      )
    }

    // Validate the mapping
    const validation = validateFieldMapping(mapping)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid field mapping',
          errors: validation.errors,
        },
        { status: 400 }
      )
    }

    // Save the mapping
    await saveFieldMapping(mapping)

    return NextResponse.json({
      success: true,
      message: 'Field mapping saved successfully',
    })
  } catch (error) {
    console.error('Failed to save field mapping:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save field mapping',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
