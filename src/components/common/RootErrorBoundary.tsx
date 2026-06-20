import { Component, type ErrorInfo, type ReactNode } from "react"

type Props = { children: ReactNode }

type State = { error: Error | null }

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error:", error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
          <div className="max-w-lg rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-[16px] font-semibold text-red-700">
              Something went wrong
            </h1>
            <p className="mt-2 text-[13px] text-gray-600">
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.assign("/templates")}
              className="mt-4 rounded bg-blue-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-blue-700"
            >
              Back to templates
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
