import { getOperationAST, type DocumentNode } from 'graphql'
import { randomInt } from 'node:crypto'
import { SseHeartbeat } from './SseHeartbeat.js'
import { SubscriptionOperation } from './SubscriptionOperation.js'
import { SseConnection } from './SseConnection.js'
import { SubscriptionError, timeoutError } from './SubscriptionError.js'
import type {
  GraphqlSubscriptionsOptions,
  SubscriptionLease,
  SubscriptionOptions,
  SubscriptionState,
  SubscriptionVariables,
} from './subscription.types.js'

const MAX_RETRIES = 5
const EXPONENTIAL_BASE = 2
const INITIAL_RETRY_DELAY_MS = 1_000
const MAX_RETRY_DELAY_MS = 30_000
const RETRY_JITTER_PERCENT = 20
const PERCENT = 100
const STABLE_CONNECTION_MS = 30_000
const HEARTBEAT_TIMEOUT_MS = 45_000

interface ActiveOperation {
  activate(): void
  start(connection: SseConnection, connectionGeneration: number): void
  change(state: SubscriptionState): void
  fail(error: SubscriptionError): void
  pause(): void
  dispose(): void
}

export class GraphqlSubscriptions {
  private readonly operations = new Set<ActiveOperation>()
  private connection: SseConnection | undefined
  private heartbeat: SseHeartbeat | undefined
  private retryTimer: ReturnType<typeof setTimeout> | undefined
  private stableTimer: ReturnType<typeof setTimeout> | undefined
  private state: SubscriptionState = { status: 'Stopped', error: '' }
  private generation = 0
  private retryCount = 0
  private disposed = false

  public constructor(private readonly options: GraphqlSubscriptionsOptions) {}

  public subscribe<T, V extends SubscriptionVariables>(
    document: DocumentNode,
    options: SubscriptionOptions<T, V>,
  ): SubscriptionLease {
    assertSubscription(document)
    const operation = new SubscriptionOperation(
      document,
      options,
      () => this.release(operation),
      (generation, error) => this.connectionFailed(generation, error),
    )
    operation.activate()

    if (this.disposed || options.signal.aborted) {
      operation.dispose()
      return operation
    }

    if (this.operations.size === 0) this.retryCount = 0
    this.operations.add(operation)
    if (this.retryTimer !== undefined) {
      operation.change(this.state)
      return operation
    }

    try {
      if (this.connection === undefined) {
        this.state = { status: 'Connecting', error: this.state.error }
      }
      const connection = this.connection ?? this.openConnection()
      operation.change(this.state)
      operation.start(connection, this.generation)
    } catch (error) {
      operation.dispose()
      throw error
    }
    return operation
  }

  public dispose(): void {
    if (this.disposed) return
    this.disposed = true

    for (const operation of this.operations) operation.dispose()
    this.stopConnection()
  }

  private openConnection(): SseConnection {
    const generation = this.generation + 1
    this.generation = generation
    const heartbeat = new SseHeartbeat(
      this.options.fetch ?? globalThis.fetch,
      HEARTBEAT_TIMEOUT_MS,
      () => this.connectionFailed(generation, timeoutError()),
    )
    const connection = new SseConnection({
      endpoint: this.options.endpoint,
      headers: this.options.headers,
      fetch: heartbeat.fetch,
      connectTimeoutMs: this.options.connectTimeoutMs,
      onConnected: () => this.connected(generation),
      onTerminalError: (error) => this.connectionFailed(generation, error),
    })
    this.heartbeat = heartbeat
    this.connection = connection
    connection.start()
    return connection
  }

  private connected(generation: number): void {
    if (generation !== this.generation) return
    this.transition({ status: 'Live', error: '' })
    if (
      generation !== this.generation ||
      this.disposed ||
      this.connection === undefined ||
      this.operations.size === 0
    ) {
      return
    }
    clearTimeout(this.stableTimer)
    this.stableTimer = setTimeout(() => {
      if (generation === this.generation) this.retryCount = 0
    }, STABLE_CONNECTION_MS)
  }

  private connectionFailed(generation: number, error: SubscriptionError): void {
    if (generation !== this.generation) return

    if (isRetryable(error) && this.retryCount < MAX_RETRIES) {
      this.retry(error)
    } else {
      this.terminate(error)
    }
  }

  private retry(error: SubscriptionError): void {
    for (const operation of this.operations) operation.pause()
    this.detachConnection()

    if (this.operations.size === 0) return
    const retry = this.retryCount
    this.retryCount += 1
    const delay = retryDelay(retry)
    const generation = this.generation
    this.retryTimer = setTimeout(() => this.reconnect(generation), delay)
    this.transition({ status: 'Offline', error: error.message })
  }

  private reconnect(generation: number): void {
    const retryTimer = this.retryTimer
    if (
      retryTimer === undefined ||
      generation !== this.generation ||
      this.disposed ||
      this.operations.size === 0
    ) {
      return
    }

    try {
      this.transition({ status: 'Reconnecting', error: this.state.error })
      if (
        retryTimer !== this.retryTimer ||
        generation !== this.generation ||
        this.operations.size === 0
      ) {
        return
      }
      this.retryTimer = undefined
      const connection = this.openConnection()
      for (const operation of this.operations) {
        operation.start(connection, this.generation)
      }
    } catch {
      this.connectionFailed(
        this.generation,
        new SubscriptionError('network', 'Subscription reconnect failed.'),
      )
    }
  }

  private terminate(error: SubscriptionError): void {
    this.state = { status: 'Stopped', error: error.message }

    for (const operation of this.operations) {
      operation.change(this.state)
      operation.fail(error)
    }
    this.detachConnection()
  }

  private release(operation: ActiveOperation): void {
    this.operations.delete(operation)
    if (this.operations.size === 0) {
      queueMicrotask(() => {
        if (this.operations.size === 0) this.stopConnection()
      })
    }
  }

  private detachConnection(): void {
    this.generation += 1
    clearTimeout(this.retryTimer)
    clearTimeout(this.stableTimer)
    this.retryTimer = undefined
    this.stableTimer = undefined
    this.heartbeat?.dispose()
    this.heartbeat = undefined
    this.connection?.dispose()
    this.connection = undefined
  }

  private stopConnection(): void {
    this.detachConnection()
    this.state = { status: 'Stopped', error: this.state.error }
  }

  private transition(state: SubscriptionState): void {
    this.state = state
    for (const operation of this.operations) operation.change(state)
  }
}

function retryDelay(retry: number): number {
  const exponential = Math.min(
    INITIAL_RETRY_DELAY_MS * EXPONENTIAL_BASE ** retry,
    MAX_RETRY_DELAY_MS,
  )
  const jitter = randomInt(-RETRY_JITTER_PERCENT, RETRY_JITTER_PERCENT + 1)
  return Math.round((exponential * (PERCENT + jitter)) / PERCENT)
}

function isRetryable(error: SubscriptionError): boolean {
  return error.code === 'network' || error.code === 'timeout'
}

function assertSubscription(document: DocumentNode): void {
  const operation = getOperationAST(document)

  if (operation?.operation !== 'subscription') {
    throw new SubscriptionError(
      'protocol',
      'Only a single GraphQL subscription operation is allowed.',
    )
  }
}
