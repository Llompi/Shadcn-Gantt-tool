import { NextRequest, NextResponse } from "next/server"
import { getDataProvider } from "@/lib/providers/provider-factory"
import { UpdateTaskDTO } from "@/types/task"

/**
 * GET /api/tasks/[id]
 *
 * Get a single task by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const provider = getDataProvider()
    const task = await provider.getTaskById(id)

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch task",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tasks/[id]
 *
 * Update a task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: UpdateTaskDTO = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.startAt !== undefined) updateData.startAt = new Date(body.startAt)
    if (body.endAt !== undefined) updateData.endAt = new Date(body.endAt)
    if (body.statusId !== undefined) updateData.statusId = body.statusId
    if (body.group !== undefined) updateData.group = body.group
    if (body.owner !== undefined) updateData.owner = body.owner
    if (body.description !== undefined) updateData.description = body.description
    if (body.progress !== undefined) updateData.progress = body.progress

    const provider = getDataProvider()
    const task = await provider.updateTask(id, updateData)

    return NextResponse.json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update task",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[id]
 *
 * Delete a task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const provider = getDataProvider()
    await provider.deleteTask(id)

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete task",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
