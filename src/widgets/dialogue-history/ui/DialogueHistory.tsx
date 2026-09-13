import { observer } from 'mobx-react-lite'
import type { DialogueHistoryResourceView } from '../../../modules/dialogue-engine/index.js'
import type { ReactElement } from 'react'
export interface DialogueHistoryProps {
  readonly history: DialogueHistoryResourceView
}
export const DialogueHistory = observer(function DialogueHistory({
  history,
}: DialogueHistoryProps) {
  if (history.loading && history.items.length === 0)
    return <text>Loading history…</text>
  return (
    <scrollbox flexGrow={1} scrollY stickyScroll stickyStart="bottom">
      {history.error ? <text fg="#ff7777">{history.error}</text> : null}
      {history.items.length === 0 ? (
        <text>No messages yet.</text>
      ) : (
        history.items.map((item) => (
          <text key={item.id}>
            {item.source}: {item.text}
          </text>
        ))
      )}
      {history.hasMore ? (
        <text>
          {history.loading
            ? 'Loading older messages…'
            : 'Press o for older messages'}
        </text>
      ) : null}
    </scrollbox>
  )
}) as (props: DialogueHistoryProps) => ReactElement
