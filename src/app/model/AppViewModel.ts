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
  public readonly compose: ComposeViewModel

  readonly #options: AppViewModelOptions
  readonly #requestExit: () => void

  public constructor(
    options: AppViewModelOptions & AppViewModelDependencies,
    requestExit: () => void,
  ) {
    this.#options = options
    this.#requestExit = requestExit
    const engine = options.engine
    this.dialogues = new DialogueListViewModel(engine)
    this.compose = new ComposeViewModel(
      options.agentConfigurations,
      options.actions,
      options.commands,
      (id) => {
        this.dialogues.selectedId = id
        this.compose.dispose()
        this.route = 'list'
      },
    )
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
    if (this.route === 'compose' && this.handleComposeKey(name)) return
    if (this.route === 'list' && this.handleListKey(name)) return
    if (name === '?' || name === 'h') {
      this.helpVisible = !this.helpVisible
      return
    }

    if (name === 'q' || name === 'escape' || (ctrl && name === 'c')) {
      this.#requestExit()
    }
  }

  private handleComposeKey(name: string): boolean {
    if (name === 'escape') {
      this.compose.dispose()
      this.route = 'list'
      return true
    }
    if (name === 'enter') {
      this.compose.submit().catch(this.showError)
      return true
    }
    if (name === 'tab') {
      this.compose.focus = this.compose.focus === 'prompt' ? 'title' : 'prompt'
      return true
    }
    if (name === 'y') {
      this.compose.retrySend().catch(this.showError)
      return true
    }
    if (name === 'x') {
      this.compose.reset()
      return true
    }
    return name === 'q' || name === 'h' || name === '?'
  }

  private handleListKey(name: string): boolean {
    if (name === 'n') {
      this.compose.reset()
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
      this.dialogues.refresh().catch(this.showError)
      return true
    }
    if (name === 'm') {
      this.dialogues.loadMore().catch(this.showError)
      return true
    }
    return false
  }

  private showError = (error: unknown): void => {
    if (this.route === 'compose')
      this.compose.error =
        error instanceof Error ? error.message : 'Request failed.'
  }
}
