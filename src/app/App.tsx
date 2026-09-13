import { useKeyboard } from '@opentui/react'
import { observer } from 'mobx-react-lite'
import { useViewModel } from '../shared/lib/index.js'
import { KeyboardHelp } from '../shared/ui/index.js'
import type { AppViewModel } from './model/AppViewModel.js'
import { DialogueList } from '../widgets/dialogue-list/index.js'
import { AgentSelector } from '../widgets/agent-selector/index.js'

export interface AppProps {
  readonly createModel: () => AppViewModel
}

export const App = observer(function App({ createModel }: AppProps) {
  const viewModel = useViewModel(createModel)

  useKeyboard((key) => viewModel.handleKey(key.name, key.ctrl))

  return (
    <box flexDirection="column" padding={1} gap={1} border title="Revo TUI">
      <text fg="#77bdfb">{viewModel.clientName}</text>
      <text>{viewModel.connectionStatus}</text>
      <text fg="#8a8a8a">API: {viewModel.endpointLabel}</text>
      {viewModel.route === 'list' ? (
        <DialogueList
          model={viewModel.dialogues.list}
          selectedId={viewModel.dialogues.selectedId}
        />
      ) : (
        <box flexDirection="column" gap={1}>
          <text fg="#77bdfb">Compose dialogue</text>
          <AgentSelector model={viewModel.compose.selection} />
          <input
            focused={viewModel.compose.focus === 'prompt'}
            placeholder="First prompt"
            value={viewModel.compose.prompt}
            onInput={viewModel.compose.setPrompt}
            onSubmit={() => viewModel.compose.submit().catch(() => undefined)}
          />
          {viewModel.compose.busy ? <text>Creating and sending…</text> : null}
          {viewModel.compose.error ? (
            <text fg="#ff7777">{viewModel.compose.error}</text>
          ) : null}
          {viewModel.compose.pendingCommandId || viewModel.compose.uncertain ? (
            <text>
              Delivery uncertain. Press y to retry exact prompt, x to reset.
            </text>
          ) : null}
        </box>
      )}
      <KeyboardHelp
        expanded={viewModel.helpVisible}
        hints={
          viewModel.route === 'list'
            ? [
                ...viewModel.keyboardHints,
                'n  New dialogue',
                '↑/↓  Select',
                'r  Refresh',
                'm  More',
              ]
            : [
                'Enter  Create and send',
                'Escape  Back to list',
                'Tab  Focus fields',
              ]
        }
      />
    </box>
  )
})
