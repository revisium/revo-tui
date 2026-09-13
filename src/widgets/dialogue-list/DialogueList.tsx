import type { DialogueListView } from '../../modules/dialogue-engine/index.js'

export interface DialogueListProps {
  readonly model: DialogueListView
  readonly selectedId: string | undefined
}

export function DialogueList({ model, selectedId }: DialogueListProps) {
  if (model.loading && model.items.length === 0) return <text>Loading dialogues…</text>
  if (model.error !== '') return <text fg="#ff7777">{model.error}</text>
  if (model.items.length === 0) return <text>No dialogues yet. Press n to compose.</text>
  return (
    <box flexDirection="column" gap={1}>
      {model.items.map((resource) => {
        const summary = resource.snapshot?.summary
        if (!summary) return <text key={resource.id}>Loading {resource.id}…</text>
        return <text key={resource.id} fg={resource.id === selectedId ? '#77bdfb' : undefined}>
          {resource.id === selectedId ? '› ' : '  '}{summary.title} [{summary.status}] {summary.progress}
        </text>
      })}
      {model.hasMore ? <text fg="#8a8a8a">↓ more available</text> : null}
    </box>
  )
}
