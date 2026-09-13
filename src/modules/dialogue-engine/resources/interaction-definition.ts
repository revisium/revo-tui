import type {
  DialogueInputValues,
  DialogueInteractionDefinition,
  DialogueOption,
  DialogueQuestion,
} from '../contracts/interaction.types.js'
import type { JsonValue } from '../contracts/dialogue.types.js'
import { readonlyValue } from './readonly-value.js'

export function interactionDefinition(
  value: JsonValue,
): DialogueInteractionDefinition | undefined {
  const record = recordOf(value)
  if (record === undefined) return undefined
  const kind = record.kind
  if (kind !== 'permission' && kind !== 'input') return undefined
  const action = recordOf(record.action)
  const title = stringOf(record.message) ?? stringOf(action?.title) ?? ''
  const options = optionsOf(record.options)
  const questions = questionsOf(record.questions)
  if (options === undefined || questions === undefined) return undefined
  if (kind === 'permission' && options.length === 0) return undefined
  if (kind === 'input' && questions.length === 0) return undefined
  return Object.freeze({ kind, title, options, questions })
}

export function validInput(
  questions: readonly DialogueQuestion[],
  values: DialogueInputValues,
): boolean {
  const entries = Object.entries(values)
  if (entries.some(([id]) => !questions.some((question) => question.id === id)))
    return false
  return questions.every((question) => {
    const value = values[question.id]
    if (value === undefined) return !question.required
    if (question.input === 'text') return validText(question, value)
    if (question.input === 'number') return validNumber(question, value)
    if (question.input === 'select') return validSelection(question, value)
    return false
  })
}

function questionsOf(
  value: JsonValue | undefined,
): readonly DialogueQuestion[] | undefined {
  if (value === undefined) return []
  if (!Array.isArray(value)) return undefined
  const questions = value.map(questionOf)
  if (questions.includes(undefined)) return undefined
  const result = questions as DialogueQuestion[]
  if (new Set(result.map(({ id }) => id)).size !== result.length)
    return undefined
  return Object.freeze(result)
}

function questionOf(value: JsonValue): DialogueQuestion | undefined {
  const record = recordOf(value)
  if (record === undefined) return undefined
  const id = stringOf(record?.questionId)
  const input = stringOf(record?.input)
  if (
    id === undefined ||
    input === undefined ||
    !['text', 'number', 'select'].includes(input)
  )
    return undefined
  if (!validQuestionFields(record)) return undefined
  const options = optionsOf(record.options)
  if (options === undefined) return undefined
  const question = {
    id,
    title: stringOf(record?.title) ?? '',
    input,
    multiline: record?.multiline === true,
    multiple: record?.selection === 'multiple',
    required: record?.required === true,
    allowOther: record?.allowOther === true,
    integer: record?.integer === true,
    options,
    minLength: numberOf(record?.minLength),
    maxLength: numberOf(record?.maxLength),
    minimum: numberOf(record?.minimum),
    maximum: numberOf(record?.maximum),
  }
  if (input === 'select' && question.options.length === 0) return undefined
  return Object.freeze(question)
}

function optionsOf(
  value: JsonValue | undefined,
): readonly DialogueOption[] | undefined {
  if (value === undefined) return []
  if (!Array.isArray(value)) return undefined
  const options: DialogueOption[] = []
  for (const entry of value) {
    const record = recordOf(entry)
    const optionId = stringOf(record?.optionId)
    const label = stringOf(record?.label)
    if (optionId === undefined || label === undefined) return undefined
    options.push({ value: optionId, label })
  }
  if (new Set(options.map(({ value: id }) => id)).size !== options.length)
    return undefined
  return Object.freeze(options.map((option) => Object.freeze(option)))
}

function validQuestionFields(
  record: Readonly<Record<string, JsonValue>>,
): boolean {
  const booleans = ['multiline', 'required', 'allowOther', 'integer']
  if (
    booleans.some(
      (key) => record[key] !== undefined && typeof record[key] !== 'boolean',
    )
  )
    return false
  if (
    record.selection !== undefined &&
    record.selection !== 'single' &&
    record.selection !== 'multiple'
  )
    return false
  const minLength = numberOf(record.minLength)
  const maxLength = numberOf(record.maxLength)
  if (
    (record.minLength !== undefined &&
      (minLength === undefined ||
        !Number.isInteger(minLength) ||
        minLength < 0)) ||
    (record.maxLength !== undefined &&
      (maxLength === undefined ||
        !Number.isInteger(maxLength) ||
        maxLength < 0)) ||
    (minLength !== undefined &&
      maxLength !== undefined &&
      minLength > maxLength)
  )
    return false
  const minimum = numberOf(record.minimum)
  const maximum = numberOf(record.maximum)
  return !(
    (record.minimum !== undefined && minimum === undefined) ||
    (record.maximum !== undefined && maximum === undefined) ||
    (minimum !== undefined && maximum !== undefined && minimum > maximum)
  )
}

function validText(question: DialogueQuestion, value: JsonValue): boolean {
  return (
    typeof value === 'string' &&
    (question.minLength === undefined || value.length >= question.minLength) &&
    (question.maxLength === undefined || value.length <= question.maxLength)
  )
}

function validNumber(question: DialogueQuestion, value: JsonValue): boolean {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    (!question.integer || Number.isInteger(value)) &&
    (question.minimum === undefined || value >= question.minimum) &&
    (question.maximum === undefined || value <= question.maximum)
  )
}

function validSelection(question: DialogueQuestion, value: JsonValue): boolean {
  let values: readonly JsonValue[] = [value]
  if (question.multiple) values = Array.isArray(value) ? value : []
  return (
    values.length > 0 &&
    values.every(
      (entry) =>
        typeof entry === 'string' &&
        (question.allowOther ||
          question.options.some(({ value: option }) => option === entry)),
    )
  )
}

function recordOf(
  value: JsonValue | undefined,
): Readonly<Record<string, JsonValue>> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Readonly<Record<string, JsonValue>>)
    : undefined
}

function stringOf(value: JsonValue | undefined): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

function numberOf(value: JsonValue | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function detachedInput(values: DialogueInputValues): JsonValue {
  return readonlyValue(values)
}
