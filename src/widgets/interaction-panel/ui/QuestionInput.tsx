import type { TextareaRenderable } from '@opentui/core'
import { observer } from 'mobx-react-lite'
import { useRef, type ReactElement, type ReactNode } from 'react'
import type { QuestionViewModel } from '../../../features/respond-interaction/index.js'
import type { DialogueQuestion } from '../../../modules/dialogue-engine/index.js'

const OPTION_WINDOW = 5
const OPTION_WINDOW_BEFORE = 2

export interface QuestionInputProps {
  readonly model: QuestionViewModel
  readonly focused: boolean
  readonly interactionId: string
}
export const QuestionInput = observer(function QuestionInput({
  model,
  focused,
  interactionId,
}: QuestionInputProps) {
  const question = model.question
  const textareaRef = useRef<TextareaRenderable>(null)
  if (question === undefined)
    return <text fg="#ff7777">Question is no longer available.</text>
  const constraints = constraintSummary(question)
  let answerInput: ReactNode = null
  if (question.input === 'text' && question.multiline) {
    answerInput = (
      <textarea
        key={`${interactionId}:${question.id}`}
        ref={textareaRef}
        focused={focused && !model.customOtherActive}
        initialValue={model.draft}
        onContentChange={() =>
          model.setDraft(textareaRef.current?.plainText ?? '')
        }
        placeholder="answer"
        height={4}
      />
    )
  } else if (question.input === 'text' || question.input === 'number') {
    answerInput = (
      <input
        focused={focused && !model.customOtherActive}
        value={model.draft}
        onInput={model.setDraft}
        placeholder={question.input === 'number' ? 'number' : 'answer'}
      />
    )
  }
  return (
    <box flexDirection="column">
      <text>
        {question.title}
        {question.required ? ' *' : ''} {question.input}
        {question.multiline ? ' multiline' : ''}
      </text>
      {constraints === '' ? null : <text fg="#8a8a8a">{constraints}</text>}
      {question.input === 'select'
        ? visibleOptions(question.options, model.optionCursor).map(
            ({ option, index }) => (
              <text
                key={option.value}
                fg={index === model.optionCursor ? '#77bdfb' : undefined}
              >
                {index === model.optionCursor ? '› ' : '  '}
                {option.label}{' '}
                {model.selectedValues.includes(option.value) ? '✓' : ''}
              </text>
            ),
          )
        : null}
      {question.input === 'select'
        ? model.customValues.map((value) => (
            <text key={value} fg="#77bdfb">
              {'  '}
              Other: {value} ✓
            </text>
          ))
        : null}
      {answerInput}
      {question.input === 'select' && question.allowOther ? (
        <input
          focused={focused && model.customOtherActive}
          value={model.otherDraft}
          onInput={model.setOtherDraft}
          onSubmit={model.addOther}
          placeholder="Other…"
        />
      ) : null}
      {model.error ? <text fg="#ff7777">{model.error}</text> : null}
    </box>
  )
}) as (props: QuestionInputProps) => ReactElement

function constraintSummary(question: DialogueQuestion): string {
  const constraints: string[] = []
  if (question.input === 'text') constraints.push(...textConstraints(question))
  if (question.input === 'number')
    constraints.push(...numberConstraints(question))
  if (question.input === 'select')
    constraints.push(question.multiple ? 'select one or more' : 'select one')
  if (question.input === 'select' && question.allowOther)
    constraints.push('custom values allowed')
  return constraints.join(' · ')
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

function visibleOptions(
  options: DialogueQuestion['options'],
  cursor: number,
): readonly {
  readonly option: DialogueQuestion['options'][number]
  readonly index: number
}[] {
  const start = Math.max(
    0,
    Math.min(cursor - OPTION_WINDOW_BEFORE, options.length - OPTION_WINDOW),
  )
  return options.slice(start, start + OPTION_WINDOW).map((option, offset) => ({
    option,
    index: start + offset,
  }))
}
