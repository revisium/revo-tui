import {
  GraphQLClient as TransportClient,
  type Variables,
} from 'graphql-request'
import type {
  GraphqlDocument,
  GraphqlHeaders,
  GraphqlRequestOptions,
} from './graphql.types.js'

export class GraphqlClient {
  readonly #transport: TransportClient
  readonly #headers: GraphqlHeaders

  public constructor(endpoint: string, headers: GraphqlHeaders = {}) {
    this.assertEndpoint(endpoint)
    this.#transport = new TransportClient(endpoint)
    this.#headers = Object.freeze({ ...headers })
  }

  public request<T, V extends Variables = Variables>(
    document: GraphqlDocument,
    variables?: V,
    options: GraphqlRequestOptions = {},
  ): Promise<T> {
    const requestHeaders = { ...this.#headers, ...options.headers }

    return this.#transport.request<T>({
      document,
      variables,
      requestHeaders,
      signal: options.signal,
    })
  }

  private assertEndpoint(endpoint: string): void {
    let url: URL

    try {
      url = new URL(endpoint)
    } catch {
      throw this.invalidEndpoint()
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw this.invalidEndpoint()
    }
  }

  private invalidEndpoint(): TypeError {
    return new TypeError(
      'GraphQL endpoint must be an absolute HTTP or HTTPS URL.',
    )
  }
}
