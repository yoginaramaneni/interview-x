import React from 'react';
import { motion } from 'framer-motion';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'outline';
  isHoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  isHoverable = false,
  ...props
}) => {
  const styles = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm',
    glass: 'glass-panel shadow-sm',
    outline: 'border border-slate-200 dark:border-slate-800 bg-transparent',
  };

  const CardWrapper = isHoverable ? motion.div : 'div';
  const motionProps = isHoverable
    ? {
        whileHover: { y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' },
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }
    : {};

  return (
    <CardWrapper
      className={`rounded-card overflow-hidden transition-colors ${styles[variant]} ${className}`}
      {...motionProps}
      {...(props as any)}
    >
      {children}
    </CardWrapper>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`p-6 pb-4 flex flex-col gap-1.5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-slate-950 dark:text-slate-50 tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-slate-500 dark:text-slate-400 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`p-6 pt-0 flex items-center border-t border-slate-100 dark:border-slate-800/50 mt-auto ${className}`} {...props}>
    {children}
  </div>
);
