/**
 * Field Mapping Configuration for Baserow
 *
 * This configuration maps Baserow field names to our canonical Task model.
 * Update these mappings when your Baserow schema changes to minimize refactoring.
 */

export interface BaserowFieldMapping {
  // Task table fields
  tasks: {
    id: string
    name: string
    startAt: string
    endAt: string
    status: string // Link to status table or single select
    group?: string
    owner?: string
    description?: string
    progress?: string
    createdAt?: string
    updatedAt?: string
  }
  // Status table fields
  statuses: {
    id: string
    name: string
    color?: string
  }
}

/**
 * Default field mapping
 * Customize this based on your Baserow table structure
 */
export const DEFAULT_FIELD_MAPPING: BaserowFieldMapping = {
  tasks: {
    id: "id",
    name: "Name",
    startAt: "Start Date",
    endAt: "End Date",
    status: "Status",
    group: "Group",
    owner: "Owner",
    description: "Description",
    progress: "Progress",
    createdAt: "created_on",
    updatedAt: "updated_on",
  },
  statuses: {
    id: "id",
    name: "Name",
    color: "Color",
  },
}

/**
 * Get field mapping from saved config or use defaults
 * Note: This function returns the default mapping.
 * For server-side usage with saved mappings, use getFieldMappingAsync from field-mapping-server.ts
 */
export function getFieldMapping(): BaserowFieldMapping {
  return DEFAULT_FIELD_MAPPING
}
