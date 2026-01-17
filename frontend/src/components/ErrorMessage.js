import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorMessage({
  title = 'Error',
  message = 'Something went wrong',
  onRetry,
  showHomeButton = false
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <AlertTriangle className="text-red-600" size={40} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          {title}
        </h2>

        <p className="text-gray-600 text-center mb-6">
          {message}
        </p>

        <div className="flex gap-4 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-fpl-purple hover:bg-opacity-90 text-white font-semibold py-2 px-6 rounded-lg transition-all flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          )}

          {showHomeButton && (
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-all flex items-center gap-2"
            >
              <Home size={18} />
              Go Home
            </button>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            If this problem persists, please check your internet connection or try again later.
          </p>
        </div>
      </div>
    </div>
  );
}
