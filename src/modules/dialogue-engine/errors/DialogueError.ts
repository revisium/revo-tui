export type DialogueErrorCode =
  | 'access-denied'
  | 'command-conflict'
  | 'command-unavailable'
  | 'graphql-execution'
  | 'identity-mismatch'
  | 'invalid-change'
  | 'invalid-sequence'
  | 'network'
  | 'protocol'
  | 'rate-limited'
  | 'server'
  | 'storage-corrupt'
  | 'storage-locked'
  | 'storage-unavailable'
  | 'storage-write'
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
