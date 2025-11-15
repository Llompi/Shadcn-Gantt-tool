import { Task, TaskDependency, CriticalPathTask } from '@/types/task'

export interface TaskNode {
  id: string
  task: Task
  dependencies: TaskDependency[]
  dependents: TaskDependency[]
  earliestStart: Date
  earliestFinish: Date
  latestStart: Date
  latestFinish: Date
  slack: number // in milliseconds
  isCritical: boolean
}

/**
 * Calculate the critical path for a set of tasks with dependencies
 */
export function calculateCriticalPath(
  tasks: Task[],
  dependencies: TaskDependency[]
): CriticalPathTask[] {
  // Build task nodes
  const taskMap = new Map<string, TaskNode>()

  // Initialize task nodes
  tasks.forEach((task) => {
    const taskDeps = dependencies.filter((d) => d.successorId === task.id)
    const taskDependents = dependencies.filter((d) => d.predecessorId === task.id)

    taskMap.set(task.id, {
      id: task.id,
      task,
      dependencies: taskDeps,
      dependents: taskDependents,
      earliestStart: task.startAt,
      earliestFinish: task.endAt,
      latestStart: task.startAt,
      latestFinish: task.endAt,
      slack: 0,
      isCritical: false,
    })
  })

  // Forward pass - calculate earliest start and finish times
  forwardPass(taskMap, dependencies)

  // Backward pass - calculate latest start and finish times
  backwardPass(taskMap, dependencies)

  // Calculate slack and identify critical tasks
  const criticalPathTasks: CriticalPathTask[] = []

  taskMap.forEach((node) => {
    const slack = node.latestFinish.getTime() - node.earliestFinish.getTime()
    const isCritical = slack === 0

    node.slack = slack
    node.isCritical = isCritical

    criticalPathTasks.push({
      taskId: node.id,
      slack: slack / (1000 * 60 * 60 * 24), // Convert to days
      isCritical,
    })
  })

  return criticalPathTasks
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function forwardPass(
  taskMap: Map<string, TaskNode>,
  _dependencies: TaskDependency[]
): void {
  // Topological sort to process tasks in dependency order
  const visited = new Set<string>()
  const stack: string[] = []

  function visit(taskId: string) {
    if (visited.has(taskId)) return
    visited.add(taskId)

    const node = taskMap.get(taskId)
    if (!node) return

    // Visit predecessors first
    node.dependencies.forEach((dep) => {
      visit(dep.predecessorId)
    })

    stack.push(taskId)
  }

  // Visit all tasks
  taskMap.forEach((_, taskId) => visit(taskId))

  // Process tasks in order
  stack.forEach((taskId) => {
    const node = taskMap.get(taskId)
    if (!node) return

    // Calculate earliest start based on predecessors
    let maxPredecessorFinish = node.task.startAt

    node.dependencies.forEach((dep) => {
      const predecessor = taskMap.get(dep.predecessorId)
      if (!predecessor) return

      let predFinish = predecessor.earliestFinish

      // Apply lag
      if (dep.lag) {
        predFinish = new Date(predFinish.getTime() + dep.lag * 24 * 60 * 60 * 1000)
      }

      // Handle different dependency types
      switch (dep.type) {
        case 'finish-to-start':
          // Successor starts after predecessor finishes
          if (predFinish > maxPredecessorFinish) {
            maxPredecessorFinish = predFinish
          }
          break
        case 'start-to-start':
          // Successor starts when predecessor starts
          const predStart = predecessor.earliestStart
          if (predStart > maxPredecessorFinish) {
            maxPredecessorFinish = predStart
          }
          break
        case 'finish-to-finish':
          // Adjust based on duration
          const duration = node.task.endAt.getTime() - node.task.startAt.getTime()
          const adjustedStart = new Date(predFinish.getTime() - duration)
          if (adjustedStart > maxPredecessorFinish) {
            maxPredecessorFinish = adjustedStart
          }
          break
        case 'start-to-finish':
          // Rare case: successor finishes when predecessor starts
          const predStartSF = predecessor.earliestStart
          const durationSF = node.task.endAt.getTime() - node.task.startAt.getTime()
          const adjustedStartSF = new Date(predStartSF.getTime() - durationSF)
          if (adjustedStartSF > maxPredecessorFinish) {
            maxPredecessorFinish = adjustedStartSF
          }
          break
      }
    })

    node.earliestStart = maxPredecessorFinish
    const duration = node.task.endAt.getTime() - node.task.startAt.getTime()
    node.earliestFinish = new Date(node.earliestStart.getTime() + duration)
  })
}

function backwardPass(
  taskMap: Map<string, TaskNode>,
  _dependencies: TaskDependency[]
): void {
  // Find project end date (maximum earliest finish)
  let projectEnd = new Date(0)
  taskMap.forEach((node) => {
    if (node.earliestFinish > projectEnd) {
      projectEnd = node.earliestFinish
    }
  })

  // Initialize latest times for tasks with no successors
  taskMap.forEach((node) => {
    if (node.dependents.length === 0) {
      node.latestFinish = node.earliestFinish
      const duration = node.task.endAt.getTime() - node.task.startAt.getTime()
      node.latestStart = new Date(node.latestFinish.getTime() - duration)
    } else {
      node.latestFinish = projectEnd
      const duration = node.task.endAt.getTime() - node.task.startAt.getTime()
      node.latestStart = new Date(node.latestFinish.getTime() - duration)
    }
  })

  // Process in reverse topological order
  const visited = new Set<string>()
  const stack: string[] = []

  function visit(taskId: string) {
    if (visited.has(taskId)) return
    visited.add(taskId)

    const node = taskMap.get(taskId)
    if (!node) return

    // Visit successors first
    node.dependents.forEach((dep) => {
      visit(dep.successorId)
    })

    stack.push(taskId)
  }

  taskMap.forEach((_, taskId) => visit(taskId))

  // Process tasks in reverse order
  stack.reverse().forEach((taskId) => {
    const node = taskMap.get(taskId)
    if (!node) return

    if (node.dependents.length === 0) return

    // Calculate latest finish based on successors
    let minSuccessorStart = new Date(projectEnd)

    node.dependents.forEach((dep) => {
      const successor = taskMap.get(dep.successorId)
      if (!successor) return

      let succStart = successor.latestStart

      // Apply lag
      if (dep.lag) {
        succStart = new Date(succStart.getTime() - dep.lag * 24 * 60 * 60 * 1000)
      }

      // Handle different dependency types
      switch (dep.type) {
        case 'finish-to-start':
          if (succStart < minSuccessorStart) {
            minSuccessorStart = succStart
          }
          break
        case 'start-to-start':
          // Special case handling
          const duration = node.task.endAt.getTime() - node.task.startAt.getTime()
          const adjustedFinish = new Date(succStart.getTime() + duration)
          if (adjustedFinish < minSuccessorStart) {
            minSuccessorStart = adjustedFinish
          }
          break
        // Add other cases as needed
      }
    })

    node.latestFinish = minSuccessorStart
    const duration = node.task.endAt.getTime() - node.task.startAt.getTime()
    node.latestStart = new Date(node.latestFinish.getTime() - duration)
  })
}

/**
 * Validate dependencies for circular references
 */
export function validateDependencies(dependencies: TaskDependency[]): {
  valid: boolean
  circularDependencies?: string[]
} {
  const graph = new Map<string, Set<string>>()

  // Build adjacency list
  dependencies.forEach((dep) => {
    if (!graph.has(dep.predecessorId)) {
      graph.set(dep.predecessorId, new Set())
    }
    graph.get(dep.predecessorId)!.add(dep.successorId)
  })

  // Detect cycles using DFS
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const cycles: string[] = []

  function hasCycle(taskId: string, path: string[]): boolean {
    visited.add(taskId)
    recursionStack.add(taskId)
    path.push(taskId)

    const neighbors = graph.get(taskId) || new Set()

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor, [...path])) {
          return true
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor)
        const cycle = path.slice(cycleStart).concat(neighbor)
        cycles.push(cycle.join(' -> '))
        return true
      }
    }

    recursionStack.delete(taskId)
    return false
  }

  // Check all nodes
  graph.forEach((_, taskId) => {
    if (!visited.has(taskId)) {
      hasCycle(taskId, [])
    }
  })

  return {
    valid: cycles.length === 0,
    circularDependencies: cycles.length > 0 ? cycles : undefined,
  }
}

/**
 * Auto-schedule tasks based on dependencies
 */
export function autoScheduleTasks(
  tasks: Task[],
  dependencies: TaskDependency[]
): Task[] {
  const taskMap = new Map<string, TaskNode>()

  // Initialize task nodes
  tasks.forEach((task) => {
    const taskDeps = dependencies.filter((d) => d.successorId === task.id)
    const taskDependents = dependencies.filter((d) => d.predecessorId === task.id)

    taskMap.set(task.id, {
      id: task.id,
      task: { ...task },
      dependencies: taskDeps,
      dependents: taskDependents,
      earliestStart: task.startAt,
      earliestFinish: task.endAt,
      latestStart: task.startAt,
      latestFinish: task.endAt,
      slack: 0,
      isCritical: false,
    })
  })

  // Forward pass to calculate new dates
  forwardPass(taskMap, dependencies)

  // Return updated tasks
  const scheduledTasks: Task[] = []

  taskMap.forEach((node) => {
    const duration = node.task.endAt.getTime() - node.task.startAt.getTime()

    scheduledTasks.push({
      ...node.task,
      startAt: node.earliestStart,
      endAt: new Date(node.earliestStart.getTime() + duration),
    })
  })

  return scheduledTasks
}
