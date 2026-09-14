import { observer } from 'mobx-react-lite'
import { DialogueHistory } from '../../../widgets/dialogue-history/index.js'
import type { DialogueViewModel } from '../model/DialogueViewModel.js'
import { InteractionPanel } from '../../../widgets/interaction-panel/index.js'
import type { ReactElement } from 'react'

export interface DialoguePageProps {
  readonly model: DialogueViewModel
}

export const DialoguePage = observer(function DialoguePage({
  model,
}: DialoguePageProps) {
  const resource = model.dialogue
  if (model.loading) return <text>Opening dialogue…</text>
  if (model.error && resource === undefined)
    return <text fg="#ff7777">{model.error}</text>
  if (resource === undefined) return <text>Dialogue is unavailable.</text>
  const summary = resource.snapshot?.summary
  return (
    <box flexDirection="column" flexGrow={1} gap={1}>
      <text fg="#77bdfb">{summary?.title ?? model.id}</text>
      <text>
        {summary?.status ?? 'unknown'} {summary?.progress ?? ''}
      </text>
      <text fg="#8a8a8a">
        Updates: {resource.connection.status}
        {resource.connection.error ? ` — ${resource.connection.error}` : ''}
      </text>
      <DialogueHistory
        history={resource.history}
        bindScroll={model.bindHistoryScroll}
      />
      {model.interaction ? (
        <InteractionPanel
          model={model.interaction}
          focused={model.focus === 'interaction'}
        />
      ) : null}
      {model.pending ? (
        <text fg="#ffcc66">
          Pending: {model.pending.prompt} — press r to retry
        </text>
      ) : null}
      {model.error ? <text fg="#ff7777">{model.error}</text> : null}
      {model.busy ? <text>Working…</text> : null}
      <input
        focused={model.focus === 'prompt'}
        value={model.draft}
        placeholder="Message"
        onInput={model.setDraft}
        onSubmit={() => model.send().catch(() => undefined)}
      />
    </box>
  )
}) as (props: DialoguePageProps) => ReactElement
