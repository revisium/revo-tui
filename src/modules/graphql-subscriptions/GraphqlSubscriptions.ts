import { getOperationAST, type DocumentNode } from 'graphql'
import { SubscriptionOperation } from './SubscriptionOperation.js'
import { SseConnection } from './SseConnection.js'
import { SubscriptionError } from './SubscriptionError.js'
import type {
  GraphqlSubscriptionsOptions,
  SubscriptionLease,
  SubscriptionOptions,
  SubscriptionState,
  SubscriptionVariables,
} from './subscription.types.js'

interface ActiveOperation {
  activate(): void
  start(connection: SseConnection): void
  change(state: SubscriptionState): void
  fail(error: SubscriptionError): void
  dispose(): void
}

export class GraphqlSubscriptions {
  private readonly operations = new Set<ActiveOperation>()
  private connection: SseConnection | undefined
  private state: SubscriptionState = { status: 'Stopped', error: '' }
  private generation = 0
  private disposed = false

  public constructor(private readonly options: GraphqlSubscriptionsOptions) {}

  public subscribe<T, V extends SubscriptionVariables>(
    document: DocumentNode,
    options: SubscriptionOptions<T, V>,
  ): SubscriptionLease {
    assertSubscription(document)
    const operation = new SubscriptionOperation(document, options, () =>
      this.release(operation),
    )
    operation.activate()

    if (this.disposed || options.signal.aborted) {
      operation.dispose()
      return operation
    }

    this.operations.add(operation)
    try {
      const connection = this.connection ?? this.openConnection()
      operation.change(this.state)
      operation.start(connection)
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
    this.closeConnection()
  }

  private openConnection(): SseConnection {
    const generation = this.generation + 1
    this.generation = generation
    this.state = { status: 'Connecting', error: '' }
    const connection = new SseConnection({
      endpoint: this.options.endpoint,
      headers: this.options.headers,
      fetch: this.options.fetch,
      connectTimeoutMs: this.options.connectTimeoutMs,
      onConnected: () => this.connected(generation),
      onTerminalError: (error) => this.failed(generation, error),
    })
    this.connection = connection
    connection.start()
    return connection
  }

  private connected(generation: number): void {
    if (generation === this.generation) {
      this.change({ status: 'Live', error: '' })
    }
  }

  private failed(generation: number, error: SubscriptionError): void {
    if (generation !== this.generation) return
    this.state = { status: 'Stopped', error: error.message }

    for (const operation of this.operations) {
      operation.change(this.state)
      operation.fail(error)
    }
    this.closeConnection()
  }

  private release(operation: ActiveOperation): void {
    this.operations.delete(operation)
    if (this.operations.size === 0) {
      const generation = this.generation
      queueMicrotask(() => {
        if (this.operations.size === 0 && generation === this.generation) {
          this.closeConnection()
        }
      })
    }
  }

  private closeConnection(): void {
    this.generation += 1
    this.connection?.dispose()
    this.connection = undefined
    this.state = { status: 'Stopped', error: this.state.error }
  }

  private change(state: SubscriptionState): void {
    this.state = state
    for (const operation of this.operations) operation.change(state)
  }
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
