/**
 * Intelligent Field Detection Utility
 *
 * Analyzes Baserow table fields and suggests optimal mappings
 * to the Gantt chart's required fields.
 */

import { BaserowFieldMapping } from "./field-mapping"

/**
 * Baserow field metadata from API
 */
export interface BaserowFieldMetadata {
  id: number
  name: string
  type: string
  table_id?: number
  order?: number
  primary?: boolean
  read_only?: boolean
  // Additional type-specific properties
  date_format?: string
  date_include_time?: boolean
  number_decimal_places?: number
  link_row_table_id?: number
  [key: string]: unknown
}

/**
 * Field mapping suggestion with confidence score
 */
export interface FieldSuggestion {
  field: BaserowFieldMetadata
  confidence: number // 0-1 score
  reason: string
}

/**
 * Complete mapping suggestions for all required fields
 */
export interface MappingSuggestions {
  tasks: {
    id: FieldSuggestion[]
    name: FieldSuggestion[]
    startAt: FieldSuggestion[]
    endAt: FieldSuggestion[]
    status: FieldSuggestion[]
    group?: FieldSuggestion[]
    owner?: FieldSuggestion[]
    description?: FieldSuggestion[]
    progress?: FieldSuggestion[]
  }
  statuses: {
    id: FieldSuggestion[]
    name: FieldSuggestion[]
    color?: FieldSuggestion[]
  }
}

/**
 * Field name patterns for intelligent matching
 */
const FIELD_PATTERNS = {
  id: {
    names: ["id", "identifier", "key", "pk"],
    types: ["number", "text", "autonumber"],
    weight: 1.0,
  },
  name: {
    names: ["name", "title", "task", "task name", "label", "description"],
    types: ["text", "long_text", "single_line_text"],
    weight: 0.9,
  },
  startAt: {
    names: ["start", "start date", "start_date", "startdate", "begin", "from", "starts at"],
    types: ["date"],
    weight: 1.0,
  },
  endAt: {
    names: ["end", "end date", "end_date", "enddate", "finish", "to", "due", "deadline", "ends at"],
    types: ["date"],
    weight: 1.0,
  },
  status: {
    names: ["status", "state", "stage", "phase"],
    types: ["single_select", "link_row", "multiple_select"],
    weight: 0.9,
  },
  group: {
    names: ["group", "category", "project", "team", "department"],
    types: ["text", "single_select", "link_row"],
    weight: 0.7,
  },
  owner: {
    names: ["owner", "assignee", "assigned to", "responsible", "user"],
    types: ["text", "single_select", "link_row", "multiple_collaborators"],
    weight: 0.7,
  },
  description: {
    names: ["description", "details", "notes", "comments", "summary"],
    types: ["long_text", "text"],
    weight: 0.6,
  },
  progress: {
    names: ["progress", "completion", "percent", "percentage", "%"],
    types: ["number", "percent"],
    weight: 0.8,
  },
  color: {
    names: ["color", "colour", "hex", "background"],
    types: ["text", "single_line_text"],
    weight: 0.8,
  },
} as const

/**
 * Calculate similarity between two strings (case-insensitive)
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  // Exact match
  if (s1 === s2) return 1.0

  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 0.8

  // Levenshtein distance for fuzzy matching
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Calculate confidence score for a field match
 */
function calculateConfidence(
  field: BaserowFieldMetadata,
  targetField: keyof typeof FIELD_PATTERNS
): { score: number; reason: string } {
  const pattern = FIELD_PATTERNS[targetField]
  let score = 0
  const reasons: string[] = []

  // Check field name similarity
  let maxNameScore = 0
  let matchedPattern = ""

  for (const patternName of pattern.names) {
    const similarity = stringSimilarity(field.name, patternName)
    if (similarity > maxNameScore) {
      maxNameScore = similarity
      matchedPattern = patternName
    }
  }

  if (maxNameScore > 0.6) {
    score += maxNameScore * 0.6 * pattern.weight
    reasons.push(`Name matches pattern "${matchedPattern}" (${Math.round(maxNameScore * 100)}%)`)
  }

  // Check field type match
  if ((pattern.types as readonly string[]).includes(field.type)) {
    score += 0.4 * pattern.weight
    reasons.push(`Type "${field.type}" is appropriate`)
  }

  // Special rules for specific fields
  if (targetField === "id" && field.primary) {
    score = 1.0
    reasons.push("Primary key field")
  }

  if (targetField === "startAt" || targetField === "endAt") {
    if (field.type === "date") {
      score += 0.1
      reasons.push("Date field type confirmed")
    }
  }

  if (targetField === "progress") {
    if (field.type === "percent" || field.name.includes("%")) {
      score += 0.2
      reasons.push("Percentage field detected")
    }
  }

  // Normalize score to 0-1 range
  score = Math.min(score, 1.0)

  return {
    score,
    reason: reasons.length > 0 ? reasons.join(", ") : "No strong match",
  }
}

