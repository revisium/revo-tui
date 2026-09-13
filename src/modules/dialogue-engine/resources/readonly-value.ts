import { DialogueError } from '../errors/DialogueError.js'
import type { JsonValue } from '../contracts/dialogue.types.js'

export function readonlyValue(value: JsonValue): JsonValue {
  return cloneValue(value, new Set<object>())
}

function cloneValue(value: JsonValue, parents: Set<object>): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) return value
    throw unsupportedValue()
  }
  if (typeof value !== 'object') throw unsupportedValue()
  if (parents.has(value)) throw unsupportedValue()
  if (!Array.isArray(value) && !isPlainObject(value)) throw unsupportedValue()

  parents.add(value)
  const copy = Array.isArray(value)
    ? value.map((item) => cloneValue(item, parents))
    : Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          cloneValue(item, parents),
        ]),
      )
  parents.delete(value)
  return Object.freeze(copy) as JsonValue
}

function isPlainObject(
  value: object,
): value is { readonly [key: string]: JsonValue } {
  const prototype = Object.getPrototypeOf(value) as unknown
  return prototype === Object.prototype || prototype === null
}

function unsupportedValue(): DialogueError {
  return new DialogueError(
    'unsupported-value',
    'Dialogue data contains a value that cannot be represented as JSON.',
    'stop',
  )
}
