import { DialogueError } from '../errors/DialogueError.js'

const DECIMAL_SEQUENCE = /^(?:0|[1-9]\d*)$/

export function sequenceValue(value: string): bigint {
  if (!DECIMAL_SEQUENCE.test(value)) {
    throw new DialogueError(
      'invalid-sequence',
      'Dialogue sequence must be a non-negative decimal string.',
      'refresh',
    )
  }
  return BigInt(value)
}

export function compareSequence(left: string, right: string): number {
  const leftValue = sequenceValue(left)
  const rightValue = sequenceValue(right)
  if (leftValue === rightValue) return 0
  return leftValue > rightValue ? 1 : -1
}
