export type DialogueErrorCode =
  | 'identity-mismatch'
  | 'invalid-change'
  | 'invalid-sequence'
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
