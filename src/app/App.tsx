import { useKeyboard } from '@opentui/react'
import { observer } from 'mobx-react-lite'
import { useViewModel } from '../shared/lib/index.js'
import { KeyboardHelp } from '../shared/ui/index.js'
import type { AppViewModel } from './model/AppViewModel.js'
import { AppScreen } from './AppScreen.js'

export interface AppProps {
  readonly createModel: () => AppViewModel
}

export const App = observer(function App({ createModel }: AppProps) {
  const viewModel = useViewModel(createModel)

  useKeyboard((key) =>
    viewModel.handleKey(key.name === 'return' ? 'enter' : key.name, key.ctrl),
  )

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      minHeight={0}
      padding={1}
      gap={1}
      border
      title="Revo TUI"
    >
      <text fg="#77bdfb">{viewModel.clientName}</text>
      <text>{viewModel.connectionStatus}</text>
      <text fg="#8a8a8a">API: {viewModel.endpointLabel}</text>
      <AppScreen model={viewModel} />
      <KeyboardHelp
        expanded={viewModel.helpVisible}
        hints={keyboardHintsFor(viewModel)}
      />
    </box>
  )
})

function keyboardHintsFor(model: AppViewModel): readonly string[] {
  if (model.route === 'list')
    return [
      ...model.keyboardHints,
      'n  New dialogue',
      '↑/↓  Select',
      'r  Refresh',
      'm  More',
    ]
  if (model.route === 'compose')
    return [
      'Enter  Create and send',
      'Escape  Back to list',
      'Tab  Focus fields',
    ]
  return [
    'Escape back',
    'Tab  Prompt / controls / interaction focus',
    '[ / ]  Switch interaction (controls)',
    'r retry  c cancel  o older',
    'PgUp/PgDn  Scroll history (controls)',
    'End  Follow latest (controls)',
  ]
}
