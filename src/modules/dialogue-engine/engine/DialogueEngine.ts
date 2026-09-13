import type { DialogueBackend } from '../contracts/backend.types.js'
import type {
  DialogueLease,
  DialogueListView,
} from '../contracts/public.types.js'
import { DialogueLifecycle } from '../lifecycle/DialogueLifecycle.js'
import { DialogueList } from '../resources/DialogueList.js'
import { DialogueStore } from '../state/DialogueStore.js'
import { DialogueSynchronization } from '../synchronization/DialogueSynchronization.js'

export class DialogueEngine {
  public readonly list: DialogueListView
  private readonly lifecycle: DialogueLifecycle

  public constructor(backend: DialogueBackend) {
    const store = new DialogueStore()
    const list = new DialogueList(backend, store)
    const synchronization = new DialogueSynchronization(backend, store, list)
    this.list = list
    this.lifecycle = new DialogueLifecycle(list, synchronization)
  }

  public start(): void {
    this.lifecycle.start()
  }

  public open(id: string): DialogueLease {
    return this.lifecycle.open(id)
  }

  public dispose(): void {
    this.lifecycle.dispose()
  }
}
