import { makeAutoObservable } from 'mobx'
import type {
  DialogueQuestion,
  JsonValue,
} from '../../../modules/dialogue-engine/index.js'

export type QuestionResolver = () => DialogueQuestion | undefined
const OPTION_WINDOW = 5
const OPTION_WINDOW_BEFORE = 2

export class QuestionViewModel {
  public draft = ''
  public otherDraft = ''
  public optionCursor = 0
  private readonly selected = new Set<string>()
  private readonly custom = new Set<string>()
  private otherActive = false
  private draftEdited = false

  public constructor(private readonly resolveQuestion: QuestionResolver) {
    makeAutoObservable<this, 'resolveQuestion'>(
      this,
      { resolveQuestion: false },
      { autoBind: true },
    )
  }

  public get question(): DialogueQuestion | undefined {
    return this.resolveQuestion()
  }

  public get options() {
    return this.question?.options ?? []
  }

  public get selectedValues(): readonly string[] {
    return Object.freeze([...this.selected])
  }

  public get customValues(): readonly string[] {
    return Object.freeze([...this.custom])
  }

  public get customOtherActive(): boolean {
    const question = this.question
    return (
      this.otherActive && question?.input === 'select' && question.allowOther
    )
  }

  public get visibleOptions(): readonly {
    readonly option: DialogueQuestion['options'][number]
    readonly index: number
  }[] {
    const start = Math.max(
      0,
      Math.min(
        this.optionCursor - OPTION_WINDOW_BEFORE,
        this.options.length - OPTION_WINDOW,
      ),
    )
    return this.options
      .slice(start, start + OPTION_WINDOW)
      .map((option, offset) => ({ option, index: start + offset }))
  }

  public get constraintSummary(): string {
    const question = this.question
    if (question === undefined) return ''
    const constraints: string[] = []
    if (question.input === 'text')
      constraints.push(...textConstraints(question))
    if (question.input === 'number')
      constraints.push(...numberConstraints(question))
    if (question.input === 'select')
      constraints.push(question.multiple ? 'select one or more' : 'select one')
    if (question.input === 'select' && question.allowOther)
      constraints.push('custom values allowed')
    return constraints.join(' · ')
  }

  public get value(): JsonValue | undefined {
    const question = this.question
    if (question === undefined || this.selectionError(question) !== '')
      return undefined
    if (question.input === 'text')
      return this.draftEdited ? this.draft : undefined
    if (question.input === 'number') {
      if (!this.draftEdited || this.draft.trim() === '') return undefined
      const value = Number(this.draft)
      return Number.isFinite(value) ? value : undefined
    }
    if (question.input !== 'select') return undefined
    const values = this.selectedValues
    if (question.multiple) return values.length === 0 ? undefined : values
    return values[0]
  }

  public get error(): string {
    const question = this.question
    if (question === undefined) return 'Question is no longer available.'
    if (!supportedInput(question.input)) return 'Question input is unsupported.'
    const selectionError = this.selectionError(question)
    if (selectionError !== '') return selectionError
    const value = this.value
    if (value === undefined) {
      if (
        question.input === 'number' &&
        this.draftEdited &&
        this.draft.trim() !== ''
      )
        return 'Enter a finite number.'
      return question.required ? 'Required.' : ''
    }
    if (question.input === 'text') return this.textError(question)
    if (question.input === 'number') return this.numberError(question, value)
    return ''
  }

  public setDraft(value: string): void {
    this.draft = value
    this.draftEdited = true
  }

  public setOtherDraft(value: string): void {
    this.otherDraft = value
  }

  public chooseNext(delta: number): void {
    this.optionCursor = Math.min(
      Math.max(0, this.options.length - 1),
      Math.max(0, this.optionCursor + delta),
    )
  }

  public choose(): void {
    const question = this.question
    const option = this.options[this.optionCursor]
    if (question === undefined || option === undefined) return
    if (question.multiple) {
      this.toggle(option.value)
      return
    }
    this.selected.clear()
    this.custom.clear()
    this.selected.add(option.value)
  }

  public toggle(value: string): void {
    const question = this.question
    if (
      question === undefined ||
      !question.multiple ||
      !question.options.some((option) => option.value === value)
    )
      return
    if (this.selected.has(value)) this.selected.delete(value)
    else this.selected.add(value)
  }

  public activateOther(): void {
    const question = this.question
    if (question?.input === 'select' && question.allowOther)
      this.otherActive = true
  }

  public cancelOther(): void {
    this.otherActive = false
  }

  public addOther(): void {
    const question = this.question
    if (
      question?.input !== 'select' ||
      !question.allowOther ||
      this.otherDraft.trim() === ''
    )
      return
    if (!question.multiple) {
      this.selected.clear()
      this.custom.clear()
    }
    this.selected.add(this.otherDraft)
    this.custom.add(this.otherDraft)
    this.otherDraft = ''
    this.otherActive = false
  }

  private selectionError(question: DialogueQuestion): string {
    if (question.input !== 'select' && this.selected.size !== 0)
      return 'Selection does not belong to this question.'
    if (
      question.input === 'select' &&
      !question.multiple &&
      this.selected.size > 1
    )
      return 'Select one option.'
    for (const value of this.selected) {
      const known = question.options.some((option) => option.value === value)
      if (!known && (!question.allowOther || !this.custom.has(value)))
        return 'A selected option is no longer available.'
    }
    return ''
  }

  private textError(question: DialogueQuestion): string {
    if (
      question.minLength !== undefined &&
      this.draft.length < question.minLength
    )
      return `Minimum ${question.minLength} characters.`
    if (
      question.maxLength !== undefined &&
      this.draft.length > question.maxLength
    )
      return `Maximum ${question.maxLength} characters.`
    return ''
  }

  private numberError(question: DialogueQuestion, value: JsonValue): string {
    if (typeof value !== 'number' || !Number.isFinite(value))
      return 'Enter a finite number.'
    if (question.integer && !Number.isInteger(value))
      return 'Whole number required.'
    if (question.minimum !== undefined && value < question.minimum)
      return `Minimum ${question.minimum}.`
    if (question.maximum !== undefined && value > question.maximum)
      return `Maximum ${question.maximum}.`
    return ''
  }
}

function supportedInput(input: string): boolean {
  return input === 'text' || input === 'number' || input === 'select'
}

function textConstraints(question: DialogueQuestion): string[] {
  const constraints: string[] = []
  if (question.minLength !== undefined)
    constraints.push(`min length ${question.minLength}`)
  if (question.maxLength !== undefined)
    constraints.push(`max length ${question.maxLength}`)
  return constraints
}

function numberConstraints(question: DialogueQuestion): string[] {
  const constraints: string[] = []
  if (question.integer) constraints.push('whole number')
  if (question.minimum !== undefined)
    constraints.push(`minimum ${question.minimum}`)
  if (question.maximum !== undefined)
    constraints.push(`maximum ${question.maximum}`)
  return constraints
}
