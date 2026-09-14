import { makeAutoObservable, reaction, type IReactionDisposer } from 'mobx'
import {
  ObservableRequest,
  RequestAbortError,
  errorMessageOf,
} from '../../../modules/observable-request/index.js'
import type {
  DialogueActions,
  DialogueCommands,
  DialogueEngine,
  DialogueLease,
  PendingDialogueMessage,
} from '../../../modules/dialogue-engine/index.js'
import { InteractionViewModel } from '../../../features/respond-interaction/index.js'

export class DialogueViewModel {
  public draft = ''
  public focus: 'prompt' | 'controls' | 'interaction' = 'prompt'
  private readonly readyRequest: ObservableRequest<
    void,
    [DialogueLease, number]
  >
  private readonly sendRequest: ObservableRequest<void, [SendAttempt, number]>
  private readonly cancelRequest: ObservableRequest<void, [string, number]>
  private historyScroll: HistoryScroll | undefined
  private readonly interactions = new Map<string, InteractionViewModel>()
  private interactionDisposer: IReactionDisposer | undefined
  private lease: DialogueLease | undefined
  private generation = 0
  private active = false
  public interaction: InteractionViewModel | undefined
  public constructor(
    private readonly engine: DialogueEngine,
    private readonly actions: DialogueActions,
    private readonly commands: DialogueCommands,
    public readonly id: string,
    private readonly onBack: () => void,
  ) {
    this.readyRequest = ObservableRequest.of(
      async ({ signal }, lease, generation) => {
        await lease.ready
        this.assertCurrent(generation, signal)
      },
    )
    this.sendRequest = ObservableRequest.of(
      async ({ signal }, attempt, generation) => {
        if (attempt.kind === 'retry') {
          await this.commands.retrySend(attempt.commandId, signal)
        } else {
          await this.commands.send(this.id, attempt.prompt, signal)
        }
        this.assertCurrent(generation, signal)
      },
    )
    this.cancelRequest = ObservableRequest.of(
      async ({ signal }, turnId, generation) => {
        await this.actions.cancel(this.id, turnId, signal)
        this.assertCurrent(generation, signal)
      },
    )
    makeAutoObservable<
      this,
      | 'cancelRequest'
      | 'readyRequest'
      | 'sendRequest'
      | 'historyScroll'
      | 'interactionDisposer'
      | 'interactions'
    >(
      this,
      {
        cancelRequest: false,
        readyRequest: false,
        sendRequest: false,
        historyScroll: false,
        interactionDisposer: false,
        interactions: false,
      },
      { autoBind: true },
    )
  }
  public get dialogue() {
    return this.lease?.dialogue
  }
  public get interactionIds(): readonly string[] {
    const ids = [
      ...(this.dialogue?.interactions
        .filter(({ status }) => status === 'PENDING' || status === 'RESPONDING')
        .map(({ id }) => id) ?? []),
    ]
    for (const command of this.commands.pending)
      if (
        command.kind === 'response' &&
        command.dialogueId === this.id &&
        !ids.includes(command.interactionId)
      )
        ids.push(command.interactionId)
    return ids
  }
  public selectInteraction(delta: number): void {
    const ids = this.interactionIds
    if (!ids.length) return
    const current = this.interaction?.id ?? ids[0]
    if (current === undefined) return
    const index = Math.max(0, ids.indexOf(current))
    const id = ids[Math.min(ids.length - 1, Math.max(0, index + delta))]
    if (id) this.selectInteractionId(id)
  }
  public get pending(): PendingDialogueMessage | undefined {
    return this.commands.pending.find(
      (command): command is PendingDialogueMessage =>
        command.kind === 'message' && command.dialogueId === this.id,
    )
  }
  public get busy() {
    return this.sendRequest.isLoading || this.cancelRequest.isLoading
  }
  public get loading(): boolean {
    return this.readyRequest.isLoading
  }
  public get ready(): boolean {
    return (
      this.active &&
      this.readyRequest.isLoaded &&
      this.readyRequest.error === null
    )
  }
  public get error(): string {
    if (this.cancelRequest.error !== null) {
      return errorMessageOf(this.cancelRequest.error, 'Cancellation failed.')
    }
    if (this.sendRequest.error !== null) {
      return errorMessageOf(this.sendRequest.error, 'Message delivery failed.')
    }
    return this.readyRequest.error === null
      ? ''
      : errorMessageOf(this.readyRequest.error, 'Dialogue could not be loaded.')
  }
  public mount(): void {
    if (this.active) return
    this.active = true
    const generation = this.generation + 1
    this.generation = generation
    const lease = this.engine.open(this.id)
    this.lease = lease
    this.interactionDisposer = reaction(
      () => this.interactionIds,
      this.reconcileInteractions,
      { fireImmediately: true },
    )
    this.readyRequest.fetch(lease, generation).catch(() => undefined)
  }
  public dispose(): void {
    if (!this.active) return
    this.active = false
    this.generation += 1
    this.readyRequest.abort()
    this.sendRequest.abort()
    this.cancelRequest.abort()
    this.interactionDisposer?.()
    this.interactionDisposer = undefined
    for (const interaction of this.interactions.values()) interaction.dispose()
    this.interactions.clear()
    this.interaction = undefined
    this.lease?.release()
    this.lease = undefined
    this.historyScroll = undefined
  }
  public setDraft(value: string): void {
    this.draft = value
  }
  public bindHistoryScroll(scroll: HistoryScroll | null): void {
    this.historyScroll = scroll ?? undefined
  }
  public pageUp(): void {
    this.historyScroll?.scrollBy(-1, 'viewport')
  }
  public pageDown(): void {
    this.historyScroll?.scrollBy(1, 'viewport')
  }
  public end(): void {
    if (this.historyScroll) {
      this.historyScroll.stickyScroll = true
      this.historyScroll.scrollTo(this.historyScroll.scrollHeight)
    }
  }
  public back(): void {
    if (!this.active) return
    this.dispose()
    this.onBack()
  }
  public async send(): Promise<void> {
    const prompt = this.draft
    if (!this.active || prompt.trim() === '' || this.busy || this.pending)
      return
    const generation = this.generation
    const result = await this.sendRequest.fetch(
      { kind: 'send', prompt },
      generation,
    )
    if (!result.isRight || !this.isCurrent(generation)) return
    if (this.draft === prompt) this.draft = ''
  }
  public async retry(): Promise<void> {
    const command = this.pending
    if (!this.active || !command || this.busy) return
    const generation = this.generation
    await this.sendRequest.fetch(
      { kind: 'retry', commandId: command.commandId },
      generation,
    )
  }
  public async cancel(): Promise<void> {
    const turnId = this.dialogue?.snapshot?.summary.activeTurnId
    if (!this.active || !turnId || this.busy) return
    const generation = this.generation
    await this.cancelRequest.fetch(turnId, generation)
  }
  public async older(): Promise<void> {
    await this.dialogue?.history.loadMore()
  }

