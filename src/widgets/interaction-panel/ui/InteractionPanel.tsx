import { observer } from 'mobx-react-lite'
import type { InteractionViewModel } from '../../../features/respond-interaction/index.js'
import type { ReactElement } from 'react'
import { QuestionInput } from './QuestionInput.js'

const OPTION_WINDOW = 5
const OPTION_WINDOW_BEFORE = 2
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
      ? visiblePermissionOptions(definition.options, model.selected).map(
          ({ option, index }) => (
            <text
              key={option.value}
              fg={focused && index === model.selected ? '#77bdfb' : undefined}
            >
              {focused && index === model.selected ? '› ' : '  '}
              {option.label} ({option.value})
            </text>
          ),
        )
      : null
  const questionContent = renderQuestion(model, focused)
  if (!definition) return <PendingInteraction model={model} focused={focused} />
  return (
    <box flexDirection="column" border title={definition.title} height={12}>
      <scrollbox flexGrow={1} scrollY>
        {permissionOptions}
        {definition.kind === 'input' ? questionContent : null}
        {model.error ? <text fg="#ff7777">{model.error}</text> : null}
      </scrollbox>
      <text>State: {state}</text>
      <text fg="#8a8a8a">
        Tab focus · [ ] interaction (controls) · {interactionHint(model)}
      </text>
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
      <QuestionInput
        key={`${model.id}:${question.question?.id ?? 'missing'}`}
        interactionId={model.id}
        model={question}
        focused={focused}
      />
    </box>
  ) as ReactElement
}

function interactionHint(model: InteractionViewModel): string {
  const definition = model.definition
  if (definition?.kind === 'permission')
    return '↑↓/←→ select · Space/Enter choose · Ctrl-D decline · Ctrl-R retry'
  const question = model.currentQuestionVM?.question
  let questionHint = 'type answer'
  if (question?.input === 'select') {
    questionHint = '↑↓/←→ option · Space choose'
    if (question.allowOther)
      questionHint += model.currentQuestionVM?.customOtherActive
        ? ' · type Other · Enter add'
        : ' · Ctrl-O Other'
  }
  return `Ctrl-↑↓ question · ${questionHint} · Ctrl-S submit · Ctrl-D decline · Ctrl-R retry`
}

function visiblePermissionOptions<T>(
  options: readonly T[],
  cursor: number,
): readonly { readonly option: T; readonly index: number }[] {
  const start = Math.max(
    0,
    Math.min(cursor - OPTION_WINDOW_BEFORE, options.length - OPTION_WINDOW),
  )
  return options.slice(start, start + OPTION_WINDOW).map((option, offset) => ({
    option,
    index: start + offset,
  }))
}
