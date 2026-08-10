import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  className = '',
  ...props
}) => {
  const baseStyles = 'animate-pulse bg-slate-200 dark:bg-slate-800';
  
  const variants = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-card bg-white dark:bg-slate-900 flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" className="w-10 h-10" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-1/4" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" />
      <Skeleton variant="text" className="w-5/6" />
    </div>
  </div>
);
