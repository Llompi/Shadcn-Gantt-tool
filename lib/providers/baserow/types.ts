/**
 * Baserow-specific types
 */

// Baserow API response format
export interface BaserowPaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Generic Baserow row (any type is intentional as structure varies)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BaserowRow = Record<string, any>

// Baserow API error
export interface BaserowError {
  error: string
  detail?: string
}

// Request options
export interface BaserowRequestOptions {
  page?: number
  size?: number
  search?: string
  order_by?: string
  filters?: Record<string, string | number | boolean>
}
