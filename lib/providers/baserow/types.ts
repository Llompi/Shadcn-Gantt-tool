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

// Single select option from Baserow field metadata
export interface BaserowSelectOption {
  id: number
  value: string
  color: string
}

// Baserow field metadata (from /api/database/fields/table/{table_id}/)
export interface BaserowFieldMetadata {
  id: number
  name: string
  type: string
  table_id?: number
  order?: number
  primary?: boolean
  read_only?: boolean
  // Single select field specific properties
  select_options?: BaserowSelectOption[]
  // Additional type-specific properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}
