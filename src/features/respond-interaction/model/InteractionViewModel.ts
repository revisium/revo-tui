import { makeAutoObservable, reaction, type IReactionDisposer } from 'mobx'
import {
  ObservableRequest,
  RequestAbortError,
  errorMessageOf,
} from '../../../modules/observable-request/index.js'
import type {
  DialogueInputValues,
  DialogueInteractionSessionView,
  DialogueResourceView,
  JsonValue,
} from '../../../modules/dialogue-engine/index.js'
import { QuestionViewModel } from './QuestionViewModel.js'

const OPTION_WINDOW = 3
const OPTION_WINDOW_BEFORE = 1

export class InteractionViewModel {
  public selected = 0
  public question = 0
  private readonly request: ObservableRequest<void, [SessionAction, number]>
  private readonly questions = new Map<string, QuestionViewModel>()
  private sessionValue: DialogueInteractionSessionView | undefined
  private definitionDisposer: IReactionDisposer | undefined
  private validationError = ''
  private generation = 0
  private active = false

  public constructor(
    private readonly resource: DialogueResourceView,
    public readonly id: string,
  ) {
    this.request = ObservableRequest.of(
      async ({ signal }, action, generation) => {
        const session = this.currentSession(generation, signal)
        await action(session)
        this.assertCurrent(generation, signal)
      },
    )
    makeAutoObservable<
      this,
      | 'definitionDisposer'
      | 'questions'
      | 'request'
      | 'resource'
      | 'sessionValue'
    >(
      this,
      {
        definitionDisposer: false,
        questions: false,
        request: false,
        resource: false,
        sessionValue: false,
      },
      { autoBind: true },
    )
  }

  public get session(): DialogueInteractionSessionView {
    if (this.sessionValue === undefined)
      throw new Error('Interaction view model is not mounted.')
    return this.sessionValue
  }
  public get definition() {
    return this.sessionValue?.definition
  }
  public get options() {
    return this.definition?.options ?? []
  }
  public get currentQuestionVM(): QuestionViewModel | undefined {
    const current = this.definition?.questions[this.question]
    return current === undefined ? undefined : this.questions.get(current.id)
  }
  public get questionCount(): number {
    return this.definition?.questions.length ?? 0
  }
  public get visibleOptions() {
    const start = Math.max(
      0,
      Math.min(
        this.selected - OPTION_WINDOW_BEFORE,
        this.options.length - OPTION_WINDOW,
      ),
    )
    return this.options
      .slice(start, start + OPTION_WINDOW)
      .map((option, offset) => ({ option, index: start + offset }))
  }
  public get stateLabel(): string {
    if (this.busy) return 'sending'
    if (this.canRespond) return 'ready'
    if (this.canRetry) return 'retry available'
    return 'waiting'
  }
  public get keyboardHint(): string {
    if (this.definition?.kind === 'permission')
      return 'Tab · [ ]@controls · arrows · Space/Enter choose · ^D deny · ^R retry'
    const question = this.currentQuestionVM
    let questionHint = 'type · ^S send · ^D decline · ^R retry'
    if (question?.question?.input === 'select') {
      questionHint = 'arrows/Space · ^S send'
      if (question.question.allowOther) {
        questionHint = question.customOtherActive
          ? 'type · Enter add · ^O cancel · ^S send'
          : 'arrows/Space · ^O Other · ^S send'
      }
    }
    return `Tab · [ ]@ctl · ^↑↓ Q · ${questionHint}`
  }
  public get pendingMessage(): string {
    return this.canRetry
      ? 'Pending interaction response retained. Press Ctrl-R to retry.'
      : 'Interaction definition is not currently available.'
  }
  public get panelTitle(): string {
    const definition = this.definition
    if (definition === undefined) return 'Interaction'
    const position =
      definition.kind === 'input'
        ? ` · ${this.question + 1}/${this.questionCount}`
        : ''
    return `${definition.title}${position} · ${this.stateLabel}`
  }
  public get activeControlViewId(): string {
    return `${this.id}:active-interaction-control`
  }
  public get activeControlRevision(): string {
    const question = this.currentQuestionVM
    return [
      this.definition?.kind ?? '',
      this.selected,
      this.question,
      question?.optionCursor ?? 0,
      question?.customOtherActive ?? false,
      question?.customSummary ?? '',
      this.visibleError,
    ].join(':')
  }
  public get busy(): boolean {
    return this.request.isLoading || this.sessionValue?.busy === true
  }
  public get canRespond(): boolean {
    return this.active && !this.busy && this.sessionValue?.canRespond === true
  }
  public get canRetry(): boolean {
    return this.active && !this.busy && this.sessionValue?.canRetry === true
  }
  public get error(): string {
    if (this.validationError !== '') return this.validationError
    if (this.request.error !== null)
      return errorMessageOf(this.request.error, 'Interaction response failed.')
    return this.sessionValue?.error ?? ''
  }
  public get visibleError(): string {
    return this.error || this.currentQuestionVM?.error || ''
  }

