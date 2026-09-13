import type { JsonValue } from './dialogue.types.js'

export interface PendingDialogueMessage {
  readonly kind: 'message'
  readonly commandId: string
  readonly dialogueId: string
  readonly prompt: string
}

export interface PendingDialogueResponse {
  readonly kind: 'response'
  readonly commandId: string
  readonly dialogueId: string
  readonly interactionId: string
  readonly response: JsonValue
}

export type PendingDialogueCommand =
  | PendingDialogueMessage
  | PendingDialogueResponse

export interface DialogueCommandStorage {
  open(): Promise<void>
  load(): Promise<readonly PendingDialogueCommand[]>
  save(command: PendingDialogueCommand): Promise<void>
  remove(command: PendingDialogueCommand): Promise<void>
  close(): Promise<void>
}
