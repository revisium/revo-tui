import { observer } from 'mobx-react-lite'
import type { InteractionViewModel } from '../../../features/respond-interaction/index.js'
import type { ReactElement } from 'react'
import { QuestionInput } from './QuestionInput.js'
export interface InteractionPanelProps {
  readonly model: InteractionViewModel
  readonly focused: boolean
}
export const InteractionPanel = observer(function InteractionPanel({
  model,
  focused,
}: InteractionPanelProps) {
  const definition = model.definition
  const state = interactionState(model)
  const permissionOptions =
    definition?.kind === 'permission'
      ? definition.options.map((option, index) => (
          <text
            key={option.value}
            fg={focused && index === model.selected ? '#77bdfb' : undefined}
          >
            {focused && index === model.selected ? '› ' : '  '}
            {option.label} ({option.value})
          </text>
        ))
      : null
  const questionContent = renderQuestion(model, focused)
  if (!definition) return <PendingInteraction model={model} focused={focused} />
  return (
    <box flexDirection="column" border title={definition.title}>
      {permissionOptions}
      {definition.kind === 'input' ? questionContent : null}
      <text>State: {state}</text>
      <text fg="#8a8a8a">
        {definition.kind === 'permission'
          ? '↑↓/←→ select · Space/Enter choose'
          : 'Ctrl-↑↓ question · ↑↓/←→ option · Space choose · Ctrl-O Other · Enter add'}
        {' · Ctrl-S submit · Ctrl-D decline · Ctrl-R retry'}
      </text>
      {model.error ? <text fg="#ff7777">{model.error}</text> : null}
    </box>
  )
}) as (props: InteractionPanelProps) => ReactElement

function interactionState(model: InteractionViewModel): string {
  if (model.busy) return 'sending'
  if (model.canRespond) return 'ready'
  if (model.canRetry) return 'retry available'
  return 'waiting'
}

function PendingInteraction({ model }: InteractionPanelProps): ReactElement {
  const message = model.canRetry
    ? 'Pending interaction response retained. Press Ctrl-R to retry.'
    : 'Interaction definition is not currently available.'
  return (
    <box flexDirection="column">
      <text>{message}</text>
      {model.error ? <text fg="#ff7777">{model.error}</text> : null}
    </box>
  ) as ReactElement
}

function renderQuestion(
  model: InteractionViewModel,
  focused: boolean,
): ReactElement {
  const question = model.currentQuestionVM
  if (!question) return (<text>Question unavailable.</text>) as ReactElement
  return (
    <box flexDirection="column">
      <text>
        Question {model.question + 1}/{model.questionCount}
      </text>
      <QuestionInput model={question} focused={focused} />
    </box>
  ) as ReactElement
}
