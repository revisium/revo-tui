import { makeAutoObservable } from 'mobx'
import type {
  DialogueInteractionSessionView,
  DialogueResourceView,
} from '../../../modules/dialogue-engine/index.js'
export class InteractionViewModel {
  public selected = 0
  public question = 0
  public readonly values = new Map<string, string | boolean>()
  public constructor(
    private readonly resource: DialogueResourceView,
    public readonly id: string,
  ) {
    makeAutoObservable(this, {}, { autoBind: true })
  }
  public get session(): DialogueInteractionSessionView {
    return this.resource.interaction(this.id)
  }
  public get definition() {
    return this.session.definition
  }
  public get options() {
    return this.definition?.options ?? []
  }
  public chooseNext(delta: number): void {
    this.selected = Math.min(
      this.options.length - 1,
      Math.max(0, this.selected + delta),
    )
  }
  public choose(): void {
    const option = this.options[this.selected]
    if (option) this.session.choose(option.value).catch(() => undefined)
  }
  public toggle(): void {
    const option = this.options[this.selected]
    if (!option) return
    this.values.set(option.value, !this.values.get(option.value))
  }
  public submit(): void {
    this.session.submit(Object.fromEntries(this.values)).catch(() => undefined)
  }
  public decline(): void {
    this.session.decline().catch(() => undefined)
  }
  public retry(): void {
    this.session.retry().catch(() => undefined)
  }
}
