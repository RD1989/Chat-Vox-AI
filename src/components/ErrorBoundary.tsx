import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-8 bg-zinc-950 text-white font-mono z-[9999] relative">
          <div className="bg-red-950/50 border border-red-500 p-6 rounded-xl max-w-4xl w-full mx-auto overflow-auto">
            <h2 className="text-2xl font-bold text-red-500 mb-4">React App Crashed (Black Screen Error)</h2>
            <p className="mb-4 text-red-200">Something went wrong during rendering. Please screenshot this and send it to the developer.</p>
            
            <div className="bg-black/50 p-4 rounded mb-4 overflow-x-auto">
              <h3 className="text-lg font-semibold text-rose-400 mb-2">Error Message:</h3>
              <pre className="text-sm text-red-300 whitespace-pre-wrap">{this.state.error?.toString()}</pre>
            </div>
            
            <div className="bg-black/50 p-4 rounded overflow-x-auto">
              <h3 className="text-lg font-semibold text-amber-400 mb-2">Component Stack:</h3>
              <pre className="text-xs text-amber-200 whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
            </div>
            
            <button 
              onClick={() => window.location.href = '/login'}
              className="mt-6 px-4 py-2 bg-white text-black font-bold rounded hover:bg-zinc-200"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
