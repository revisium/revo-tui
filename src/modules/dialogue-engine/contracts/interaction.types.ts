import type { JsonValue } from './dialogue.types.js'

export interface DialogueOption {
  readonly value: string
  readonly label: string
}

export interface DialogueQuestion {
  readonly id: string
  readonly title: string
  readonly input: string
  readonly multiline: boolean
  readonly multiple: boolean
  readonly required: boolean
  readonly allowOther: boolean
  readonly integer: boolean
  readonly options: readonly DialogueOption[]
  readonly minLength?: number
  readonly maxLength?: number
  readonly minimum?: number
  readonly maximum?: number
}

export interface DialogueInteractionDefinition {
  readonly kind: 'permission' | 'input'
  readonly title: string
  readonly options: readonly DialogueOption[]
  readonly questions: readonly DialogueQuestion[]
}

export type DialogueInputValues = Readonly<Record<string, JsonValue>>
