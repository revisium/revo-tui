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

export type SubscriptionStatus =
  | 'Connecting'
  | 'Live'
  | 'Reconnecting'
  | 'Offline'
  | 'Stopped'

export interface SubscriptionState {
  readonly status: SubscriptionStatus
  readonly error: string
}

export interface SubscriptionOptions<T, V extends SubscriptionVariables> {
  readonly signal: AbortSignal
  readonly prepare: (signal: AbortSignal) => V | Promise<V>
  readonly next: (data: T, signal: AbortSignal) => void | Promise<void>
  readonly changed?: (state: SubscriptionState) => void
}

export interface SubscriptionLease {
  readonly done: Promise<void>
  dispose(): void
}

export type GraphqlSubscriptionsOptions = Omit<
  SseConnectionOptions,
  'onConnected' | 'onTerminalError'
>

import type { SubscriptionError } from './SubscriptionError.js'
