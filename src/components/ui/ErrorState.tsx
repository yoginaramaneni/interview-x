import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-red-100 dark:border-red-950/20 rounded-card bg-red-50/20 dark:bg-red-950/5 ${className}`}>
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 text-red-500 mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-150 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-red-500 dark:text-red-400 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/10 text-red-650 dark:text-red-400">
          Try Again
        </Button>
      )}
    </div>
  );
};
