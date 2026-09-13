import { makeAutoObservable, reaction } from 'mobx'
import type { DialogueEngine } from '../../../modules/dialogue-engine/index.js'

export class DialogueListViewModel {
  public selectedId: string | undefined
  private stopItemsReaction: (() => void) | undefined
  public constructor(private readonly engine: DialogueEngine) {
    makeAutoObservable(this, {}, { autoBind: true })
  }
  public get list() {
    return this.engine.list
  }
  public mount(): void {
    this.selectedId ??= this.list.items[0]?.id
    this.stopItemsReaction = reaction(
      () => this.list.items.map((item) => item.id),
      (ids) => {
        if (this.selectedId !== undefined && ids.includes(this.selectedId))
          return
        this.selectedId = ids[0]
      },
    )
  }
  public dispose(): void {
    this.stopItemsReaction?.()
    this.stopItemsReaction = undefined
  }
  public move(delta: number): void {
    const ids = this.list.items.map((item) => item.id)
    if (!ids.length) return
    const current = this.selectedId ?? ids[0]
    if (current === undefined) return
    const index = Math.max(0, ids.indexOf(current))
    const next = ids[Math.min(ids.length - 1, Math.max(0, index + delta))]
    if (next !== undefined) this.selectedId = next
  }
  public async refresh(): Promise<void> {
    await this.list.refresh()
  }
  public async loadMore(): Promise<void> {
    await this.list.loadMore()
  }
}
