import { NextResponse } from "next/server"
import { getDataProviderAsync } from "@/lib/providers/provider-factory"

/**
 * GET /api/statuses
 *
 * List all available task statuses
 */
export async function GET() {
  try {
    const provider = await getDataProviderAsync()
    const statuses = await provider.getStatuses()

    return NextResponse.json({
      success: true,
      data: statuses,
    })
  } catch (error) {
    console.error("Error fetching statuses:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch statuses",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
