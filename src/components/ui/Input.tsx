import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-4 text-slate-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={`w-full bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 rounded-input text-sm h-[44px]
              ${leftIcon ? 'pl-11' : 'pl-4'}
              ${rightIcon ? 'pr-11' : 'pr-4'}
              ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800'}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 text-slate-400 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        )}
        {!error && helperText && (
          <span className="text-xs text-slate-500 dark:text-slate-400">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
