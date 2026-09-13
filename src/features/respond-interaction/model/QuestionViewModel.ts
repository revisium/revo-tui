import { makeAutoObservable } from 'mobx'
import type { DialogueQuestion } from '../../../modules/dialogue-engine/index.js'
import type { JsonValue } from '../../../modules/dialogue-engine/index.js'

export class QuestionViewModel {
  public draft = ''
  public otherDraft = ''
  public optionCursor = 0
  private readonly selected = new Set<string>()
  private otherActive = false
  public constructor(public readonly question: DialogueQuestion) {
    makeAutoObservable(this, {}, { autoBind: true })
  }
  public get options() {
    return this.question.options
  }
  public get selectedValues(): readonly string[] {
    return [...this.selected]
  }
  public get customOtherActive(): boolean {
    return this.otherActive
  }
  public get value(): JsonValue | undefined {
    if (this.question.input === 'text')
      return this.draft === '' ? undefined : this.draft
    if (this.question.input === 'number') {
      if (this.draft.trim() === '') return undefined
      const number = Number(this.draft)
      return Number.isFinite(number) ? number : undefined
    }
    const values = this.selectedValues
    if (this.question.multiple) return values.length ? values : undefined
    return values[0]
  }
  public get error(): string {
    const value = this.value
    if (value === undefined) {
      if (this.question.input === 'number' && this.draft.trim() !== '')
        return 'Enter a valid number.'
      return this.question.required ? 'Required.' : ''
    }
    return this.question.input === 'text'
      ? this.textError()
      : this.numberError(value)
  }
  private textError(): string {
    if (
      this.question.minLength !== undefined &&
      this.draft.length < this.question.minLength
    )
      return `Minimum ${this.question.minLength} characters.`
    if (
      this.question.maxLength !== undefined &&
      this.draft.length > this.question.maxLength
    )
      return `Maximum ${this.question.maxLength} characters.`
    return ''
  }
  private numberError(value: JsonValue): string {
    if (typeof value !== 'number' || !Number.isFinite(value))
      return 'Number is outside the allowed range.'
    if (this.question.integer && !Number.isInteger(value))
      return 'Whole number required.'
    if (this.question.minimum !== undefined && value < this.question.minimum)
      return `Minimum ${this.question.minimum}.`
    if (this.question.maximum !== undefined && value > this.question.maximum)
      return `Maximum ${this.question.maximum}.`
    return ''
  }
  public setDraft(value: string): void {
    this.draft = value
  }
  public setOtherDraft(value: string): void {
    this.otherDraft = value
  }
  public chooseNext(delta: number): void {
    this.optionCursor = Math.min(
      this.options.length - 1,
      Math.max(0, this.optionCursor + delta),
    )
  }
  public choose(): void {
    const option = this.options[this.optionCursor]
    if (!option) return
    if (this.question.multiple) {
      this.toggle(option.value)
      return
    }
    this.selected.clear()
    this.selected.add(option.value)
  }
  public toggle(value: string): void {
    if (this.selected.has(value)) this.selected.delete(value)
    else this.selected.add(value)
  }
  public activateOther(): void {
    if (this.question.allowOther) this.otherActive = true
  }
  public addOther(): void {
    if (this.question.allowOther && this.otherDraft.trim() !== '') {
      this.selected.add(this.otherDraft)
      this.otherDraft = ''
      this.otherActive = false
    }
  }
}
