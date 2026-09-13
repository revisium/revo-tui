export class SseHeartbeat {
  private timer: ReturnType<typeof setTimeout> | undefined
  private disposed = false

  public constructor(
    private readonly fetchImplementation: typeof fetch,
    private readonly timeoutMs: number,
    private readonly onTimeout: () => void,
  ) {}

  public readonly fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const response = await this.fetchImplementation(input, init)

    if (!this.isEventStream(response, init) || response.body === null) {
      return response
    }

    this.touch()
    const recordHeartbeat = (): void => this.touch()
    const body = response.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          recordHeartbeat()
          controller.enqueue(chunk)
        },
      }),
    )
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  }

  public dispose(): void {
    if (this.disposed) return
    this.disposed = true
    clearTimeout(this.timer)
    this.timer = undefined
  }

  private touch(): void {
    if (this.disposed) return
    clearTimeout(this.timer)
    this.timer = setTimeout(this.onTimeout, this.timeoutMs)
  }

  private isEventStream(response: Response, init?: RequestInit): boolean {
    return (
      response.ok &&
      (init?.method ?? 'GET') === 'GET' &&
      response.headers
        .get('content-type')
        ?.toLowerCase()
        .startsWith('text/event-stream') === true
    )
  }
}