/**
 * Detect and suggest field mappings for task fields
 */
export function detectTaskFieldMappings(
  fields: BaserowFieldMetadata[]
): MappingSuggestions["tasks"] {
  const suggestions: MappingSuggestions["tasks"] = {
    id: [],
    name: [],
    startAt: [],
    endAt: [],
    status: [],
    group: [],
    owner: [],
    description: [],
    progress: [],
  }

  // Analyze each field
  for (const field of fields) {
    for (const targetField of Object.keys(suggestions) as Array<keyof typeof suggestions>) {
      const { score, reason } = calculateConfidence(field, targetField as keyof typeof FIELD_PATTERNS)

      // Only include suggestions with reasonable confidence
      if (score > 0.3) {
        suggestions[targetField]?.push({
          field,
          confidence: score,
          reason,
        })
      }
    }
  }

  // Sort suggestions by confidence (highest first)
  for (const key of Object.keys(suggestions) as Array<keyof typeof suggestions>) {
    suggestions[key]?.sort((a, b) => b.confidence - a.confidence)
  }

  return suggestions
}

/**
 * Detect and suggest field mappings for status fields
 */
export function detectStatusFieldMappings(
  fields: BaserowFieldMetadata[]
): MappingSuggestions["statuses"] {
  const suggestions: MappingSuggestions["statuses"] = {
    id: [],
    name: [],
    color: [],
  }

  // Analyze each field
  for (const field of fields) {
    for (const targetField of Object.keys(suggestions) as Array<keyof typeof suggestions>) {
      const { score, reason } = calculateConfidence(field, targetField as keyof typeof FIELD_PATTERNS)

      if (score > 0.3) {
        suggestions[targetField]?.push({
          field,
          confidence: score,
          reason,
        })
      }
    }
  }

  // Sort by confidence
  for (const key of Object.keys(suggestions) as Array<keyof typeof suggestions>) {
    suggestions[key]?.sort((a, b) => b.confidence - a.confidence)
  }

  return suggestions
}

/**
 * Get the best (highest confidence) suggestion for each field
 */
export function getBestMappings(
  taskFields: BaserowFieldMetadata[],
  statusFields: BaserowFieldMetadata[]
): Partial<BaserowFieldMapping> {
  const taskSuggestions = detectTaskFieldMappings(taskFields)
  const statusSuggestions = detectStatusFieldMappings(statusFields)

  return {
    tasks: {
      id: taskSuggestions.id[0]?.field.name || "id",
      name: taskSuggestions.name[0]?.field.name || "",
      startAt: taskSuggestions.startAt[0]?.field.name || "",
      endAt: taskSuggestions.endAt[0]?.field.name || "",
      status: taskSuggestions.status[0]?.field.name || "",
      group: taskSuggestions.group?.[0]?.field.name,
      owner: taskSuggestions.owner?.[0]?.field.name,
      description: taskSuggestions.description?.[0]?.field.name,
      progress: taskSuggestions.progress?.[0]?.field.name,
    },
    statuses: {
      id: statusSuggestions.id[0]?.field.name || "id",
      name: statusSuggestions.name[0]?.field.name || "",
      color: statusSuggestions.color?.[0]?.field.name,
    },
  }
}

/**
 * Validate that required fields are mapped
 */
export function validateFieldMapping(
  mapping: Partial<BaserowFieldMapping>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required task fields
  if (!mapping.tasks?.id) errors.push("Task ID field is required")
  if (!mapping.tasks?.name) errors.push("Task Name field is required")
  if (!mapping.tasks?.startAt) errors.push("Task Start Date field is required")
  if (!mapping.tasks?.endAt) errors.push("Task End Date field is required")

  // Required status fields
  if (!mapping.statuses?.id) errors.push("Status ID field is required")
  if (!mapping.statuses?.name) errors.push("Status Name field is required")

  return {
    valid: errors.length === 0,
    errors,
  }
}
