import type { DialogueListView } from '../../modules/dialogue-engine/index.js'
import { observer } from 'mobx-react-lite'
import type { ReactElement } from 'react'

export interface DialogueListProps {
  readonly model: DialogueListView
  readonly selectedId: string | undefined
}

export const DialogueList = observer(function DialogueList({
  model,
  selectedId,
}: DialogueListProps) {
  if (model.loading && model.items.length === 0)
    return (
      <box flexDirection="column">
        <text>Loading dialogues…</text>
        <text fg="#8a8a8a">{connectionText(model)}</text>
      </box>
    )
  if (model.error !== '' && model.items.length === 0)
    return (
      <box flexDirection="column">
        <text fg="#ff7777">{model.error}</text>
        <text fg="#8a8a8a">{connectionText(model)}</text>
      </box>
    )
  if (model.items.length === 0)
    return (
      <box flexDirection="column">
        <text>No dialogues yet. Press n to compose.</text>
        <text fg="#8a8a8a">{connectionText(model)}</text>
      </box>
    )
  return (
    <box flexDirection="column" gap={1}>
      {model.items.map((resource) => {
        const summary = resource.snapshot?.summary
        if (!summary)
          return <text key={resource.id}>Loading {resource.id}…</text>
        return (
          <text
            key={resource.id}
            fg={resource.id === selectedId ? '#77bdfb' : undefined}
          >
            {resource.id === selectedId ? '› ' : '  '}
            {summary.title} [{summary.status}] {summary.progress}
          </text>
        )
      })}
      {model.error !== '' ? <text fg="#ff7777">{model.error}</text> : null}
      <text fg="#8a8a8a">{connectionText(model)}</text>
      {model.hasMore ? <text fg="#8a8a8a">↓ more available</text> : null}
    </box>
  )
}) as (props: DialogueListProps) => ReactElement

function connectionText(model: DialogueListView): string {
  const error = model.connection.error
  const suffix = error === '' ? '' : ` — ${error}`
  return `Updates: ${model.connection.status}${suffix}`
}
