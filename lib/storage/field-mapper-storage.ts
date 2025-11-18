/**
 * Field Mapper Storage Service
 * Handles persistence of field mapping configurations
 */

import type { FieldMapping, ColorRule, TextTemplate } from '@/components/data-field-mapper'

const STORAGE_KEYS = {
  MAPPINGS: 'gantt_field_mappings',
  COLOR_RULES: 'gantt_color_rules',
  TEXT_TEMPLATES: 'gantt_text_templates',
  ACTIVE_PRESET: 'gantt_active_preset',
} as const

export interface MappingPreset {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  mappings: FieldMapping[]
  colorRules: ColorRule[]
  textTemplates: TextTemplate[]
}

class FieldMapperStorage {
  /**
   * Check if localStorage is available
   */
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  /**
   * Save field mappings to localStorage
   */
  saveMappings(mappings: FieldMapping[]): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage not available')
      return false
    }

    try {
      localStorage.setItem(STORAGE_KEYS.MAPPINGS, JSON.stringify(mappings))
      return true
    } catch (error) {
      console.error('Failed to save mappings:', error)
      return false
    }
  }

  /**
   * Load field mappings from localStorage
   */
  loadMappings(): FieldMapping[] {
    if (!this.isStorageAvailable()) {
      return []
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MAPPINGS)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load mappings:', error)
      return []
    }
  }

  /**
   * Save color rules to localStorage
   */
  saveColorRules(rules: ColorRule[]): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage not available')
      return false
    }

    try {
      localStorage.setItem(STORAGE_KEYS.COLOR_RULES, JSON.stringify(rules))
      return true
    } catch (error) {
      console.error('Failed to save color rules:', error)
      return false
    }
  }

  /**
   * Load color rules from localStorage
   */
  loadColorRules(): ColorRule[] {
    if (!this.isStorageAvailable()) {
      return []
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLOR_RULES)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load color rules:', error)
      return []
    }
  }

  /**
   * Save text templates to localStorage
   */
  saveTextTemplates(templates: TextTemplate[]): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage not available')
      return false
    }

    try {
      localStorage.setItem(STORAGE_KEYS.TEXT_TEMPLATES, JSON.stringify(templates))
      return true
    } catch (error) {
      console.error('Failed to save text templates:', error)
      return false
    }
  }

  /**
   * Load text templates from localStorage
   */
  loadTextTemplates(): TextTemplate[] {
    if (!this.isStorageAvailable()) {
      return []
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TEXT_TEMPLATES)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load text templates:', error)
      return []
    }
  }

  /**
   * Save complete preset
   */
  savePreset(preset: Omit<MappingPreset, 'id' | 'createdAt' | 'updatedAt'>): MappingPreset | null {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage not available')
      return null
    }

    try {
      const presets = this.loadPresets()
      const newPreset: MappingPreset = {
        ...preset,
        id: `preset_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      presets.push(newPreset)
      localStorage.setItem('gantt_mapping_presets', JSON.stringify(presets))
      return newPreset
    } catch (error) {
      console.error('Failed to save preset:', error)
      return null
    }
  }

  /**
   * Load all presets
   */
  loadPresets(): MappingPreset[] {
    if (!this.isStorageAvailable()) {
      return []
    }

    try {
      const stored = localStorage.getItem('gantt_mapping_presets')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load presets:', error)
      return []
    }
  }

  /**
   * Delete a preset
   */
  deletePreset(presetId: string): boolean {
    if (!this.isStorageAvailable()) {
      return false
    }

    try {
      const presets = this.loadPresets()
      const filtered = presets.filter(p => p.id !== presetId)
      localStorage.setItem('gantt_mapping_presets', JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('Failed to delete preset:', error)
      return false
    }
  }

  /**
   * Load active preset
   */
  loadActivePreset(): MappingPreset | null {
    if (!this.isStorageAvailable()) {
      return null
    }

    try {
      const presetId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PRESET)
      if (!presetId) return null

      const presets = this.loadPresets()
      return presets.find(p => p.id === presetId) || null
    } catch (error) {
      console.error('Failed to load active preset:', error)
      return null
    }
  }

  /**
   * Set active preset
   */
  setActivePreset(presetId: string): boolean {
    if (!this.isStorageAvailable()) {
      return false
    }

    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PRESET, presetId)
      return true
    } catch (error) {
      console.error('Failed to set active preset:', error)
      return false
    }
  }

  /**
   * Clear all stored data
   */
  clearAll(): boolean {
    if (!this.isStorageAvailable()) {
      return false
    }

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      localStorage.removeItem('gantt_mapping_presets')
      return true
    } catch (error) {
      console.error('Failed to clear storage:', error)
      return false
    }
  }
}

// Export singleton instance
export const fieldMapperStorage = new FieldMapperStorage()