  public mount(): void {
    if (this.active) return
    this.active = true
    this.generation += 1
    this.sessionValue = this.resource.interaction(this.id)
    this.definitionDisposer = reaction(
      () => this.definition?.questions.map(({ id }) => id) ?? [],
      this.syncQuestions,
      { fireImmediately: true },
    )
  }
  public dispose(): void {
    if (!this.active) return
    this.active = false
    this.generation += 1
    this.request.abort()
    this.definitionDisposer?.()
    this.definitionDisposer = undefined
    this.sessionValue = undefined
  }
  public chooseNext(delta: number): void {
    this.selected = boundedIndex(this.selected, delta, this.options.length)
  }
  public selectQuestion(delta: number): void {
    this.question = boundedIndex(
      this.question,
      delta,
      this.definition?.questions.length ?? 0,
    )
  }
  public async choose(): Promise<void> {
    const option = this.options[this.selected]
    if (option !== undefined)
      await this.perform((session) => session.choose(option.value))
  }
  public async submit(): Promise<void> {
    if (!this.canRespond) return
    const definition = this.definition
    if (definition?.kind !== 'input') {
      this.validationError = 'Interaction input is unavailable.'
      return
    }
    const entries: [string, JsonValue][] = []
    for (const [index, question] of definition.questions.entries()) {
      const model = this.questions.get(question.id)
      const error = model?.error ?? 'Question is unavailable.'
      if (error !== '') {
        this.question = index
        this.validationError = error
        return
      }
      const value = model?.value
      if (value !== undefined) entries.push([question.id, value])
    }
    this.validationError = ''
    await this.perform((session) =>
      session.submit(Object.fromEntries(entries) as DialogueInputValues),
    )
  }
  public async decline(): Promise<void> {
    await this.perform((session) => session.decline())
  }
  public async retry(): Promise<void> {
    await this.perform((session) => session.retry(), true)
  }

  private async perform(action: SessionAction, retry = false): Promise<void> {
    if (
      !this.active ||
      this.busy ||
      (retry ? !this.canRetry : !this.canRespond)
    )
      return
    this.validationError = ''
    await this.request.fetch(action, this.generation)
  }
  private syncQuestions(): void {
    const current = this.definition?.questions ?? []
    const ids = new Set(current.map(({ id }) => id))
    for (const id of this.questions.keys())
      if (!ids.has(id)) this.questions.delete(id)
    for (const question of current)
      if (!this.questions.has(question.id)) {
        this.questions.set(
          question.id,
          new QuestionViewModel(() =>
            this.definition?.questions.find(({ id }) => id === question.id),
          ),
        )
      }
    this.question = boundedIndex(this.question, 0, current.length)
  }
  private currentSession(
    generation: number,
    signal: AbortSignal,
  ): DialogueInteractionSessionView {
    this.assertCurrent(generation, signal)
    if (this.sessionValue === undefined) throw new RequestAbortError()
    return this.sessionValue
  }
  private assertCurrent(generation: number, signal: AbortSignal): void {
    if (!this.active || generation !== this.generation || signal.aborted)
      throw new RequestAbortError()
  }
}

type SessionAction = (session: DialogueInteractionSessionView) => Promise<void>
function boundedIndex(current: number, delta: number, length: number): number {
  return length === 0 ? 0 : Math.min(length - 1, Math.max(0, current + delta))
}
