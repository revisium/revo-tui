import type {
  DialogueChange,
  DialogueInteraction,
  DialogueItem,
  DialogueSummary,
  DialogueTurn,
} from './dialogue.types.js'
import type { SnapshotPage } from './page.types.js'
import type {
  CreateDialogueInput,
  ForkDialogueInput,
  RespondDialogueInput,
  SendDialogueInput,
} from './command.types.js'
import type {
  SubscriptionLease,
  SubscriptionState,
} from '../../graphql-subscriptions/index.js'

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

export interface DialogueWatchOptions {
  readonly signal: AbortSignal
  readonly prepare: (signal: AbortSignal) => Promise<string | undefined>
  readonly receive: (
    change: DialogueChange,
    signal: AbortSignal,
  ) => void | Promise<void>
  readonly changed?: (state: SubscriptionState) => void
}

export interface DialogueBackend extends DialogueReadBackend {
  watch(
    scope: string | undefined,
    options: DialogueWatchOptions,
  ): SubscriptionLease
  create(
    input: CreateDialogueInput,
    signal?: AbortSignal,
  ): Promise<DialogueSummary>
  send(input: SendDialogueInput, signal?: AbortSignal): Promise<DialogueTurn>
  respond(
    input: RespondDialogueInput,
    signal?: AbortSignal,
  ): Promise<DialogueInteraction>
  cancel(
    dialogueId: string,
    turnId: string,
    signal?: AbortSignal,
  ): Promise<DialogueTurn>
  read(
    dialogueId: string,
    through: string,
    signal?: AbortSignal,
  ): Promise<DialogueSummary>
  reopen(dialogueId: string, signal?: AbortSignal): Promise<DialogueSummary>
  fork(input: ForkDialogueInput, signal?: AbortSignal): Promise<DialogueSummary>
}
