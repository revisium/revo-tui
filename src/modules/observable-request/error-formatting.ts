interface GraphqlErrorShape {
  readonly response?: unknown
  readonly request?: unknown
}

interface GraphqlResponseShape {
  readonly errors?: unknown
  readonly status?: unknown
}

const DEFAULT_REQUEST_ERROR = 'Request failed.'

export function errorMessageOf(
  error: unknown,
  fallback = DEFAULT_REQUEST_ERROR,
): string {
  if (!isGraphqlError(error)) {
    return fallback
  }

  const response = asGraphqlResponse(error.response)
  const domainMessage = firstGraphqlMessage(response.errors)

  if (domainMessage !== undefined) {
    return domainMessage
  }

  return Number.isInteger(response.status) && Number(response.status) >= 0
    ? `GraphQL request failed (status ${String(response.status)}).`
    : fallback
}

function isGraphqlError(error: unknown): error is GraphqlErrorShape {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    'request' in error
  )
}

function asGraphqlResponse(response: unknown): GraphqlResponseShape {
  return typeof response === 'object' && response !== null ? response : {}
}

function firstGraphqlMessage(errors: unknown): string | undefined {
  if (!Array.isArray(errors)) {
    return undefined
  }

  for (const error of errors) {
    if (typeof error !== 'object' || error === null || !('message' in error)) {
      continue
    }

    const message = error.message

    if (typeof message === 'string' && message.trim() !== '') {
      return message.trim()
    }
  }

  return undefined
}
