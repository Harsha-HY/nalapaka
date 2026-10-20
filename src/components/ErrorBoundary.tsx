import React, { Component, ErrorInfo, ReactNode } from 'react';
import { UtensilsCrossed, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/menu';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            We encountered a temporary display issue. Tap below to reload or return to the menu.
          </p>
          <div className="flex gap-3">
            <Button onClick={this.handleReload} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            <Button onClick={this.handleReset} className="gap-2">
              <Home className="h-4 w-4" />
              Go to Menu
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
