import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

/**
 * Baserow Webhook Event Types
 */
interface BaserowWebhookEvent {
  table_id: number
  event_id: string
  event_type: "rows.created" | "rows.updated" | "rows.deleted"
  items: Array<{
    id: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }>
}

/**
 * POST /api/webhooks/baserow
 *
 * Webhook receiver for Baserow events
 *
 * Baserow can send webhook events when rows are created, updated, or deleted.
 * This endpoint receives those events and can trigger cache invalidation,
 * broadcast updates to clients, or perform other actions.
 *
 * To set up webhooks in Baserow:
 * 1. Go to your table settings
 * 2. Navigate to "Webhooks"
 * 3. Click "Create webhook"
 * 4. Set the URL to: https://your-domain.com/api/webhooks/baserow
 * 5. Select the events you want to receive (rows.created, rows.updated, rows.deleted)
 * 6. Optionally set headers for authentication (e.g., X-Webhook-Secret)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.BASEROW_WEBHOOK_SECRET
    if (webhookSecret) {
      const receivedSecret = request.headers.get("x-webhook-secret")
      if (receivedSecret !== webhookSecret) {
        console.warn("Webhook authentication failed: Invalid secret")
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }
    }

    // Parse webhook payload
    const event: BaserowWebhookEvent = await request.json()

    // Log the event for debugging
    console.log("[Webhook] Received Baserow webhook:", {
      eventId: event.event_id,
      eventType: event.event_type,
      tableId: event.table_id,
      itemCount: event.items?.length || 0,
      timestamp: new Date().toISOString(),
    })

    // Detailed logging of items (useful for debugging)
    if (process.env.NODE_ENV === "development") {
      console.log("[Webhook] Event details:", JSON.stringify(event, null, 2))
    }

    // Handle different event types
    switch (event.event_type) {
      case "rows.created":
        console.log(`[Webhook] ${event.items.length} row(s) created`)
        break

      case "rows.updated":
        console.log(`[Webhook] ${event.items.length} row(s) updated`)
        break

      case "rows.deleted":
        console.log(`[Webhook] ${event.items.length} row(s) deleted`)
        break

      default:
        console.warn(`[Webhook] Unknown event type: ${event.event_type}`)
    }

    // Invalidate cache for task-related pages
    // This ensures that the next request to /gantt will fetch fresh data
    revalidatePath("/gantt")
    revalidatePath("/api/tasks")

    // You can also implement real-time updates here using:
    // - Server-Sent Events (SSE)
    // - WebSockets
    // - Next.js Server Actions with revalidation
    // - Third-party services like Pusher, Ably, etc.

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      eventType: event.event_type,
      itemCount: event.items.length,
      processingTime: `${duration}ms`,
    })
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error)

    const duration = Date.now() - startTime

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process webhook",
        message: error instanceof Error ? error.message : "Unknown error",
        processingTime: `${duration}ms`,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/baserow
 *
 * Health check endpoint for webhook
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Baserow webhook endpoint is ready",
    timestamp: new Date().toISOString(),
  })
}
