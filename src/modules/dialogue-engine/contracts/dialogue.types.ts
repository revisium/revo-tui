export type JsonPrimitive = boolean | number | string | null

export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue }

export interface DialogueSummary {
  readonly id: string
  readonly title: string
  readonly agentId: string
  readonly agentVersion: string
  readonly agentInstallationId: string
  readonly agentConfiguration: JsonValue
  readonly status: string
  readonly progress: string
  readonly pendingCount: number
  readonly lastOutcome?: string | null
  readonly activeTurnId?: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly version: string
  readonly significantSequence: string
  readonly readSignificantSequence: string
  readonly unreadCount: number
  readonly contextMode: string
  readonly originDialogueId?: string | null
  readonly originTurnId?: string | null
}

export interface DialogueItem {
  readonly id: string
  readonly dialogueId: string
  readonly sequence: string
  readonly turnId?: string | null
  readonly kind: string
  readonly source: string
  readonly text: string
  readonly payload?: JsonValue
  readonly status: string
  readonly version: string
  readonly createdAt: string
  readonly historical: boolean
}

export interface DialogueChange {
  readonly cursor: string
  readonly dialogueId: string
  readonly kind: string
  readonly itemId?: string | null
  readonly itemVersion?: string | null
  readonly baseItemVersion?: string | null
  readonly textDelta?: string | null
  readonly item?: DialogueItem | null
  readonly summary?: DialogueSummary | null
}
