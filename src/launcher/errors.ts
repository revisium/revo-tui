export type RevoTuiLaunchErrorCode =
  | 'invalid-api-url'
  | 'no-tty'
  | 'launch-aborted'
  | 'bun-not-found'
  | 'bun-version-mismatch'
  | 'ui-entry-missing'
  | 'terminal-capture-failed'
  | 'terminal-restore-failed'
  | 'spawn-failed'

export class RevoTuiLaunchError extends Error {
  public readonly code: RevoTuiLaunchErrorCode

  public constructor(code: RevoTuiLaunchErrorCode, message: string) {
    super(message)
    this.name = 'RevoTuiLaunchError'
    this.code = code
  }
}
