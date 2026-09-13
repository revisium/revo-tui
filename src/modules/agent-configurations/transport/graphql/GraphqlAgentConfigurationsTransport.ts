import { GraphQLClient } from 'graphql-request'
import {
  GraphqlSubscriptions,
  type SubscriptionOptions,
} from '../../../graphql-subscriptions/index.js'
import type {
  AgentConfigurationsSubscriptionOptions,
  AgentConfigurationsTransport,
} from '../../contracts/transport.js'
import type {
  AgentConfigurationValue,
  AgentConfigurationsSnapshot,
  AgentConfigurationsStatus,
  AgentDefinitionPage,
} from '../../contracts/types.js'
import { AgentConfigurationsDocument } from './__generated__/typed-document-nodes.js'
import {
  AgentConfigurationsStatus as GeneratedStatus,
  getSdk,
  type AgentConfigurationDefinitionsQuery,
  type AgentConfigurationsSubscription,
} from './__generated__/graphql-request.js'

const PAGE_SIZE = 50

export interface GraphqlAgentConfigurationsOptions {
  readonly endpoint: string
  readonly headers?: Readonly<Record<string, string>>
  readonly fetch?: typeof fetch
}

export class GraphqlAgentConfigurationsTransport implements AgentConfigurationsTransport {
  private readonly endpoint: string
  private readonly headers: Headers
  private readonly fetchImplementation: typeof fetch

  public constructor(
    options: GraphqlAgentConfigurationsOptions,
    private readonly subscriptions: GraphqlSubscriptions,
  ) {
    this.endpoint = validateEndpoint(options.endpoint)
    this.headers = new Headers(options.headers)
    this.fetchImplementation = options.fetch ?? globalThis.fetch
  }

  public async definitions(
    signal: AbortSignal,
    after?: string,
  ): Promise<AgentDefinitionPage> {
    const response = await getSdk(
      this.client(signal),
    ).AgentConfigurationDefinitions({
      first: PAGE_SIZE,
      after,
    })
    return definitionPageOf(response, after)
  }

  public subscribe(options: AgentConfigurationsSubscriptionOptions) {
    const subscriptionOptions: SubscriptionOptions<
      AgentConfigurationsSubscription,
      Record<string, never>
    > = {
      signal: options.signal,
      prepare: async (signal) => {
        await options.prepare(signal)
        return {}
      },
      next: (data, signal) =>
        options.next(snapshotOf(data.agentConfigurations), signal),
      changed: options.changed,
    }
    return this.subscriptions.subscribe(
      AgentConfigurationsDocument,
      subscriptionOptions,
    )
  }

  private client(signal: AbortSignal): GraphQLClient {
    return new GraphQLClient(this.endpoint, {
      headers: this.headers,
      fetch: async (input, init) => {
        const requestSignal =
          init?.signal == null ? signal : AbortSignal.any([signal, init.signal])
        return this.fetchImplementation(input, {
          ...init,
          signal: requestSignal,
        })
      },
    })
  }
}

function definitionPageOf(
  response: AgentConfigurationDefinitionsQuery,
  after: string | undefined,
): AgentDefinitionPage {
  const page = response.agentDefinitions
  const next = page.pageInfo.endCursor ?? undefined

  if (
    page.pageInfo.hasNextPage &&
    (next === undefined || next.trim() === '' || next === after)
  ) {
    throw new Error('Agent definition pagination returned an invalid cursor.')
  }

  return {
    items: page.edges.map(({ node }) => ({
      id: node.agent.id,
      version: node.agent.version,
      installationId: node.agent.installationId,
      name: node.displayName,
      description: node.description ?? '',
    })),
    next: page.pageInfo.hasNextPage ? next : undefined,
  }
}

function snapshotOf(
  value: AgentConfigurationsSubscription['agentConfigurations'],
): AgentConfigurationsSnapshot {
  return {
    status: statusOf(value.status),
    catalogs: value.catalogs.map((catalog) => ({
      ...catalog,
      model: catalog.model
        ? {
            ...catalog.model,
            providers: catalog.model.providers.map((provider) => ({
              ...provider,
              models: provider.models.map(valueOf),
            })),
            sessionAvailable: catalog.model.sessionAvailable.map(valueOf),
          }
        : catalog.model,
      options: catalog.options.map((option) =>
        option.__typename === 'AgentConfigurationBooleanModel'
          ? {
              kind: 'boolean' as const,
              category: option.category,
              currentValue: option.booleanValue,
              description: option.description,
              id: option.id,
              name: option.name,
              type: option.type,
            }
          : {
              kind: 'select' as const,
              category: option.category,
              currentValue: option.selectValue,
              description: option.description,
              id: option.id,
              name: option.name,
              type: option.type,
              values: option.values.map(valueOf),
            },
      ),
    })),
  }
}

function valueOf(value: {
  readonly description?: string | null
  readonly group?: { readonly id: string; readonly name: string } | null
  readonly name: string
  readonly value: string
}): AgentConfigurationValue {
  return { ...value, description: value.description ?? undefined }
}

function statusOf(status: GeneratedStatus): AgentConfigurationsStatus {
  switch (status) {
    case GeneratedStatus.Loading:
      return 'LOADING'
    case GeneratedStatus.NotInitialized:
      return 'NOT_INITIALIZED'
    case GeneratedStatus.Ready:
      return 'READY'
  }
}

function validateEndpoint(endpoint: string): string {
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    throw invalidEndpoint()
  }
  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username !== '' ||
    url.password !== ''
  ) {
    throw invalidEndpoint()
  }
  url.hash = ''
  return url.toString()
}

function invalidEndpoint(): TypeError {
  return new TypeError(
    'Agent configuration endpoint must be absolute HTTP or HTTPS without embedded credentials.',
  )
}
