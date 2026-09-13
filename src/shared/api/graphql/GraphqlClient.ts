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
  readonly #headers: Headers

  public constructor(endpoint: string, headers: GraphqlHeaders = {}) {
    this.#transport = new TransportClient(this.validateEndpoint(endpoint))
    this.#headers = new Headers(headers)
  }

  public request<T, V extends Variables = Variables>(
    document: GraphqlDocument,
    variables?: V,
    options: GraphqlRequestOptions = {},
  ): Promise<T> {
    const requestHeaders = this.mergeHeaders(options.headers)

    return this.#transport.request<T>({
      document,
      variables,
      requestHeaders,
      signal: options.signal,
    })
  }

  private mergeHeaders(headers: GraphqlHeaders | undefined): Headers {
    const mergedHeaders = new Headers(this.#headers)

    for (const [name, value] of Object.entries(headers ?? {})) {
      mergedHeaders.set(name, value)
    }

    return mergedHeaders
  }

  private validateEndpoint(endpoint: string): string {
    let url: URL

    try {
      url = new URL(endpoint)
    } catch {
      throw this.invalidEndpoint()
    }

    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username !== '' ||
      url.password !== ''
    ) {
      throw this.invalidEndpoint()
    }
    url.hash = ''
    return url.toString()
  }

  private invalidEndpoint(): TypeError {
    return new TypeError(
      'GraphQL endpoint must be absolute HTTP or HTTPS without embedded credentials.',
    )
  }
}
