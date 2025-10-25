import { IDataProvider, ProviderConfig } from "./data-provider.interface"
import { BaserowProvider } from "./baserow/baserow-provider"
import { DemoProvider } from "./demo/demo-provider"
import { PostgresProvider } from "./postgres/postgres-provider"

/**
 * Factory to create the appropriate data provider based on configuration
 */
export function createDataProvider(config?: ProviderConfig): IDataProvider {
  const providerType = config?.type || (process.env.DATA_PROVIDER as "baserow" | "postgres" | "demo") || "demo"

  switch (providerType) {
    case "demo":
      // Use demo provider with sample data
      return new DemoProvider()

    case "baserow":
      return new BaserowProvider({
        baseUrl: config?.baseUrl || process.env.BASEROW_BASE_URL || "https://api.baserow.io",
        token: config?.token || process.env.BASEROW_TOKEN || "",
        tasksTableId: process.env.BASEROW_TABLE_ID_TASKS || "",
        statusesTableId: process.env.BASEROW_TABLE_ID_STATUSES || "",
      })

    case "postgres":
      return new PostgresProvider({
        host: process.env.POSTGRES_HOST || "localhost",
        port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
        database: process.env.POSTGRES_DB || "gantt_db",
        user: process.env.POSTGRES_USER || "gantt_user",
        password: process.env.POSTGRES_PASSWORD || "",
        ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : false,
      })

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
