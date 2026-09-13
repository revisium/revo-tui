import type { DialogueLease } from '../contracts/public.types.js'
import type { DialogueList } from '../resources/DialogueList.js'
import type { DialogueResource } from '../resources/DialogueResource.js'
import type { DialogueSynchronization } from '../synchronization/DialogueSynchronization.js'
import type { ChangeFeed } from '../synchronization/ChangeFeed.js'

interface DialogueOwner {
  readonly resource: DialogueResource
  readonly feed: ChangeFeed
  consumers: number
}

export class DialogueLifecycle {
  private readonly owners = new Map<string, DialogueOwner>()
  private summaryFeed: ChangeFeed | undefined
  private disposed = false

  public constructor(
    private readonly list: DialogueList,
    private readonly synchronization: DialogueSynchronization,
  ) {}

  public start(): void {
    if (this.disposed || this.summaryFeed !== undefined) return
    const feed = this.synchronization.summaryFeed()
    this.summaryFeed = feed
    feed.start()
  }

  public open(id: string): DialogueLease {
    if (this.disposed) throw new Error('Dialogue engine is disposed.')
    if (id === '') throw new Error('Dialogue identity is required.')
    let owner = this.owners.get(id)
    if (owner === undefined) {
      const resource = this.list.resource(id)
      const feed = this.synchronization.dialogueFeed(resource)
      owner = { resource, feed, consumers: 0 }
      this.owners.set(id, owner)
      feed.start()
    }
    owner.consumers += 1
    let released = false
    return Object.freeze({
      dialogue: owner.resource,
      ready: owner.feed.ready,
      release: () => {
        if (released) return
        released = true
        this.release(id, owner as DialogueOwner)
      },
    })
  }

  public dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.summaryFeed?.stop()
    this.summaryFeed = undefined
    for (const [id, owner] of this.owners) this.close(id, owner)
    this.owners.clear()
    this.list.dispose()
  }

  private release(id: string, owner: DialogueOwner): void {
    if (this.owners.get(id) !== owner || owner.consumers === 0) return
    owner.consumers -= 1
    if (owner.consumers > 0) return
    this.close(id, owner)
    this.owners.delete(id)
  }

  private close(id: string, owner: DialogueOwner): void {
    owner.feed.stop()
    this.synchronization.cancel(id)
    owner.resource.dispose()
  }
}
