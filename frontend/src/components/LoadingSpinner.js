import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({
  size = 'md',
  fullScreen = false,
  message = 'Loading...'
}) {
  const sizes = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64
  };

  const spinnerSize = sizes[size] || sizes.md;

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2
        className="animate-spin text-fpl-purple dark:text-fpl-green"
        size={spinnerSize}
      />
      {message && (
        <p className="text-gray-600 dark:text-gray-300 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}
