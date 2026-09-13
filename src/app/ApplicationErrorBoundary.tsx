import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface ApplicationErrorBoundaryProps {
  readonly children?: ReactNode
  readonly onError: () => void
}

interface ApplicationErrorBoundaryState {
  readonly failed: boolean
}

export class ApplicationErrorBoundary extends Component<
  ApplicationErrorBoundaryProps,
  ApplicationErrorBoundaryState
> {
  public override state: ApplicationErrorBoundaryState = { failed: false }

  public static getDerivedStateFromError(): ApplicationErrorBoundaryState {
    return { failed: true }
  }

  public override componentDidCatch(_error: Error, _info: ErrorInfo): void {
    this.props.onError()
  }

  public override render(): ReactNode {
    if (this.state.failed) {
      return <text>Revo TUI could not render the interface.</text>
    }

    return this.props.children
  }
}
