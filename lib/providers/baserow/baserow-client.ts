import { BaserowPaginatedResponse, BaserowRow, BaserowRequestOptions } from "./types"

/**
 * Baserow API Client
 *
 * Handles low-level communication with Baserow REST API
 */
export class BaserowClient {
  private baseUrl: string
  private token: string

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "") // Remove trailing slash
    this.token = token
  }

  /**
   * Make authenticated request to Baserow API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Token ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: "Unknown error",
        detail: response.statusText,
      }))
      throw new Error(`Baserow API error: ${error.error || error.detail || response.statusText}`)
    }

    return response.json()
  }

  /**
   * List rows from a table with pagination
   */
  async listRows(
    tableId: string,
    options?: BaserowRequestOptions
  ): Promise<BaserowPaginatedResponse<BaserowRow>> {
    const params = new URLSearchParams()

    if (options?.page) params.set("page", options.page.toString())
    if (options?.size) params.set("size", options.size.toString())
    if (options?.search) params.set("search", options.search)
    if (options?.order_by) params.set("order_by", options.order_by)

    // Add filters
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        params.set(key, String(value))
      })
    }

    const queryString = params.toString()
    const endpoint = `/api/database/rows/table/${tableId}/${queryString ? `?${queryString}` : ""}`

    return this.request<BaserowPaginatedResponse<BaserowRow>>(endpoint)
  }

  /**
   * Get all rows from a table (handles pagination automatically)
   */
  async getAllRows(
    tableId: string,
    options?: Omit<BaserowRequestOptions, "page">
  ): Promise<BaserowRow[]> {
    const allRows: BaserowRow[] = []
    let nextUrl: string | null = null
    let isFirstPage = true

    while (isFirstPage || nextUrl) {
      const response: BaserowPaginatedResponse<BaserowRow> = isFirstPage
        ? await this.listRows(tableId, options)
        : await this.request<BaserowPaginatedResponse<BaserowRow>>(
            nextUrl!.replace(this.baseUrl, "")
          )

      allRows.push(...response.results)
      nextUrl = response.next
      isFirstPage = false

      // Safety check to prevent infinite loops
      if (allRows.length > 10000) {
        console.warn("Reached 10,000 row limit. Consider using pagination.")
        break
      }
    }

    return allRows
  }

  /**
   * Get a single row by ID
   */
  async getRow(tableId: string, rowId: string): Promise<BaserowRow> {
    return this.request<BaserowRow>(
      `/api/database/rows/table/${tableId}/${rowId}/`
    )
  }

  /**
   * Create a new row
   */
  async createRow(tableId: string, data: Partial<BaserowRow>): Promise<BaserowRow> {
    return this.request<BaserowRow>(
      `/api/database/rows/table/${tableId}/`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Update an existing row
   */
  async updateRow(
    tableId: string,
    rowId: string,
    data: Partial<BaserowRow>
  ): Promise<BaserowRow> {
    return this.request<BaserowRow>(
      `/api/database/rows/table/${tableId}/${rowId}/`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Delete a row
   */
  async deleteRow(tableId: string, rowId: string): Promise<void> {
    await this.request<void>(
      `/api/database/rows/table/${tableId}/${rowId}/`,
      {
        method: "DELETE",
      }
    )
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to make a simple request to verify connection
      await this.request("/api/database/tables/")
      return true
    } catch {
      return false
    }
  }
}
