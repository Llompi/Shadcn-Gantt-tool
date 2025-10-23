import { Task, TaskStatus } from "@/types/task"

/**
 * Sample demo data for testing the Gantt chart without Baserow
 */

export const DEMO_STATUSES: TaskStatus[] = [
  {
    id: "1",
    name: "To Do",
    color: "#94a3b8", // slate-400
  },
  {
    id: "2",
    name: "In Progress",
    color: "#3b82f6", // blue-500
  },
  {
    id: "3",
    name: "Review",
    color: "#f59e0b", // amber-500
  },
  {
    id: "4",
    name: "Done",
    color: "#10b981", // green-500
  },
  {
    id: "5",
    name: "Blocked",
    color: "#ef4444", // red-500
  },
]

// Helper to create dates relative to today
const today = new Date()
const getDate = (daysOffset: number) => {
  const date = new Date(today)
  date.setDate(date.getDate() + daysOffset)
  return date
}

export const DEMO_TASKS: Task[] = [
  {
    id: "1",
    name: "Project Planning & Setup",
    startAt: getDate(-30),
    endAt: getDate(-23),
    status: DEMO_STATUSES[3], // Done
    group: "Phase 1: Foundation",
    owner: "Alice",
    description: "Define project scope, requirements, and initial architecture",
    progress: 100,
  },
  {
    id: "2",
    name: "Design System Implementation",
    startAt: getDate(-22),
    endAt: getDate(-10),
    status: DEMO_STATUSES[3], // Done
    group: "Phase 1: Foundation",
    owner: "Bob",
    description: "Create component library and design tokens",
    progress: 100,
  },
  {
    id: "3",
    name: "Database Schema Design",
    startAt: getDate(-15),
    endAt: getDate(-5),
    status: DEMO_STATUSES[3], // Done
    group: "Phase 2: Backend",
    owner: "Alice",
    description: "Design and implement database models and relationships",
    progress: 100,
  },
  {
    id: "4",
    name: "API Development",
    startAt: getDate(-10),
    endAt: getDate(5),
    status: DEMO_STATUSES[1], // In Progress
    group: "Phase 2: Backend",
    owner: "Charlie",
    description: "Build REST API endpoints and authentication",
    progress: 60,
  },
  {
    id: "5",
    name: "Frontend Components",
    startAt: getDate(-5),
    endAt: getDate(10),
    status: DEMO_STATUSES[1], // In Progress
    group: "Phase 3: Frontend",
    owner: "Bob",
    description: "Develop React components for main features",
    progress: 45,
  },
  {
    id: "6",
    name: "User Authentication Flow",
    startAt: getDate(0),
    endAt: getDate(7),
    status: DEMO_STATUSES[2], // Review
    group: "Phase 3: Frontend",
    owner: "Alice",
    description: "Implement login, signup, and password reset",
    progress: 80,
  },
  {
    id: "7",
    name: "Integration Testing",
    startAt: getDate(8),
    endAt: getDate(15),
    status: DEMO_STATUSES[0], // To Do
    group: "Phase 4: Testing",
    owner: "Charlie",
    description: "Write and execute integration tests",
    progress: 0,
  },
  {
    id: "8",
    name: "Performance Optimization",
    startAt: getDate(10),
    endAt: getDate(20),
    status: DEMO_STATUSES[0], // To Do
    group: "Phase 4: Testing",
    owner: "Bob",
    description: "Optimize load times and bundle size",
    progress: 0,
  },
  {
    id: "9",
    name: "Documentation Writing",
    startAt: getDate(15),
    endAt: getDate(25),
    status: DEMO_STATUSES[0], // To Do
    group: "Phase 5: Launch",
    owner: "Alice",
    description: "Create user guides and API documentation",
    progress: 0,
  },
  {
    id: "10",
    name: "Beta Testing",
    startAt: getDate(20),
    endAt: getDate(30),
    status: DEMO_STATUSES[0], // To Do
    group: "Phase 5: Launch",
    owner: "Charlie",
    description: "Conduct beta testing with select users",
    progress: 0,
  },
  {
    id: "11",
    name: "Production Deployment",
    startAt: getDate(30),
    endAt: getDate(35),
    status: DEMO_STATUSES[0], // To Do
    group: "Phase 5: Launch",
    owner: "Alice",
    description: "Deploy to production and monitor",
    progress: 0,
  },
  {
    id: "12",
    name: "Security Audit",
    startAt: getDate(12),
    endAt: getDate(18),
    status: DEMO_STATUSES[4], // Blocked
    group: "Phase 4: Testing",
    owner: "External Team",
    description: "Third-party security assessment - waiting for vendor",
    progress: 10,
  },
]
