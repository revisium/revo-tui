import { NetworkError } from 'graphql-sse'

export type SubscriptionErrorCode =
  | 'network'
  | 'access-denied'
  | 'protocol'
  | 'graphql-execution'
  | 'timeout'

const UNAUTHORIZED = 401
const FORBIDDEN = 403

export class SubscriptionError extends Error {
  public constructor(
    public readonly code: SubscriptionErrorCode,
    message: string,
    public readonly graphqlMessages: readonly string[] = [],
  ) {
    super(message)
    this.name = 'SubscriptionError'
  }
}

export function connectionError(error: unknown): SubscriptionError {
  if (error instanceof SubscriptionError) {
    return error
  }

  if (error instanceof NetworkError) {
    const status = responseStatus(error.response)

    if (status === UNAUTHORIZED || status === FORBIDDEN) {
      return new SubscriptionError(
        'access-denied',
        'Subscription access was denied.',
      )
    }

    return new SubscriptionError(
      'network',
      status === undefined
        ? 'The subscription network request failed.'
        : `The subscription server returned status ${String(status)}.`,
    )
  }

  return new SubscriptionError(
    'protocol',
    'The subscription stream returned an invalid response.',
  )
}

export function executionError(errors: unknown): SubscriptionError {
  const messages = graphqlMessages(errors)
  return new SubscriptionError(
    'graphql-execution',
    messages.length === 0
      ? 'The subscription operation failed.'
      : messages.join('; '),
    messages,
  )
}

export async function subscriptionErrorOf(
  error: unknown,
): Promise<SubscriptionError> {
  if (error instanceof NetworkError && error.response instanceof Response) {
    const status = responseStatus(error.response)

    if (status === UNAUTHORIZED || status === FORBIDDEN) {
      return connectionError(error)
    }

    try {
      const body: unknown = await error.response.json()

      if (typeof body === 'object' && body !== null && 'errors' in body) {
        const typedError = executionError(body.errors)

        if (typedError.graphqlMessages.length > 0) {
          return typedError
        }
      }
    } catch {
      // A non-JSON error response is classified by its safe HTTP status.
    }
  }

  return connectionError(error)
}

export function timeoutError(): SubscriptionError {
  return new SubscriptionError(
    'timeout',
    'The subscription connection timed out.',
  )
}

function responseStatus(response: unknown): number | undefined {
  if (
    typeof response !== 'object' ||
    response === null ||
    !('status' in response)
  ) {
    return undefined
  }

  return typeof response.status === 'number' ? response.status : undefined
}

function graphqlMessages(errors: unknown): string[] {
  if (!Array.isArray(errors)) {
    return []
  }

  return errors.flatMap((error) => {
    if (typeof error !== 'object' || error === null || !('message' in error)) {
      return []
    }

    const message = error.message
    return typeof message === 'string' && message.trim() !== ''
      ? [message.trim()]
      : []
  })
}
