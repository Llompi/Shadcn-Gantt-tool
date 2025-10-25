import { NextRequest, NextResponse } from "next/server"
import { getDataProviderAsync } from "@/lib/providers/provider-factory"
import { CreateTaskDTO } from "@/types/task"

/**
 * GET /api/tasks
 *
 * List tasks with optional pagination and filtering
 * Query params:
 *   - page: Page number (default: 1)
 *   - pageSize: Items per page (default: 100)
 *   - all: If "true", fetch all tasks without pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fetchAll = searchParams.get("all") === "true"

    const provider = await getDataProviderAsync()

    if (fetchAll) {
      // Fetch all tasks without pagination
      const tasks = await provider.getAllTasks()
      return NextResponse.json({
        success: true,
        data: tasks,
        total: tasks.length,
      })
    } else {
      // Fetch with pagination
      const page = parseInt(searchParams.get("page") || "1", 10)
      const pageSize = parseInt(searchParams.get("pageSize") || "100", 10)

      const result = await provider.getTasks({ page, pageSize })

      return NextResponse.json({
        success: true,
        ...result,
      })
    }
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tasks",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks
 *
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.startAt || !body.endAt) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, startAt, endAt",
        },
        { status: 400 }
      )
    }

    const taskData: CreateTaskDTO = {
      name: body.name,
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
      statusId: body.statusId,
      group: body.group,
      owner: body.owner,
      description: body.description,
      progress: body.progress,
    }

    const provider = await getDataProviderAsync()
    const task = await provider.createTask(taskData)

    return NextResponse.json(
      {
        success: true,
        data: task,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create task",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
