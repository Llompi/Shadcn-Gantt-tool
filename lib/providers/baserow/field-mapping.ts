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
 * Get field mapping from environment or use defaults
 */
export function getFieldMapping(): BaserowFieldMapping {
  // In the future, this could read from environment variables or a config file
  return DEFAULT_FIELD_MAPPING
}
