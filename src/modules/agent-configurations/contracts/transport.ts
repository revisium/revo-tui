import type {
  SubscriptionLease,
  SubscriptionState,
} from '../../graphql-subscriptions/index.js'
import type {
  AgentConfigurationsSnapshot,
  AgentDefinitionPage,
} from './types.js'

export interface AgentConfigurationsSubscriptionOptions {
  readonly signal: AbortSignal
  readonly prepare: (signal: AbortSignal) => Promise<void>
  readonly next: (
    snapshot: AgentConfigurationsSnapshot,
    signal: AbortSignal,
  ) => void | Promise<void>
  readonly changed?: (state: SubscriptionState) => void
}

export interface AgentConfigurationsTransport {
  definitions(signal: AbortSignal, after?: string): Promise<AgentDefinitionPage>
  subscribe(options: AgentConfigurationsSubscriptionOptions): SubscriptionLease
}
