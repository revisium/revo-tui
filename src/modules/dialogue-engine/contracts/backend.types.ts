import type {
  DialogueInteraction,
  DialogueItem,
  DialogueSummary,
  DialogueTurn,
} from './dialogue.types.js'
import type { SnapshotPage } from './page.types.js'

export interface HistoryPage extends SnapshotPage<DialogueItem> {
  readonly observed: string | null
}

export interface DialogueReadBackend {
  list(
    after?: string,
    signal?: AbortSignal,
  ): Promise<SnapshotPage<DialogueSummary>>
  details(id: string, signal?: AbortSignal): Promise<DialogueSummary>
  history(
    id: string,
    after?: string,
    signal?: AbortSignal,
  ): Promise<HistoryPage>
  item(id: string, itemId: string, signal?: AbortSignal): Promise<DialogueItem>
  turns(
    id: string,
    after?: string,
    signal?: AbortSignal,
  ): Promise<SnapshotPage<DialogueTurn>>
  interactions(
    id: string,
    after?: string,
    signal?: AbortSignal,
  ): Promise<SnapshotPage<DialogueInteraction>>
}
