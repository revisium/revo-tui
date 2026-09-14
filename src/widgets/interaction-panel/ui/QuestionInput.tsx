import type { TextareaRenderable } from '@opentui/core'
import { observer } from 'mobx-react-lite'
import { useRef, type ReactElement, type ReactNode } from 'react'
import type { QuestionViewModel } from '../../../features/respond-interaction/index.js'

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
  const constraints = model.constraintSummary
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
        height={3}
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
        {constraints === '' ? '' : ` · ${constraints}`}
        {model.customSummary}
      </text>
      {model.error ? <text fg="#ff7777">{model.error}</text> : null}
      {question.input === 'select' && model.customOtherActive ? (
        <input
          focused={focused}
          value={model.otherDraft}
          onInput={model.setOtherDraft}
          onSubmit={model.addOther}
          placeholder="Other…"
        />
      ) : null}
      {question.input === 'select'
        ? model.visibleOptions.map(({ option, index }) => (
            <text
              key={option.value}
              fg={index === model.optionCursor ? '#77bdfb' : undefined}
            >
              {index === model.optionCursor ? '› ' : '  '}
              {option.label}{' '}
              {model.selectedValues.includes(option.value) ? '✓' : ''}
            </text>
          ))
        : null}
      {answerInput}
    </box>
  )
}) as (props: QuestionInputProps) => ReactElement
