import { useKeyboard } from '@opentui/react'
import { observer } from 'mobx-react-lite'
import { useViewModel } from '../shared/lib/index.js'
import { KeyboardHelp } from '../shared/ui/index.js'
import type { AppViewModel } from './model/AppViewModel.js'
import { DialogueList } from '../widgets/dialogue-list/index.js'
import { AgentSelector } from '../widgets/agent-selector/index.js'
import { DialogueHistory } from '../widgets/dialogue-history/index.js'

/* eslint-disable sonarjs/no-nested-conditional -- screen selection is a closed route union. */

export interface AppProps {
  readonly createModel: () => AppViewModel
}

// The terminal shell intentionally owns three mutually exclusive screens.
// eslint-disable-next-line sonarjs/cognitive-complexity
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
      ) : viewModel.route === 'compose' ? (
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
          {viewModel.compose.statusMessage ? (
            <text>{viewModel.compose.statusMessage}</text>
          ) : null}
        </box>
      ) : viewModel.dialogue?.dialogue ? (
        <box flexDirection="column" gap={1}>
          <text fg="#77bdfb">
            {viewModel.dialogue.dialogue.snapshot?.summary.title ??
              viewModel.dialogue.id}
          </text>
          <text>
            {viewModel.dialogue.dialogue.snapshot?.summary.status}{' '}
            {viewModel.dialogue.dialogue.snapshot?.summary.progress}
          </text>
          <DialogueHistory history={viewModel.dialogue.dialogue.history} />
          {viewModel.dialogue.pending ? (
            <text>Pending: {viewModel.dialogue.pending.prompt} (r retry)</text>
          ) : null}
          <input
            focused={viewModel.dialogue.focus === 'prompt'}
            value={viewModel.dialogue.draft}
            placeholder="Message"
            onInput={viewModel.dialogue.setDraft}
            onSubmit={() => viewModel.dialogue?.send().catch(() => undefined)}
          />
        </box>
      ) : (
        <text>Opening dialogue…</text>
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
            : viewModel.route === 'compose'
              ? [
                  'Enter  Create and send',
                  'Escape  Back to list',
                  'Tab  Focus fields',
                ]
              : [
                  'Escape back',
                  'Tab prompt/controls',
                  'r retry  c cancel  o older',
                ]
        }
      />
    </box>
  )
})
