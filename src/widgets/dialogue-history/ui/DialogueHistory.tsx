import { observer } from 'mobx-react-lite'
import type { DialogueHistoryResourceView } from '../../../modules/dialogue-engine/index.js'
import type { ReactElement } from 'react'
export interface HistoryScrollPort {
  stickyScroll: boolean
  readonly scrollHeight: number
  scrollBy(delta: number, unit: 'viewport'): void
  scrollTo(position: number): void
}
export interface DialogueHistoryProps {
  readonly history: DialogueHistoryResourceView
  readonly bindScroll: (scroll: HistoryScrollPort | null) => void
}
export const DialogueHistory = observer(function DialogueHistory({
  history,
  bindScroll,
}: DialogueHistoryProps) {
  if (history.loading && history.items.length === 0)
    return <text>Loading history…</text>
  return (
    <scrollbox
      ref={bindScroll}
      flexBasis={0}
      flexGrow={1}
      minHeight={0}
      scrollY
      stickyScroll
      stickyStart="bottom"
    >
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
