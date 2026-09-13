import { observer } from 'mobx-react-lite'
import type { AppViewModel } from './model/AppViewModel.js'
import { DialogueList } from '../widgets/dialogue-list/index.js'
import { AgentSelector } from '../widgets/agent-selector/index.js'
import { DialoguePage } from '../pages/dialogue/index.js'
import type { ReactElement } from 'react'

export interface AppScreenProps {
  readonly model: AppViewModel
}

export const AppScreen = observer(function AppScreen({
  model,
}: AppScreenProps) {
  if (model.route === 'list')
    return (
      <DialogueList
        model={model.dialogues.list}
        selectedId={model.dialogues.selectedId}
      />
    )
  if (model.route === 'compose')
    return (
      <box flexDirection="column" gap={1}>
        <text fg="#77bdfb">Compose dialogue</text>
        <AgentSelector model={model.compose.selection} />
        <input
          focused={model.compose.focus === 'prompt'}
          placeholder="First prompt"
          value={model.compose.prompt}
          onInput={model.compose.setPrompt}
          onSubmit={() => model.compose.submit().catch(() => undefined)}
        />
        {model.compose.busy ? <text>Creating and sending…</text> : null}
        {model.compose.error ? (
          <text fg="#ff7777">{model.compose.error}</text>
        ) : null}
        {model.compose.statusMessage ? (
          <text>{model.compose.statusMessage}</text>
        ) : null}
      </box>
    )
  if (model.dialogue) return <DialoguePage model={model.dialogue} />
  return <text>Opening dialogue…</text>
}) as (props: AppScreenProps) => ReactElement
