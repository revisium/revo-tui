import { useKeyboard } from '@opentui/react'
import type { AgentSelectionModel } from '../../entities/agent/index.js'
export interface AgentSelectorProps {
  readonly model: AgentSelectionModel
}
export function AgentSelector({ model }: AgentSelectorProps) {
  useKeyboard((key) => {
    if (key.name === 'up') model.selectNext(-1)
    if (key.name === 'down') model.selectNext(1)
    if (key.name === 'left') model.selectNextOption(-1)
    if (key.name === 'right') model.selectNextOption(1)
  })
  if (model.loading) return <text>Loading agents…</text>
  if (model.error) return <text fg="#ff7777">{model.error}</text>
  if (!model.agents.length) return <text>No agents available.</text>
  return (
    <box flexDirection="column">
      {model.agents.map((agent) => (
        <text
          key={agent.identity}
          fg={
            model.selectedAgent?.identity === agent.identity
              ? '#77bdfb'
              : undefined
          }
        >
          {model.selectedAgent?.identity === agent.identity ? '› ' : '  '}
          {agent.name} ({agent.version})
        </text>
      ))}
      {model.selectedAgent
        ? model.options.map(({ option, override }) => (
            <text key={option.id} fg="#8a8a8a">
              {option.name}:{' '}
              {override === undefined
                ? `default (${String(option.currentValue)})`
                : String(override)}
            </text>
          ))
        : null}
    </box>
  )
}
