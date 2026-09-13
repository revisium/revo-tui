import {
  CliRenderEvents,
  createCliRenderer,
  type CliRenderer,
  type CliRendererErrorEvent,
} from '@opentui/core'
import { createRoot, type Root } from '@opentui/react'
import { createElement } from 'react'
import { App } from '../App.js'
import { ApplicationErrorBoundary } from '../ApplicationErrorBoundary.js'
import type { AppViewModel } from '../model/AppViewModel.js'

const EXIT_SUCCESS = 0
const APP_SIGNALS = ['SIGHUP', 'SIGINT', 'SIGTERM'] as const

type AppSignal = (typeof APP_SIGNALS)[number]
export type RendererFactory = typeof createCliRenderer
export type RootFactory = typeof createRoot

export interface ApplicationLifecycleOptions {
  readonly createViewModel: () => AppViewModel
  readonly createRenderer: RendererFactory
  readonly createRoot: RootFactory
  readonly initializeServices: () => Promise<void>
  readonly disposeServices: () => Promise<void>
}

export class ApplicationLifecycle {
  readonly #createViewModel: () => AppViewModel
  readonly #createRenderer: RendererFactory
  readonly #createRoot: RootFactory
  readonly #initializeServices: () => Promise<void>
  readonly #disposeServices: () => Promise<void>
  readonly #signalHandlers = new Map<AppSignal, () => void>()
  #renderer: CliRenderer | undefined
  #root: Root | undefined
  #resolve: ((code: number) => void) | undefined
  #reject: ((error: unknown) => void) | undefined
  #startup: Promise<void> | undefined
  #rendererDestroyed = false
  #servicesDisposed = false
  #closing = false
  #started = false

  public constructor(options: ApplicationLifecycleOptions) {
    this.#createViewModel = options.createViewModel
    this.#createRenderer = options.createRenderer
    this.#createRoot = options.createRoot
    this.#initializeServices = options.initializeServices
    this.#disposeServices = options.disposeServices
  }

  public run(): Promise<number> {
    if (this.#started) {
      return Promise.reject(
        new Error('The Revo TUI application is already running.'),
      )
    }

    this.#started = true
    const completion = new Promise<number>((resolve, reject) => {
      this.#resolve = resolve
      this.#reject = reject
    })
    this.bindSignals()
    this.#startup = this.startRenderer()
    this.#startup.catch(this.onStartupError)
    return completion
  }

  public quit(): void {
    this.close(EXIT_SUCCESS)
  }

  private async startRenderer(): Promise<void> {
    await this.#initializeServices()
    const renderer = await this.#createRenderer({
      clearOnShutdown: false,
      exitOnCtrlC: false,
      exitSignals: [],
    })

    if (this.#closing) {
      renderer.destroy()
      return
    }

    this.#renderer = renderer
    this.bindRenderer(renderer)

    const root = this.#createRoot(renderer)
    this.#root = root
    const app = createElement(App, { createModel: this.#createViewModel })
    const boundary = createElement(
      ApplicationErrorBoundary,
      { onError: this.onReactError },
      app,
    )
    root.render(boundary)
  }

  private bindRenderer(renderer: CliRenderer): void {
    renderer.on(CliRenderEvents.RENDER_ERROR, this.onRenderError)
    renderer.on(CliRenderEvents.DESTROY, this.onRendererDestroy)
  }

  private bindSignals(): void {
    for (const signal of APP_SIGNALS) {
      const handler = (): void => this.onSignal()
      this.#signalHandlers.set(signal, handler)
      process.on(signal, handler)
    }
  }

  private readonly onRenderError = (event: CliRendererErrorEvent): void => {
    this.fail(event.error)
  }

  private readonly onStartupError = (error: unknown): void => {
    this.fail(error)
  }

  private readonly onReactError = (): void => {
    this.fail(new Error('The Revo TUI interface failed to render.'))
  }

  private readonly onRendererDestroy = (): void => {
    this.#rendererDestroyed = true
    this.close(EXIT_SUCCESS)
  }

  private onSignal(): void {
    this.quit()
  }

  private fail(error: unknown): void {
    this.close(undefined, error)
  }

  private close(code?: number, error?: unknown): void {
    if (this.#closing) {
      return
    }

    this.#closing = true
    this.unbindSignals()
    this.finishClose(code, error)
  }

  private async finishClose(code?: number, error?: unknown): Promise<void> {
    let startupError: unknown

    try {
      await this.#startup
    } catch (caughtError) {
      startupError = caughtError
    }

    const cleanupError = await this.releaseResources()
    const finalError = error ?? startupError ?? cleanupError

    if (finalError !== undefined) {
      this.#reject?.(finalError)
    } else {
      this.#resolve?.(code ?? EXIT_SUCCESS)
    }
  }

  private async releaseResources(): Promise<unknown> {
    const renderer = this.#renderer
    renderer?.off(CliRenderEvents.RENDER_ERROR, this.onRenderError)
    renderer?.off(CliRenderEvents.DESTROY, this.onRendererDestroy)

    let cleanupError: unknown

    try {
      if (!this.#servicesDisposed) {
        this.#servicesDisposed = true
        await this.#disposeServices()
      }
    } catch (error) {
      cleanupError = error
    }

    try {
      this.#root?.unmount()
    } catch (error) {
      cleanupError ??= error
    }

    try {
      if (!this.#rendererDestroyed) {
        renderer?.destroy()
      }
    } catch (error) {
      cleanupError ??= error
    }

    this.#root = undefined
    this.#renderer = undefined
    return cleanupError
  }

  private unbindSignals(): void {
    for (const signal of APP_SIGNALS) {
      const handler = this.#signalHandlers.get(signal)

      if (handler) {
        process.off(signal, handler)
      }
    }

    this.#signalHandlers.clear()
  }
}

export const applicationFactories = {
  createRenderer: createCliRenderer,
  createRoot,
} as const
