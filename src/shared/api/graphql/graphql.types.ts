import type { RequestDocument, Variables } from 'graphql-request'

export type GraphqlDocument = RequestDocument
export type GraphqlVariables = Variables
export type GraphqlHeaders = Readonly<Record<string, string>>

export interface GraphqlRequestOptions {
  readonly signal?: AbortSignal
  readonly headers?: GraphqlHeaders
}
