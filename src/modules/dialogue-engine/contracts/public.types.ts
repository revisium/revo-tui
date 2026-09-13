import type { JsonValue } from './dialogue.types.js'

export interface DialogueItemView {
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

export interface DialogueSummaryView {
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

export interface DialogueView {
  readonly summary: DialogueSummaryView
  readonly items: readonly DialogueItemView[]
}

export interface DialogueHistoryResourceView {
  readonly items: readonly DialogueItemView[]
  readonly hasMore: boolean
  readonly loading: boolean
  readonly error: string
  readonly observed: string | null
  readonly ready: boolean
  refresh(): Promise<void>
  loadMore(): Promise<void>
}

export interface DialogueResourceView {
  readonly id: string
  readonly snapshot: DialogueView | undefined
  readonly ready: boolean
  readonly loading: boolean
  readonly error: string
  readonly history: DialogueHistoryResourceView
  start(): Promise<void>
  refresh(): Promise<void>
}

export interface DialogueListView {
  readonly items: readonly DialogueResourceView[]
  readonly hasMore: boolean
  readonly loading: boolean
  readonly error: string
  refresh(): Promise<void>
  loadMore(): Promise<void>
}

export type ProjectionResult =
  | {
      readonly status: 'applied' | 'ignored'
      readonly dialogueId: string
      readonly itemId?: string
    }
  | {
      readonly status: 'repair-required'
      readonly dialogueId: string
      readonly itemId: string
    }
