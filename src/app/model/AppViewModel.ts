import { makeAutoObservable } from 'mobx'
import type {
  DialogueActions,
  DialogueCommands,
  DialogueEngine,
} from '../../modules/dialogue-engine/index.js'
import type { AgentConfigurationsService } from '../../modules/agent-configurations/index.js'
import { ComposeViewModel } from '../../pages/compose/index.js'
import { DialogueListViewModel } from '../../pages/dialogues/index.js'

export interface AppViewModelOptions {
  readonly apiUrl: string
  readonly clientName: string
  readonly dataDir: string
}

export interface AppViewModelDependencies {
  readonly engine: DialogueEngine
  readonly actions: DialogueActions
  readonly commands: DialogueCommands
  readonly agentConfigurations: AgentConfigurationsService
}

export class AppViewModel {
  public helpVisible = false
  public mounted = false
  public route: 'list' | 'compose' = 'list'
  public readonly dialogues: DialogueListViewModel
  public compose: ComposeViewModel
  readonly #dependencies: AppViewModelDependencies

  readonly #options: AppViewModelOptions
  readonly #requestExit: () => void

  public constructor(
    options: AppViewModelOptions & AppViewModelDependencies,
    requestExit: () => void,
  ) {
    this.#options = options
    this.#dependencies = options
    this.#requestExit = requestExit
    const engine = options.engine
    this.dialogues = new DialogueListViewModel(engine)
    this.compose = this.createCompose()
    makeAutoObservable(this)
  }

  public get clientName(): string {
    return this.#options.clientName
  }

  public get connectionStatus(): string {
    return this.mounted
      ? 'Ready — dialogue services are initialized.'
      : 'Starting terminal client…'
  }

  public get endpointLabel(): string {
    const endpoint = new URL(this.#options.apiUrl)
    endpoint.username = ''
    endpoint.password = ''
    endpoint.search = ''
    endpoint.hash = ''
    return endpoint.toString()
  }

  public get keyboardHints(): readonly string[] {
    return ['? / h  Hide help', 'q / Escape  Quit']
  }

  public mount(): void {
    this.mounted = true
    this.dialogues.mount()
  }

  public dispose(): void {
    this.compose.dispose()
    this.dialogues.dispose()
    this.mounted = false
  }

  public handleKey(name: string, ctrl: boolean): void {
    if (name === 'q' || (ctrl && name === 'c')) {
      this.#requestExit()
      return
    }
    if (this.route === 'compose' && this.handleComposeKey(name)) return
    if (this.route === 'list' && this.handleListKey(name)) return
    if (name === '?' || name === 'h') {
      this.helpVisible = !this.helpVisible
      return
    }

    if (name === 'escape') {
      this.#requestExit()
    }
  }

  private handleComposeKey(name: string): boolean {
    if (name === 'escape') {
      if (!this.compose.canLeave) return true
      this.compose.dispose()
      this.route = 'list'
      return true
    }
    if (name === 'enter') {
      if (this.compose.focus === 'prompt') return true
      this.compose.submit().catch(() => undefined)
      return true
    }
    if (name === 'tab') {
      this.compose.focus =
        this.compose.focus === 'prompt' ? 'controls' : 'prompt'
      return true
    }
    if (
      this.compose.focus === 'controls' &&
      (name === 'up' ||
        name === 'down' ||
        name === 'left' ||
        name === 'right' ||
        name === 'space')
    ) {
      this.compose.handleControlKey(name)
      return true
    }
    if (
      this.compose.focus === 'controls' &&
      name === 'y' &&
      this.compose.canRetrySend
    ) {
      this.compose.retrySend().catch(() => undefined)
      return true
    }
    if (this.compose.focus === 'controls' && name === 'x') {
      this.compose.reset()
      return true
    }
    return name === 'q' || name === 'h' || name === '?'
  }

  private handleListKey(name: string): boolean {
    if (name === 'n') {
      this.compose.dispose()
      this.compose = this.createCompose()
      this.compose.mount()
      this.route = 'compose'
      return true
    }
    if (name === 'up') {
      this.dialogues.move(-1)
      return true
    }
    if (name === 'down') {
      this.dialogues.move(1)
      return true
    }
    if (name === 'r') {
      this.dialogues.refresh().catch(() => undefined)
      return true
    }
    if (name === 'm') {
      this.dialogues.loadMore().catch(() => undefined)
      return true
    }
    return false
  }

  private createCompose(): ComposeViewModel {
    const model = new ComposeViewModel(
      this.#dependencies.agentConfigurations,
      this.#dependencies.actions,
      this.#dependencies.commands,
      (id) => {
        if (!this.mounted || this.route !== 'compose' || this.compose !== model)
          return
        this.dialogues.selectedId = id
        model.dispose()
        this.route = 'list'
      },
    )
    return model
  }
}
