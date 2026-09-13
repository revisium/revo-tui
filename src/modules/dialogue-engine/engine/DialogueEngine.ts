import type { DialogueBackend } from '../contracts/backend.types.js'
import type {
  DialogueLease,
  DialogueListView,
  DialogueResourceView,
} from '../contracts/public.types.js'
import { DialogueLifecycle } from '../lifecycle/DialogueLifecycle.js'
import { DialogueList } from '../resources/DialogueList.js'
import { DialogueStore } from '../state/DialogueStore.js'
import { DialogueSynchronization } from '../synchronization/DialogueSynchronization.js'
import type { DialogueCommands } from '../commands/DialogueCommands.js'
import type { DialogueSummary } from '../contracts/dialogue.types.js'

export class DialogueEngine {
  public readonly list: DialogueListView
  private readonly resources: DialogueList
  private readonly lifecycle: DialogueLifecycle

  public constructor(backend: DialogueBackend, commands: DialogueCommands) {
    const store = new DialogueStore()
    const list = new DialogueList(backend, store, commands)
    this.resources = list
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

  public confirm(summary: DialogueSummary): DialogueResourceView {
    this.resources.include(summary)
    return this.resources.resource(summary.id)
  }

  public dispose(): void {
    this.lifecycle.dispose()
  }
}
