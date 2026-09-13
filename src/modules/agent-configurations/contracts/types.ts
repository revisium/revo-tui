export type AgentConfigurationsStatus = 'NOT_INITIALIZED' | 'LOADING' | 'READY'

export interface AgentConfigurationAgent {
  readonly id: string
  readonly version: string
  readonly installationId: string
}

export interface AgentConfigurationGroup {
  readonly id: string
  readonly name: string
}

export interface AgentConfigurationValue {
  readonly description?: string
  readonly group?: AgentConfigurationGroup | null
  readonly name: string
  readonly value: string
}

export interface AgentConfigurationProvider {
  readonly id: string
  readonly models: readonly AgentConfigurationValue[]
  readonly name: string
}

export interface AgentConfigurationModel {
  readonly currentModel: string
  readonly currentProvider?: AgentConfigurationGroup | null
  readonly optionId: string
  readonly providers: readonly AgentConfigurationProvider[]
  readonly sessionAvailable: readonly AgentConfigurationValue[]
}

export type AgentConfigurationOption =
  | {
      readonly kind: 'boolean'
      readonly category?: string | null
      readonly currentValue: boolean
      readonly description?: string | null
      readonly id: string
      readonly name: string
      readonly type: string
    }
  | {
      readonly kind: 'select'
      readonly category?: string | null
      readonly currentValue: string
      readonly description?: string | null
      readonly id: string
      readonly name: string
      readonly type: string
      readonly values: readonly AgentConfigurationValue[]
    }

export interface AgentLaunchEvidence {
  readonly executable: string
  readonly reportedVersion: string
}

export interface AgentConfigurationCatalog {
  readonly agent: AgentConfigurationAgent
  readonly catalogRevision: string
  readonly definitionDigest: string
  readonly launch: AgentLaunchEvidence
  readonly model?: AgentConfigurationModel | null
  readonly options: readonly AgentConfigurationOption[]
  readonly schemaVersion: string
}

export interface AgentDefinition {
  readonly id: string
  readonly version: string
  readonly installationId: string
  readonly name: string
  readonly description: string
}

export interface AgentDefinitionPage {
  readonly items: readonly AgentDefinition[]
  readonly next?: string
}

export interface AgentConfigurationsSnapshot {
  readonly status: AgentConfigurationsStatus
  readonly catalogs: readonly AgentConfigurationCatalog[]
}

export interface AgentLaunchConfiguration {
  readonly catalogRevision: string
  readonly selections: Readonly<Record<string, string | boolean>>
}
