import { makeAutoObservable } from 'mobx'
import { ObservableRequest } from '../../../modules/observable-request/index.js'
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
  public readonly readyRequest = ObservableRequest.of<void, []>(async () => {
    await this.lease?.ready
  })
  private lease: DialogueLease | undefined
  private controller: AbortController | undefined
  private generation = 0
  private sendBusy = false
  private cancelBusy = false
  public constructor(
    private readonly engine: DialogueEngine,
    private readonly actions: DialogueActions,
    private readonly commands: DialogueCommands,
    public readonly id: string,
    private readonly onBack: () => void,
  ) {
    makeAutoObservable(this, { readyRequest: false }, { autoBind: true })
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
    return this.sendBusy || this.cancelBusy
  }
  public mount(): void {
    if (this.lease) return
    this.controller = new AbortController()
    this.lease = this.engine.open(this.id)
    this.readyRequest.fetch().catch(() => undefined)
  }
  public dispose(): void {
    this.generation += 1
    this.controller?.abort()
    this.controller = undefined
    this.lease?.release()
    this.lease = undefined
  }
  public setDraft(value: string): void {
    this.draft = value
  }
  public back(): void {
    this.onBack()
  }
  public async send(): Promise<void> {
    const text = this.draft.trim()
    if (text === '' || this.busy || this.pending) return
    const generation = this.generation
    this.sendBusy = true
    try {
      await this.commands.send(this.id, text, this.controller?.signal)
      if (generation === this.generation) this.draft = ''
    } finally {
      this.sendBusy = false
    }
  }
  public async retry(): Promise<void> {
    const command = this.pending
    if (!command || this.busy) return
    this.sendBusy = true
    try {
      await this.commands.retrySend(command.commandId, this.controller?.signal)
    } finally {
      this.sendBusy = false
    }
  }
  public async cancel(): Promise<void> {
    const turnId = this.dialogue?.snapshot?.summary.activeTurnId
    if (!turnId || this.busy) return
    this.cancelBusy = true
    try {
      await this.actions.cancel(this.id, turnId, this.controller?.signal)
    } finally {
      this.cancelBusy = false
    }
  }
  public async older(): Promise<void> {
    await this.dialogue?.history.loadMore()
  }
}
