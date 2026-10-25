import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled studio rendering error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.hash = 'landing';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf8f5] dark:bg-[#121110] text-stone-900 dark:text-stone-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle size={30} />
            </div>

            <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white font-serif">Studio Render Interrupted</h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
              An unexpected display error occurred while rendering the spatial canvas. Your saved projects and credits remain safe in cloud storage.
            </p>

            {this.state.error && (
              <div className="mt-4 p-3 rounded-xl bg-stone-100 dark:bg-stone-800/60 font-mono text-[11px] text-stone-600 dark:text-stone-400 text-left overflow-x-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-brand-500/25 transition-all"
              >
                <RefreshCw size={15} />
                <span>Reload Application</span>
              </button>

              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.hash = 'landing';
                }}
                className="w-full py-2.5 text-xs font-bold text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
