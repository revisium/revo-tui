export interface GraphqlDialogueOptions {
  readonly endpoint: string
  readonly fetch?: typeof fetch
  readonly headers?: Readonly<Record<string, string>>
}
