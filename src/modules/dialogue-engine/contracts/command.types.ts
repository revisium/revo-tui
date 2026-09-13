import type { JsonValue } from './dialogue.types.js'

export interface CreateDialogueInput {
  readonly title: string
  readonly agentId: string
  readonly agentVersion: string
  readonly agentInstallationId: string
  readonly agentConfiguration?: JsonValue
  readonly metadata?: JsonValue
  readonly systemContext?: string
}

export interface SendDialogueInput {
  readonly commandId: string
  readonly dialogueId: string
  readonly prompt: string
}

export interface RespondDialogueInput {
  readonly commandId: string
  readonly dialogueId: string
  readonly interactionId: string
  readonly response: JsonValue
}

export interface ForkDialogueInput {
  readonly dialogueId: string
  readonly turnId: string
  readonly title: string
}
