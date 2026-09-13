export interface KeyboardHelpProps {
  readonly expanded: boolean
  readonly hints: readonly string[]
}

export function KeyboardHelp({ expanded, hints }: KeyboardHelpProps) {
  if (!expanded) {
    return <text fg="#8a8a8a">Press ? for help</text>
  }

  return (
    <box flexDirection="column" border title="Keyboard">
      {hints.map((hint) => (
        <text key={hint}>{hint}</text>
      ))}
    </box>
  )
}
