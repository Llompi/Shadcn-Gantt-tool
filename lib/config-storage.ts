/**
 * Configuration Storage Utilities
 *
 * Handles reading and writing configuration to the file system
 * for server-side persistence.
 *
 * IMPORTANT: This module should only be imported server-side
 */

import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import type { BaserowFieldMapping } from './providers/baserow/field-mapping'

const CONFIG_DIR = path.join(process.cwd(), '.gantt-config')
const FIELD_MAPPING_FILE = path.join(CONFIG_DIR, 'field-mappings.json')

/**
 * Ensure config directory exists
 */
async function ensureConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist, that's okay
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error
    }
  }
}

/**
 * Save field mappings to file
 */
export async function saveFieldMapping(mapping: BaserowFieldMapping): Promise<void> {
  await ensureConfigDir()
  await fs.writeFile(
    FIELD_MAPPING_FILE,
    JSON.stringify(mapping, null, 2),
    'utf-8'
  )
}

/**
 * Load field mappings from file
 */
export async function loadFieldMapping(): Promise<BaserowFieldMapping | null> {
  try {
    const data = await fs.readFile(FIELD_MAPPING_FILE, 'utf-8')
    return JSON.parse(data) as BaserowFieldMapping
  } catch (error) {
    // File doesn't exist or can't be read
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

/**
 * Check if field mapping file exists
 */
export async function hasFieldMapping(): Promise<boolean> {
  try {
    await fs.access(FIELD_MAPPING_FILE)
    return true
  } catch {
    return false
  }
}
