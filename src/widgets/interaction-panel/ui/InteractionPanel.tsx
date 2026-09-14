import type { ScrollBoxRenderable } from '@opentui/core'
import { observer } from 'mobx-react-lite'
import type { InteractionViewModel } from '../../../features/respond-interaction/index.js'
import { useCallback, useEffect, useRef, type ReactElement } from 'react'
import { QuestionInput } from './QuestionInput.js'

const FOCUSED_GROW = 3
const UNFOCUSED_GROW = 2
export interface InteractionPanelProps {
  readonly model: InteractionViewModel
  readonly focused: boolean
}
export const InteractionPanel = observer(function InteractionPanel({
  model,
  focused,
}: InteractionPanelProps) {
  const definition = model.definition
  const scrollRef = useRef<ScrollBoxRenderable>(null)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const activeControlRevision = model.activeControlRevision
  const revealActiveControl = useCallback(() => {
    clearTimeout(revealTimeoutRef.current)
    revealTimeoutRef.current = setTimeout(() => {
      scrollRef.current?.scrollChildIntoView(model.activeControlViewId)
    })
  }, [model.activeControlViewId])
  useEffect(() => {
    revealActiveControl()
    return () => clearTimeout(revealTimeoutRef.current)
  }, [activeControlRevision, focused, revealActiveControl])
  const permissionOptions =
    definition?.kind === 'permission'
      ? model.visibleOptions.map(({ option, index }) => (
          <text
            key={option.value}
            id={
              index === model.selected ? model.activeControlViewId : undefined
            }
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
    <box
      flexDirection="column"
      border
      title={model.panelTitle}
      flexBasis={0}
      flexGrow={focused ? FOCUSED_GROW : UNFOCUSED_GROW}
      minHeight={0}
      marginBottom={1}
    >
      {model.visibleError ? (
        <text flexShrink={0} fg="#ff7777">
          {model.visibleError}
        </text>
      ) : null}
      <scrollbox
        ref={scrollRef}
        flexGrow={1}
        scrollY
        onSizeChange={revealActiveControl}
      >
        {permissionOptions}
        {definition.kind === 'input' ? questionContent : null}
      </scrollbox>
      <text fg="#8a8a8a">{model.keyboardHint}</text>
    </box>
  )
}) as (props: InteractionPanelProps) => ReactElement

function PendingInteraction({ model }: InteractionPanelProps): ReactElement {
  return (
    <box flexDirection="column">
      <text>{model.pendingMessage}</text>
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
      <QuestionInput
        key={`${model.id}:${question.question?.id ?? 'missing'}`}
        interactionId={model.id}
        activeControlViewId={model.activeControlViewId}
        model={question}
        focused={focused}
      />
    </box>
  ) as ReactElement
}
