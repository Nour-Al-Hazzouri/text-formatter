'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { PenTool, Edit3, Loader2 } from 'lucide-react';

const loadingVariants = cva(
  'flex items-center justify-center',
  {
    variants: {
      size: {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
      },
      variant: {
        spinner: '',
        pen: '',
        pencil: '',
        dots: '',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'pen',
    },
  }
);

interface LoadingSpinnerProps extends VariantProps<typeof loadingVariants> {
  className?: string;
  text?: string;
}

function LoadingSpinner({ 
  size, 
  variant = 'pen', 
  className, 
  text 
}: LoadingSpinnerProps) {
  const renderIcon = () => {
    const iconClassName = cn(
      loadingVariants({ size }),
      'text-orange-600 animate-spin'
    );

    switch (variant) {
      case 'pen':
        return <PenTool className={cn(iconClassName, 'animate-pen-write')} />;
      case 'pencil':
        return <Edit3 className={cn(iconClassName, 'animate-pen-write')} />;
      case 'spinner':
        return <Loader2 className={iconClassName} />;
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
          </div>
        );
      default:
        return <PenTool className={cn(iconClassName, 'animate-pen-write')} />;
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      {renderIcon()}
      {text && (
        <p className="text-sm text-orange-600 font-content animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

// Processing indicator with notebook-style progress
function ProcessingIndicator({ 
  progress = 0, 
  text = 'Processing...', 
  className 
}: {
  progress?: number;
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-4 p-6', className)}>
      <LoadingSpinner variant="pen" size="lg" />
      
      {/* Progress bar with paper texture */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-content text-orange-700">{text}</span>
          <span className="text-sm font-mono text-orange-600">{Math.round(progress)}%</span>
        </div>
        
        <div className="w-full bg-orange-100 rounded-full h-2 shadow-inner border border-orange-200">
          <div 
            className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-300 ease-out shadow-sm"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Skeleton loader with paper texture
function PaperSkeleton({ 
  className,
  lines = 3,
  showTitle = true 
}: {
  className?: string;
  lines?: number;
  showTitle?: boolean;
}) {
  return (
    <div className={cn('animate-pulse space-y-4 p-4', className)}>
      {showTitle && (
        <div className="h-6 bg-orange-200 rounded-md w-3/4 shadow-paper"></div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            className={cn(
              'h-4 bg-orange-100 rounded shadow-paper',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </div>
    </div>
  );
}

// Typing animation for text
function TypingAnimation({ 
  text, 
  speed = 50, 
  className 
}: {
  text: string;
  speed?: number;
  className?: string;
}) {
  const [displayText, setDisplayText] = React.useState('');

  React.useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(prev => prev + text[index]);
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span className={cn('font-content text-orange-900', className)}>
      {displayText}
      <span className="animate-pulse text-orange-500">|</span>
    </span>
  );
}

export {
  LoadingSpinner,
  ProcessingIndicator,
  PaperSkeleton,
  TypingAnimation,
  loadingVariants,
};
