import { createClient, type Client, type ExecutionResult } from 'graphql-sse'
import {
  connectionError,
  executionError,
  SubscriptionError,
  subscriptionErrorOf,
  timeoutError,
} from './SubscriptionError.js'
import type {
  SseConnectionOptions,
  SubscriptionOperation,
  SubscriptionSink,
  SubscriptionVariables,
} from './subscription.types.js'

const DEFAULT_CONNECT_TIMEOUT_MS = 45_000
const MAX_CONNECT_TIMEOUT_MS = 120_000
const CLEANUP_TIMEOUT_MS = 5_000
const ACCEPTED = 202

interface OwnedOperation {
  readonly sink: SubscriptionSink<unknown>
  libraryDispose: (() => void) | undefined
  closed: boolean
  cancelled: boolean
  notified: boolean
}

export class SseConnection {
  readonly #endpoint: string
  readonly #headers: Readonly<Record<string, string>>
  readonly #fetch: typeof fetch
  readonly #onConnected: () => void
  readonly #onTerminalError: (error: SubscriptionError) => void
  readonly #connectTimeoutMs: number
  readonly #controller = new AbortController()
  readonly #operations = new Set<OwnedOperation>()
  #client: Client<true> | undefined
  #connectTimer: ReturnType<typeof setTimeout> | undefined
  #terminalError: SubscriptionError | undefined
  #disposed = false

