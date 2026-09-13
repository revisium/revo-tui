import { makeAutoObservable } from 'mobx'
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

export class DialogueViewModel {
  public draft = ''
  public focus: 'prompt' | 'controls' = 'prompt'
  private readonly readyRequest: ObservableRequest<
    void,
    [DialogueLease, number]
  >
  private readonly sendRequest: ObservableRequest<void, [SendAttempt, number]>
  private readonly cancelRequest: ObservableRequest<void, [string, number]>
  private lease: DialogueLease | undefined
  private generation = 0
  private active = false
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
    makeAutoObservable<this, 'cancelRequest' | 'readyRequest' | 'sendRequest'>(
      this,
      { cancelRequest: false, readyRequest: false, sendRequest: false },
      { autoBind: true },
    )
  }
  public get dialogue() {
    return this.lease?.dialogue
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
    this.readyRequest.fetch(lease, generation).catch(() => undefined)
  }
  public dispose(): void {
    if (!this.active) return
    this.active = false
    this.generation += 1
    this.readyRequest.abort()
    this.sendRequest.abort()
    this.cancelRequest.abort()
    this.lease?.release()
    this.lease = undefined
  }
  public setDraft(value: string): void {
    this.draft = value
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

  private assertCurrent(generation: number, signal: AbortSignal): void {
    if (!this.isCurrent(generation) || signal.aborted) {
      throw new RequestAbortError()
    }
  }
}

type SendAttempt =
  | { readonly kind: 'send'; readonly prompt: string }
  | { readonly kind: 'retry'; readonly commandId: string }
