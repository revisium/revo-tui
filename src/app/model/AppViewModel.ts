import { makeAutoObservable } from 'mobx'
import type {
  DialogueActions,
  DialogueCommands,
  DialogueEngine,
} from '../../modules/dialogue-engine/index.js'
import type { AgentConfigurationsService } from '../../modules/agent-configurations/index.js'
import { ComposeViewModel } from '../../pages/compose/index.js'
import { DialogueListViewModel } from '../../pages/dialogues/index.js'
import { DialogueViewModel } from '../../pages/dialogue/index.js'

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
  public route: 'list' | 'compose' | 'dialogue' = 'list'
  public readonly dialogues: DialogueListViewModel
  public compose: ComposeViewModel
  public dialogue: DialogueViewModel | undefined
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
    this.dialogue?.dispose()
    this.dialogue = undefined
    this.compose.dispose()
    this.dialogues.dispose()
    this.mounted = false
  }

  public handleKey(name: string, ctrl: boolean): void {
    if ((ctrl && name === 'c') || (this.route === 'list' && name === 'q')) {
      this.#requestExit()
      return
    }
    if (this.route === 'compose' && this.handleComposeKey(name)) return
    if (this.route === 'dialogue' && this.handleDialogueKey(name, ctrl)) return
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
    if (name === 'enter' && this.dialogues.selectedId) {
      this.openDialogue(this.dialogues.selectedId)
      return true
    }
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

  private handleDialogueKey(name: string, ctrl: boolean): boolean {
    const dialogue = this.dialogue
    if (!dialogue) return false
    if (name === 'escape') {
      const question = dialogue.interaction?.currentQuestionVM
      if (dialogue.focus === 'interaction' && question?.customOtherActive) {
        question.cancelOther()
        return true
      }
      dialogue.back()
      return true
    }
    if (name === 'tab') {
      if (dialogue.focus === 'prompt') dialogue.focus = 'controls'
      else if (dialogue.focus === 'controls' && dialogue.interaction)
        dialogue.focus = 'interaction'
      else dialogue.focus = 'prompt'
      return true
    }
    if (
      dialogue.focus === 'controls' &&
      this.handleDialogueControl(dialogue, name)
    )
      return true
    if (
      dialogue.focus === 'interaction' &&
      dialogue.interaction &&
      this.handleInteractionKey(dialogue, name, ctrl)
    )
      return true
    return (
      name === 'q' ||
      name === 'x' ||
      name === 'y' ||
      name === 'h' ||
      name === '?'
    )
  }

  private handleInteractionKey(
    dialogue: DialogueViewModel,
    name: string,
    ctrl: boolean,
  ): boolean {
    const interaction = dialogue.interaction
    if (!interaction) return false
    if (ctrl && name === 'up') return (interaction.selectQuestion(-1), true)
    if (ctrl && name === 'down') return (interaction.selectQuestion(1), true)
    if (interaction.definition?.kind === 'input')
      return this.handleQuestionKey(interaction, name, ctrl)
    if (name === 'up' || name === 'left')
      return (interaction.chooseNext(-1), true)
    if (name === 'down' || name === 'right')
      return (interaction.chooseNext(1), true)
    if (name === 'space') {
      interaction.choose().catch(() => undefined)
      return true
    }
    return this.handleInteractionAction(interaction, name, ctrl)
  }

  private handleQuestionKey(
    interaction: NonNullable<DialogueViewModel['interaction']>,
    name: string,
    ctrl: boolean,
  ): boolean {
    const question = interaction.currentQuestionVM
    if (!question) return false
    if (this.handleInteractionAction(interaction, name, ctrl)) return true
    const definition = question.question
    if (
      ctrl &&
      name === 'o' &&
      definition?.input === 'select' &&
      definition.allowOther
    ) {
      if (question.customOtherActive) question.cancelOther()
      else question.activateOther()
      return true
    }
    if (definition?.input !== 'select' || question.customOtherActive)
      return false
    if (name === 'up' || name === 'left') return (question.chooseNext(-1), true)
    if (name === 'down' || name === 'right')
      return (question.chooseNext(1), true)
    if (name === 'space') return (question.choose(), true)
    return false
  }

  private handleInteractionAction(
    interaction: NonNullable<DialogueViewModel['interaction']>,
    name: string,
    ctrl: boolean,
  ): boolean {
    if (ctrl && name === 's') {
      interaction.submit().catch(() => undefined)
      return true
    }
    if (ctrl && name === 'd') {
      interaction.decline().catch(() => undefined)
      return true
    }
    if (ctrl && name === 'r') {
      interaction.retry().catch(() => undefined)
      return true
    }
    if (
      (name === 'enter' || name === 'return') &&
      interaction.definition?.kind === 'permission'
    ) {
      interaction.choose().catch(() => undefined)
      return true
    }
    return false
  }

  private handleDialogueControl(
    dialogue: DialogueViewModel,
    name: string,
  ): boolean {
    if (name === '[') {
      dialogue.selectInteraction(-1)
      return true
    }
    if (name === ']') {
      dialogue.selectInteraction(1)
      return true
    }
    if (name === 'pageup') {
      dialogue.pageUp()
      return true
    }
    if (name === 'pagedown') {
      dialogue.pageDown()
      return true
    }
    if (name === 'end') {
      dialogue.end()
      return true
    }
    if (name === 'r') {
      dialogue.retry().catch(() => undefined)
      return true
    }
    if (name === 'c') {
      dialogue.cancel().catch(() => undefined)
      return true
    }
    if (name === 'o') {
      dialogue.older().catch(() => undefined)
      return true
    }
    return false
  }

  private openDialogue(id: string): void {
    this.dialogue?.dispose()
    this.dialogue = new DialogueViewModel(
      this.#dependencies.engine,
      this.#dependencies.actions,
      this.#dependencies.commands,
      id,
      () => {
        this.dialogue?.dispose()
        this.dialogue = undefined
        this.route = 'list'
      },
    )
    this.dialogue.mount()
    this.route = 'dialogue'
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
