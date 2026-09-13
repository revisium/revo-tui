import type { AgentSelectionModel } from '../../entities/agent/index.js'
import { observer } from 'mobx-react-lite'
import type { ReactElement } from 'react'
export interface AgentSelectorProps {
  readonly model: AgentSelectionModel
}
export const AgentSelector = observer(function AgentSelector({
  model,
}: AgentSelectorProps) {
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
          {agent.name} id={agent.id} version={agent.version} installation=
          {agent.installationId}
        </text>
      ))}
      {model.selectedAgent
        ? model.options.map(({ option, override }) => (
            <text key={option.id} fg="#8a8a8a">
              {model.selectedOptionIndex ===
              model.options.findIndex(
                (candidate) => candidate.option.id === option.id,
              )
                ? '› '
                : '  '}
              {option.name}:{' '}
              {override === undefined
                ? `default (${String(option.currentValue)})`
                : String(override)}
            </text>
          ))
        : null}
      {model.selectedAgent ? (
        <text fg="#8a8a8a">↑↓ agent ←→ option Space cycle</text>
      ) : null}
    </box>
  )
}) as (props: AgentSelectorProps) => ReactElement
