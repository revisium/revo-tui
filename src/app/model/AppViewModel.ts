import { makeAutoObservable } from 'mobx'

export interface AppViewModelOptions {
  readonly apiUrl: string
  readonly clientName: string
}

export class AppViewModel {
  public helpVisible = false
  public mounted = false

  readonly #options: AppViewModelOptions
  readonly #requestExit: () => void

  public constructor(options: AppViewModelOptions, requestExit: () => void) {
    this.#options = options
    this.#requestExit = requestExit
    makeAutoObservable(this)
  }

  public get clientName(): string {
    return this.#options.clientName
  }

  public get connectionStatus(): string {
    return this.mounted
      ? 'Not connected — transport is not configured yet.'
      : 'Starting terminal client…'
  }

  public get endpointLabel(): string {
    const endpoint = new URL(this.#options.apiUrl)
    endpoint.username = ''
    endpoint.password = ''
    endpoint.search = ''
    endpoint.hash = ''
    return endpoint.toString()
  }

  public get keyboardHints(): readonly string[] {
    return ['? / h  Hide help', 'q / Escape  Quit']
  }

  public mount(): void {
    this.mounted = true
  }

  public dispose(): void {
    this.mounted = false
  }

  public handleKey(name: string, ctrl: boolean): void {
    if (name === '?' || name === 'h') {
      this.helpVisible = !this.helpVisible
      return
    }

    if (name === 'q' || name === 'escape' || (ctrl && name === 'c')) {
      this.#requestExit()
    }
  }
}
