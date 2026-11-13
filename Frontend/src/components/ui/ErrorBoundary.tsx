import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-red-500/30 bg-slate-900/90 p-8 text-center space-y-4 backdrop-blur-md">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {this.props.fallbackTitle || 'Component Encountered a Render Warning'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {this.state.error?.message || 'An unexpected rendering issue occurred.'}
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              onClick={this.handleReset}
            >
              Reset Component
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