  public constructor(options: SseConnectionOptions) {
    this.#endpoint = validateEndpoint(options.endpoint)
    this.#headers = Object.freeze(
      Object.fromEntries(new Headers(options.headers).entries()),
    )
    this.#fetch = options.fetch ?? globalThis.fetch
    this.#onConnected = options.onConnected ?? (() => undefined)
    this.#onTerminalError = options.onTerminalError ?? (() => undefined)
    this.#connectTimeoutMs = connectTimeoutOf(options.connectTimeoutMs)
  }

  public start(): void {
    this.assertUsable()

    if (this.#client !== undefined) {
      return
    }

    this.#connectTimer = setTimeout(
      () => this.terminate(timeoutError()),
      this.#connectTimeoutMs,
    )
    this.#client = createClient({
      url: this.#endpoint,
      headers: { ...this.#headers },
      fetchFn: this.fetch,
      singleConnection: true,
      lazy: false,
      retryAttempts: 0,
      onNonLazyError: (error) => this.terminate(connectionError(error)),
      on: { connected: this.connected },
    })
  }

  public subscribe<T>(
    query: string,
    variables: SubscriptionVariables | undefined,
    sink: SubscriptionSink<T>,
  ): SubscriptionOperation {
    this.assertStarted()
    const operation: OwnedOperation = {
      sink: sink as SubscriptionSink<unknown>,
      libraryDispose: undefined,
      closed: false,
      cancelled: false,
      notified: false,
    }
    this.#operations.add(operation)
    operation.libraryDispose = this.#client?.subscribe<T>(
      { query, variables },
      {
        next: (result) => this.next(operation, result),
        error: (error) => this.operationError(operation, error),
        complete: () => this.complete(operation),
      },
    )

    return { dispose: () => this.cancel(operation) }
  }

  public dispose(): void {
    if (this.#disposed) {
      return
    }

    this.#disposed = true
    this.clearConnectTimer()
    this.#controller.abort()

    for (const operation of [...this.#operations]) {
      this.cancel(operation)
    }

    this.#client?.dispose()
    this.#client = undefined
  }

  private readonly connected = (): void => {
    if (this.#disposed || this.#terminalError !== undefined) {
      return
    }

    this.clearConnectTimer()
    try {
      this.#onConnected()
    } catch {
      this.terminate(
        new SubscriptionError(
          'protocol',
          'The subscription connection callback failed.',
        ),
      )
    }
  }

  private readonly fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const signal = AbortSignal.any(
      init?.signal == null
        ? [this.#controller.signal]
        : [this.#controller.signal, init.signal],
    )
    signal.throwIfAborted()

    try {
      const response = await this.#fetch(input, { ...init, signal })

      if (init?.method === 'POST' && response.status !== ACCEPTED) {
        const preservedResponse = await preserveResponse(response)
        await this.cleanupOperation(input, init)
        return preservedResponse
      }

      return response
    } catch (error) {
      await this.cleanupOperation(input, init)
      throw error
    }
  }

  private next<T>(
    operation: OwnedOperation,
    result: ExecutionResult<T, unknown>,
  ): void {
    if (!this.isActive(operation)) {
      return
    }

    if (result.errors !== undefined && result.errors.length > 0) {
      this.operationError(operation, executionError(result.errors))
      return
    }

    if (result.data === undefined) {
      this.operationError(operation, connectionError(undefined))
      return
    }

    try {
      operation.sink.next(result.data)
    } catch {
      this.operationError(
        operation,
        new SubscriptionError(
          'protocol',
          'The subscription consumer could not process an event.',
        ),
      )
    }
  }

  private operationError(operation: OwnedOperation, error: unknown): void {
    if (!this.isActive(operation)) {
      return
    }

    this.release(operation)
    operation.libraryDispose?.()
    this.deliverOperationError(operation, error)
  }

  private async deliverOperationError(
    operation: OwnedOperation,
    error: unknown,
  ): Promise<void> {
    const typedError =
      error instanceof SubscriptionError
        ? error
        : await subscriptionErrorOf(error)

    if (!this.#disposed && !operation.cancelled && !operation.notified) {
      operation.notified = true
      this.invokeSafely(() => operation.sink.error(typedError))
    }
  }

  private complete(operation: OwnedOperation): void {
    if (!this.isActive(operation)) {
      return
    }

    this.release(operation)
    operation.notified = true
    this.invokeSafely(operation.sink.complete)
  }

  private cancel(operation: OwnedOperation): void {
    if (operation.cancelled || operation.notified) {
      return
    }

    operation.cancelled = true
    if (!operation.closed) {
      this.release(operation)
      operation.libraryDispose?.()
    }
    operation.notified = true
    this.invokeSafely(operation.sink.complete)
  }

  private release(operation: OwnedOperation): void {
    operation.closed = true
    this.#operations.delete(operation)
  }

  private isActive(operation: OwnedOperation): boolean {
    return !operation.closed
  }

  private terminate(error: SubscriptionError): void {
    if (this.#disposed || this.#terminalError !== undefined) {
      return
    }

    this.#terminalError = error
    this.clearConnectTimer()
    this.#controller.abort()

    for (const operation of [...this.#operations]) {
      this.operationError(operation, error)
    }

    this.#client?.dispose()
    this.invokeSafely(() => this.#onTerminalError(error))
  }

  private async cleanupOperation(
    input: RequestInfo | URL,
    init: RequestInit | undefined,
  ): Promise<void> {
    const operationId = operationIdOf(init)

    if (operationId === undefined || this.#disposed) {
      return
    }

    const cleanupController = new AbortController()
    const timeout = setTimeout(
      () => cleanupController.abort(),
      CLEANUP_TIMEOUT_MS,
    )
    const url = requestUrl(input)
    url.searchParams.set('operationId', operationId)

    try {
      await this.#fetch(url, {
        method: 'DELETE',
        headers: init?.headers,
        signal: AbortSignal.any([
          this.#controller.signal,
          cleanupController.signal,
        ]),
      })
    } catch {
      // Cleanup must not replace the operation's original failure.
    } finally {
      clearTimeout(timeout)
    }
  }

  private clearConnectTimer(): void {
    clearTimeout(this.#connectTimer)
    this.#connectTimer = undefined
  }

  private invokeSafely(callback: () => void): void {
    try {
      callback()
    } catch {
      // Consumer callbacks cannot interrupt transport resource cleanup.
    }
  }

  private assertUsable(): void {
    if (this.#disposed || this.#terminalError !== undefined) {
      throw new SubscriptionError(
        'protocol',
        'The subscription connection is no longer available.',
      )
    }
  }

  private assertStarted(): void {
    this.assertUsable()

    if (this.#client === undefined) {
      throw new SubscriptionError(
        'protocol',
        'The subscription connection has not been started.',
      )
    }
  }
}

function validateEndpoint(endpoint: string): string {
  let url: URL

  try {
    url = new URL(endpoint)
  } catch {
    throw invalidEndpoint()
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw invalidEndpoint()
  }

  return url.toString()
}

function invalidEndpoint(): TypeError {
  return new TypeError(
    'Subscription endpoint must be an absolute HTTP or HTTPS URL.',
  )
}

function connectTimeoutOf(timeout: number | undefined): number {
  const value = timeout ?? DEFAULT_CONNECT_TIMEOUT_MS

  if (!Number.isInteger(value) || value < 1 || value > MAX_CONNECT_TIMEOUT_MS) {
    throw new TypeError(
      `connectTimeoutMs must be an integer between 1 and ${String(MAX_CONNECT_TIMEOUT_MS)}.`,
    )
  }

  return value
}

async function preserveResponse(response: Response): Promise<Response> {
  return new Response(await response.arrayBuffer(), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

function operationIdOf(init: RequestInit | undefined): string | undefined {
  if (init?.method !== 'POST' || typeof init.body !== 'string') {
    return undefined
  }

  try {
    const body: unknown = JSON.parse(init.body)

    if (typeof body !== 'object' || body === null || !('extensions' in body)) {
      return undefined
    }

    const extensions = body.extensions

    if (
      typeof extensions !== 'object' ||
      extensions === null ||
      !('operationId' in extensions)
    ) {
      return undefined
    }

    return typeof extensions.operationId === 'string'
      ? extensions.operationId
      : undefined
  } catch {
    return undefined
  }
}

function requestUrl(input: RequestInfo | URL): URL {
  return new URL(input instanceof Request ? input.url : input.toString())
}
