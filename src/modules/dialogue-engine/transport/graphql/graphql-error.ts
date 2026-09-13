import { DialogueError } from '../../errors/DialogueError.js'

interface ErrorResponse {
  readonly errors?: unknown
  readonly status?: unknown
}

const UNAUTHORIZED = 401
const FORBIDDEN = 403
const TOO_MANY_REQUESTS = 429
const SERVER_ERROR = 500
const CURSOR_CODES = new Set([
  'INVALID_CURSOR',
  'CURSOR_AHEAD',
  'CURSOR_UNAVAILABLE',
  'CURSOR_EXPIRED',
])
const TRANSIENT_CODES = new Set([
  'INTERNAL_SERVER_ERROR',
  'SERVICE_UNAVAILABLE',
  'TOO_MANY_REQUESTS',
])

export function dialogueRequestError(error: unknown): DialogueError {
  if (error instanceof DialogueError) return error
  if (error instanceof SyntaxError) {
    return protocolError('Dialogue service returned malformed JSON.')
  }
  const response = responseOf(error)
  const status = responseStatus(response)
  if (status === UNAUTHORIZED || status === FORBIDDEN) {
    return new DialogueError(
      'access-denied',
      'Dialogue access was denied.',
      'stop',
    )
  }
  if (status === TOO_MANY_REQUESTS) {
    return new DialogueError(
      'rate-limited',
      'The dialogue service is temporarily rate limited.',
      'retry',
    )
  }
  if (status !== undefined && status >= SERVER_ERROR) {
    return new DialogueError(
      'server',
      `The dialogue service returned status ${String(status)}.`,
      'retry',
    )
  }
  const executionCode = graphqlCode(response.errors)
  if (executionCode !== undefined) {
    return new DialogueError(
      'graphql-execution',
      'The dialogue request was rejected by GraphQL.',
      recoveryOf(executionCode),
    )
  }
  if (status !== undefined) {
    return new DialogueError(
      'protocol',
      `The dialogue service returned status ${String(status)}.`,
      'stop',
    )
  }
  return new DialogueError(
    'network',
    'The dialogue network request failed.',
    'retry',
  )
}

export function protocolError(message: string): DialogueError {
  return new DialogueError('protocol', message, 'refresh')
}

function responseOf(error: unknown): ErrorResponse {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return {}
  }
  const response = error.response
  return typeof response === 'object' && response !== null ? response : {}
}

function responseStatus(response: ErrorResponse): number | undefined {
  return typeof response.status === 'number' &&
    Number.isInteger(response.status)
    ? response.status
    : undefined
}

function graphqlCode(errors: unknown): string | undefined {
  if (!Array.isArray(errors) || errors.length === 0) return undefined
  const first: unknown = errors[0]
  if (typeof first !== 'object' || first === null || !('extensions' in first)) {
    return 'GRAPHQL_ERROR'
  }
  const extensions = first.extensions
  if (
    typeof extensions !== 'object' ||
    extensions === null ||
    !('code' in extensions)
  ) {
    return 'GRAPHQL_ERROR'
  }
  return typeof extensions.code === 'string' ? extensions.code : 'GRAPHQL_ERROR'
}

function recoveryOf(code: string): 'retry' | 'refresh' | 'stop' {
  if (CURSOR_CODES.has(code)) return 'refresh'
  return TRANSIENT_CODES.has(code) ? 'retry' : 'stop'
}
