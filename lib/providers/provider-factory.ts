import { IDataProvider, ProviderConfig } from "./data-provider.interface"
import { BaserowProvider } from "./baserow/baserow-provider"

/**
 * Factory to create the appropriate data provider based on configuration
 */
export function createDataProvider(config?: ProviderConfig): IDataProvider {
  const providerType = config?.type || (process.env.DATA_PROVIDER as "baserow" | "postgres") || "baserow"

  switch (providerType) {
    case "baserow":
      return new BaserowProvider({
        baseUrl: config?.baseUrl || process.env.BASEROW_BASE_URL || "https://api.baserow.io",
        token: config?.token || process.env.BASEROW_TOKEN || "",
        tasksTableId: process.env.BASEROW_TABLE_ID_TASKS || "",
        statusesTableId: process.env.BASEROW_TABLE_ID_STATUSES || "",
      })

    case "postgres":
      // Future implementation
      throw new Error("Postgres provider not yet implemented")

    default:
      throw new Error(`Unknown provider type: ${providerType}`)
  }
}

/**
 * Get the default singleton provider instance
 */
let defaultProvider: IDataProvider | null = null

export function getDataProvider(): IDataProvider {
  if (!defaultProvider) {
    defaultProvider = createDataProvider()
  }
  return defaultProvider
}
