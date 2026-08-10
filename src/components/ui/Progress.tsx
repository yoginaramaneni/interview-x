import React from 'react';

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  color?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className = '',
  color = 'bg-blue-600',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden h-2 ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number; // width/height in px
  strokeWidth?: number;
  className?: string;
  label?: string;
  colorClass?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  className = '',
  label,
  colorClass = 'text-blue-600',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="text-slate-100 dark:text-slate-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
        />
        {/* Progress track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${colorClass} transition-all duration-500 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
        />
      </svg>
      {/* Inner label */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {label !== undefined ? label : `${Math.round(percentage)}%`}
        </span>
      </div>
    </div>
  );
};