  private isCurrent(generation: number): boolean {
    return this.active && generation === this.generation
  }

  private reconcileInteractions(ids: readonly string[]): void {
    const dialogue = this.dialogue
    if (!this.active || dialogue === undefined) return
    const currentId = this.interaction?.id
    const keep = new Set(ids)
    for (const [id, interaction] of this.interactions)
      if (!keep.has(id)) {
        interaction.dispose()
        this.interactions.delete(id)
      }
    const selectedId =
      currentId !== undefined && keep.has(currentId) ? currentId : ids[0]
    if (selectedId === undefined) this.interaction = undefined
    else this.selectInteractionId(selectedId)
  }

  private selectInteractionId(id: string): void {
    if (this.interaction?.id === id) return
    if (this.interaction !== undefined) {
      this.interaction.dispose()
    }
    const dialogue = this.dialogue
    if (dialogue === undefined) {
      this.interaction = undefined
      return
    }
    const interaction =
      this.interactions.get(id) ?? new InteractionViewModel(dialogue, id)
    interaction.mount()
    this.interactions.set(id, interaction)
    this.interaction = interaction
  }

  private assertCurrent(generation: number, signal: AbortSignal): void {
    if (!this.isCurrent(generation) || signal.aborted) {
      throw new RequestAbortError()
    }
  }
}

type SendAttempt =
  | { readonly kind: 'send'; readonly prompt: string }
  | { readonly kind: 'retry'; readonly commandId: string }

export interface HistoryScroll {
  stickyScroll: boolean
  readonly scrollHeight: number
  scrollBy(delta: number, unit: 'viewport'): void
  scrollTo(position: number): void
}
