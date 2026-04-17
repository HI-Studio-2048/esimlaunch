import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled React error:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <h1 className="mb-2 text-2xl font-semibold">Something went wrong</h1>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            An unexpected error occurred. Please refresh the page. If this keeps
            happening, contact support.
          </p>
          <Button onClick={this.handleReload}>Reload page</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
