import { observer } from 'mobx-react-lite'
import type { InteractionViewModel } from '../../../features/respond-interaction/index.js'
import type { ReactElement } from 'react'
export interface InteractionPanelProps {
  readonly model: InteractionViewModel
}
export const InteractionPanel = observer(function InteractionPanel({
  model,
}: InteractionPanelProps) {
  const definition = model.definition
  if (!definition) return <text>Interaction unavailable.</text>
  return (
    <box flexDirection="column" border title={definition.title}>
      {definition.options.map((option, index) => (
        <text
          key={option.value}
          fg={index === model.selected ? '#77bdfb' : undefined}
        >
          {index === model.selected ? '› ' : '  '}
          {option.label}
        </text>
      ))}
      {definition.kind === 'input'
        ? definition.questions.map((question) => (
            <text key={question.id}>
              {question.title}
              {question.required ? ' *' : ''} ({question.input})
            </text>
          ))
        : null}
      <text fg="#8a8a8a">
        ↑↓ select Space toggle Enter choose/submit Ctrl-D decline Ctrl-R retry
      </text>
      {model.session.error ? (
        <text fg="#ff7777">{model.session.error}</text>
      ) : null}
    </box>
  )
}) as (props: InteractionPanelProps) => ReactElement
