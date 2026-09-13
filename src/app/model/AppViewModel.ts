import { makeAutoObservable } from 'mobx'
import type { DialogueActions, DialogueCommands, DialogueEngine } from '../../modules/dialogue-engine/index.js'
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
    this.compose = new ComposeViewModel(options.agentConfigurations, options.actions, options.commands, (id) => {
      this.dialogues.selectedId = id
      this.route = 'list'
    })
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
    if (this.route === 'compose') {
      if (name === 'escape') { this.route = 'list'; return }
      if (name === 'enter') { void this.compose.submit(); return }
      if (name === 'tab') { this.compose.focus = this.compose.focus === 'prompt' ? 'title' : 'prompt'; return }
      if (name === 'q' || name === 'h' || name === '?') return
    }
    if (this.route === 'list') {
      if (name === 'n') { this.route = 'compose'; return }
      if (name === 'up') { this.dialogues.move(-1); return }
      if (name === 'down') { this.dialogues.move(1); return }
      if (name === 'r') { void this.dialogues.refresh(); return }
      if (name === 'm') { void this.dialogues.loadMore(); return }
    }
    if (name === '?' || name === 'h') {
      this.helpVisible = !this.helpVisible
      return
    }

    if (name === 'q' || name === 'escape' || (ctrl && name === 'c')) {
      this.#requestExit()
    }
  }
}
