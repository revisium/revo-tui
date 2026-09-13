export type DialogueErrorCode =
  | 'access-denied'
  | 'graphql-execution'
  | 'identity-mismatch'
  | 'invalid-change'
  | 'invalid-sequence'
  | 'network'
  | 'protocol'
  | 'rate-limited'
  | 'server'
  | 'unsupported-value'

export type DialogueRecovery = 'retry' | 'refresh' | 'stop'

export class DialogueError extends Error {
  public constructor(
    public readonly code: DialogueErrorCode,
    message: string,
    public readonly recovery: DialogueRecovery,
  ) {
    super(message)
    this.name = 'DialogueError'
  }
}
