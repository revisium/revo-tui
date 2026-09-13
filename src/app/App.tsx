import { useKeyboard } from '@opentui/react'
import { observer } from 'mobx-react-lite'
import { useViewModel } from '../shared/lib/index.js'
import { KeyboardHelp } from '../shared/ui/index.js'
import type { AppViewModel } from './model/AppViewModel.js'

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
      <KeyboardHelp
        expanded={viewModel.helpVisible}
        hints={viewModel.keyboardHints}
      />
    </box>
  )
})
