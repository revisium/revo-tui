import { observer } from 'mobx-react-lite'
import type { QuestionViewModel } from '../../../features/respond-interaction/index.js'
export interface QuestionInputProps {
  readonly model: QuestionViewModel
  readonly focused: boolean
}
export const QuestionInput = observer(function QuestionInput({
  model,
  focused,
}: QuestionInputProps) {
  const question = model.question
  return (
    <box flexDirection="column">
      <text>
        {question.title}
        {question.required ? ' *' : ''} {question.input}
        {question.multiline ? ' multiline' : ''}
      </text>
      {question.options.map((option, index) => (
        <text
          key={option.value}
          fg={index === model.optionCursor ? '#77bdfb' : undefined}
        >
          {index === model.optionCursor ? '› ' : '  '}
          {option.label}{' '}
          {model.selectedValues.includes(option.value) ? '✓' : ''}
        </text>
      ))}
      <input
        focused={focused && !model.customOtherActive}
        value={model.draft}
        onInput={model.setDraft}
        placeholder={question.input === 'number' ? 'number' : 'answer'}
      />
      {question.allowOther ? (
        <input
          focused={focused && model.customOtherActive}
          value={model.otherDraft}
          onInput={model.setOtherDraft}
          placeholder="Other…"
        />
      ) : null}
      {model.error ? <text fg="#ff7777">{model.error}</text> : null}
    </box>
  )
})
