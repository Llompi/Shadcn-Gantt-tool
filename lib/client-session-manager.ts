import { BaserowClientConfig } from "./providers/baserow/client-baserow-provider"

interface StoredConfig extends BaserowClientConfig {
  timestamp: number
}

/**
 * Client Session Manager
 *
 * Manages client-side Baserow configuration stored in browser sessionStorage.
 * Session data is automatically cleared when the browser tab is closed.
 *
 * Security features:
 * - Uses sessionStorage (not localStorage) for automatic cleanup
 * - Optional auto-expiry after 4 hours of inactivity
 * - No server-side storage of credentials
 */
export class ClientSessionManager {
  private static readonly CONFIG_KEY = "gantt-client-baserow-config"
  private static readonly EXPIRY_HOURS = 4

  /**
   * Check if we're running in a browser environment
   */
  private static isBrowser(): boolean {
    return typeof window !== "undefined" && typeof sessionStorage !== "undefined"
  }

  /**
   * Save Baserow configuration to session storage
   */
  static saveConfig(config: BaserowClientConfig): void {
    if (!this.isBrowser()) {
      console.warn("SessionStorage not available (SSR environment)")
      return
    }

    const storedConfig: StoredConfig = {
      ...config,
      timestamp: Date.now(),
    }

    try {
      sessionStorage.setItem(this.CONFIG_KEY, JSON.stringify(storedConfig))
    } catch (error) {
      console.error("Failed to save config to sessionStorage:", error)
    }
  }

  /**
   * Retrieve Baserow configuration from session storage
   * Returns null if not found or expired
   */
  static getConfig(): BaserowClientConfig | null {
    if (!this.isBrowser()) {
      return null
    }

    try {
      const stored = sessionStorage.getItem(this.CONFIG_KEY)
      if (!stored) return null

      const parsed: StoredConfig = JSON.parse(stored)

      // Check if expired (optional - configurable)
      const expiryMs = this.EXPIRY_HOURS * 60 * 60 * 1000
      if (Date.now() - parsed.timestamp > expiryMs) {
        this.clearConfig()
        return null
      }

      // Return config without timestamp
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { timestamp, ...config } = parsed
      return config
    } catch (error) {
      console.error("Failed to retrieve config from sessionStorage:", error)
      return null
    }
  }

  /**
   * Clear the stored configuration
   */
  static clearConfig(): void {
    if (!this.isBrowser()) return

    try {
      sessionStorage.removeItem(this.CONFIG_KEY)
    } catch (error) {
      console.error("Failed to clear config from sessionStorage:", error)
    }
  }

  /**
   * Check if client mode is active
   */
  static isClientMode(): boolean {
    return this.getConfig() !== null
  }

  /**
   * Get the time remaining before session expires (in milliseconds)
   * Returns null if no active session
   */
  static getTimeRemaining(): number | null {
    if (!this.isBrowser()) return null

    try {
      const stored = sessionStorage.getItem(this.CONFIG_KEY)
      if (!stored) return null

      const parsed: StoredConfig = JSON.parse(stored)
      const expiryMs = this.EXPIRY_HOURS * 60 * 60 * 1000
      const elapsed = Date.now() - parsed.timestamp
      const remaining = expiryMs - elapsed

      return remaining > 0 ? remaining : 0
    } catch {
      return null
    }
  }

  /**
   * Refresh the session timestamp (extend session)
   */
  static refreshSession(): void {
    const config = this.getConfig()
    if (config) {
      this.saveConfig(config)
    }
  }
}
