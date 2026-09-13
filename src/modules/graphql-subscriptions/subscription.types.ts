export type SubscriptionVariables = Readonly<Record<string, unknown>>

export interface SubscriptionSink<T> {
  readonly next: (data: T) => void
  readonly error: (error: SubscriptionError) => void
  readonly complete: () => void
}

export interface SseConnectionOptions {
  readonly endpoint: string
  readonly headers?: Readonly<Record<string, string>>
  readonly fetch?: typeof fetch
  readonly connectTimeoutMs?: number
  readonly onConnected?: () => void
  readonly onTerminalError?: (error: SubscriptionError) => void
}

export interface SubscriptionOperation {
  dispose(): void
}

import type { SubscriptionError } from './SubscriptionError.js'
