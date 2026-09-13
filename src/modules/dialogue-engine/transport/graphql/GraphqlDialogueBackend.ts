import { GraphQLClient } from 'graphql-request'
import type {
  DialogueInteraction,
  DialogueItem,
  DialogueSummary,
  DialogueTurn,
  JsonValue,
} from '../../contracts/dialogue.types.js'
import type {
  DialogueReadBackend,
  HistoryPage,
} from '../../contracts/backend.types.js'
import type { SnapshotPage } from '../../contracts/page.types.js'
import { DialogueError } from '../../errors/DialogueError.js'
import { readonlyValue } from '../../resources/readonly-value.js'
import {
  getSdk,
  type DialogueInteractionsQuery,
  type DialogueItemFieldsFragment,
  type DialogueSummaryFieldsFragment,
  type DialogueTurnFieldsFragment,
} from './__generated__/graphql-request.js'
import { dialogueRequestError, protocolError } from './graphql-error.js'
import { snapshotPageOf } from './page-mapping.js'
import type { GraphqlDialogueOptions } from './transport.types.js'

const PAGE_SIZE = 50

export class GraphqlDialogueBackend implements DialogueReadBackend {
  private readonly endpoint: string
  private readonly fetchImplementation: typeof fetch
  private readonly headers: Headers

  public constructor(options: GraphqlDialogueOptions) {
    this.endpoint = validateEndpoint(options.endpoint)
    this.fetchImplementation = options.fetch ?? globalThis.fetch
    this.headers = new Headers(options.headers)
  }

  public list(
    after?: string,
    signal?: AbortSignal,
  ): Promise<SnapshotPage<DialogueSummary>> {
    return this.request(async () => {
      const response = await this.sdk(signal).DialogueList({
        first: PAGE_SIZE,
        after,
      })
      return decode(() => snapshotPageOf(response.dialogues, after, summaryOf))
    }, signal)
  }

  public details(id: string, signal?: AbortSignal): Promise<DialogueSummary> {
    return this.request(async () => {
      const response = await this.sdk(signal).DialogueDetails({ id })
      return decode(() => summaryOf(response.dialogue))
    }, signal)
  }

  public history(
    id: string,
    after?: string,
    signal?: AbortSignal,
  ): Promise<HistoryPage> {
    return this.request(async () => {
      const response = await this.sdk(signal).DialogueHistory({
        id,
        first: PAGE_SIZE,
        after,
      })
      const connection = response.dialogueHistory
      return decode(() => ({
        ...snapshotPageOf(connection, after, itemOf),
        observed: connection.observedSignificantSequence ?? null,
      }))
    }, signal)
  }

  public item(
    id: string,
    itemId: string,
    signal?: AbortSignal,
  ): Promise<DialogueItem> {
    return this.request(async () => {
      const response = await this.sdk(signal).DialogueItem({ id, itemId })
      return decode(() => itemOf(response.dialogueHistoryItem))
    }, signal)
  }

  public turns(
    id: string,
    after?: string,
    signal?: AbortSignal,
  ): Promise<SnapshotPage<DialogueTurn>> {
    return this.request(async () => {
      const response = await this.sdk(signal).DialogueTurns({
        id,
        first: PAGE_SIZE,
        after,
      })
      return decode(() => snapshotPageOf(response.dialogueTurns, after, turnOf))
    }, signal)
  }

  public interactions(
    id: string,
    after?: string,
    signal?: AbortSignal,
  ): Promise<SnapshotPage<DialogueInteraction>> {
    return this.request(async () => {
      const response = await this.sdk(signal).DialogueInteractions({
        id,
        first: PAGE_SIZE,
        after,
      })
      return decode(() =>
        snapshotPageOf(response.dialogueInteractions, after, interactionOf),
      )
    }, signal)
  }

  private sdk(signal: AbortSignal | undefined) {
    const fetchImplementation = this.fetchImplementation
    return getSdk(
      new GraphQLClient(this.endpoint, {
        headers: new Headers(this.headers),
        fetch: (input, init) =>
          fetchImplementation(input, {
            ...init,
            signal: requestSignal(signal, init?.signal),
          }),
      }),
    )
  }

  private async request<T>(
    operation: () => Promise<T>,
    signal: AbortSignal | undefined,
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (signal?.aborted) throw signal.reason
      throw dialogueRequestError(error)
    }
  }
}

function summaryOf(value: DialogueSummaryFieldsFragment): DialogueSummary {
  return {
    ...value,
    agentConfiguration: jsonOf(value.agentConfiguration),
  }
}

function itemOf(value: DialogueItemFieldsFragment): DialogueItem {
  return {
    ...value,
    payload: value.payload === undefined ? undefined : jsonOf(value.payload),
  }
}

function turnOf(value: DialogueTurnFieldsFragment): DialogueTurn {
  return {
    ...value,
    outcome: value.outcome === undefined ? undefined : jsonOf(value.outcome),
  }
}

type InteractionNode =
  DialogueInteractionsQuery['dialogueInteractions']['edges'][number]['node']

function interactionOf(value: InteractionNode): DialogueInteraction {
  return {
    ...value,
    request: jsonOf(value.request),
    response: value.response === undefined ? undefined : jsonOf(value.response),
  }
}

function jsonOf(value: unknown): JsonValue {
  try {
    return readonlyValue(value as JsonValue)
  } catch {
    throw protocolError('Dialogue response contains invalid JSON data.')
  }
}

function decode<T>(mapping: () => T): T {
  try {
    return mapping()
  } catch (error) {
    if (error instanceof DialogueError) throw error
    throw protocolError('Dialogue service returned malformed data.')
  }
}

function requestSignal(
  signal: AbortSignal | undefined,
  transportSignal: AbortSignal | null | undefined,
): AbortSignal | undefined {
  if (signal === undefined) return transportSignal ?? undefined
  if (transportSignal == null) return signal
  return AbortSignal.any([signal, transportSignal])
}

function validateEndpoint(endpoint: string): string {
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    throw invalidEndpoint()
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw invalidEndpoint()
  }
  return url.toString()
}

function invalidEndpoint(): TypeError {
  return new TypeError(
    'Dialogue endpoint must be an absolute HTTP or HTTPS URL.',
  )
}
