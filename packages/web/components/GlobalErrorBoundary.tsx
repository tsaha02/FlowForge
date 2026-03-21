// ============================================
// FlowForge — Global Error Boundary
// ============================================
// Catches unexpected React rendering errors to prevent the entire app
// from crashing to a blank white screen. Shows a fallback UI instead.

'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                We apologize, but an unexpected error occurred. Please try refreshing the page.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-8 p-4 bg-red-50 text-left rounded-lg text-sm font-mono text-red-800 break-words overflow-auto max-h-48 border border-red-100">
                  {this.state.error.message}
                </div>
              )}

              <Button
                size="lg"
                fullWidth
                onClick={() => window.location.reload()}
              >
                <span className="flex items-center justify-center gap-2">
                  <RefreshCcw className="w-4 h-4" />
                  Reload Page
                </span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
