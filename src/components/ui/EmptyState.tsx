import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <Inbox className="w-10 h-10 text-slate-400 dark:text-slate-500" />,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-card bg-slate-50/50 dark:bg-slate-900/30 ${className}`}>
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/80 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-150 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};
