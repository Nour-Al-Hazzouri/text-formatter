/**
 * Progress Component - Modern progress bar with orange theme
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const progressVariants = cva(
  'relative h-2 w-full overflow-hidden rounded-full bg-gray-100',
  {
    variants: {
      variant: {
        default: 'bg-gray-100',
        orange: 'bg-orange-100',
      },
      size: {
        default: 'h-2',
        sm: 'h-1.5',
        lg: 'h-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const progressBarVariants = cva(
  'h-full w-full flex-1 bg-gradient-to-r transition-all duration-500 ease-out',
  {
    variants: {
      variant: {
        default: 'from-orange-400 to-orange-500',
        orange: 'from-orange-400 to-orange-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
  showLabel?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, variant, size, value = 0, max = 100, showLabel = false, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className="w-full">
        {showLabel && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-900">{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          ref={ref}
          className={cn(progressVariants({ variant, size, className }))}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${Math.round(percentage)}%`}
          {...props}
        >
          <div
            className={cn(progressBarVariants({ variant }))}
            style={{ 
              transform: `translateX(-${100 - percentage}%)`,
              willChange: 'transform'
            }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress, progressVariants };
