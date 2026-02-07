import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
                <AlertTriangle className="text-red-600" size={48} />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
              Oops! Something went wrong
            </h1>

            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              We encountered an unexpected error. Don&apos;t worry, your data is safe.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 overflow-auto">
                <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">Error Details:</h3>
                <pre className="text-xs text-red-800 dark:text-red-300 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="bg-fpl-purple hover:bg-opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center gap-2"
              >
                <RefreshCw size={20} />
                Try Again
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Go Home
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                If this problem persists, please try refreshing the page or clearing your browser cache.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
