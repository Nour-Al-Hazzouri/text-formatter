'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const headingVariants = cva(
  'text-orange-800 font-heading leading-tight tracking-tight',
  {
    variants: {
      size: {
        h1: 'text-6xl font-bold',
        h2: 'text-4xl font-semibold',
        h3: 'text-3xl font-semibold',
        h4: 'text-2xl font-medium',
        h5: 'text-xl font-medium',
        h6: 'text-lg font-medium',
      },
      style: {
        handwritten: 'font-handwritten',
        clean: 'font-heading',
        serif: 'font-content',
      },
    },
    defaultVariants: {
      size: 'h2',
      style: 'handwritten',
    },
  }
);

const paragraphVariants = cva(
  'text-orange-900 font-content leading-relaxed',
  {
    variants: {
      size: {
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
      },
      variant: {
        default: 'text-orange-900',
        muted: 'text-orange-600',
        subtle: 'text-orange-500',
      },
    },
    defaultVariants: {
      size: 'base',
      variant: 'default',
    },
  }
);

const codeVariants = cva(
  'font-mono bg-orange-50 text-orange-800 rounded-md px-2 py-1 border border-orange-200',
  {
    variants: {
      size: {
        sm: 'text-xs',
        base: 'text-sm',
        lg: 'text-base',
      },
      variant: {
        inline: 'inline-block',
        block: 'block p-4 whitespace-pre-wrap overflow-x-auto',
      },
    },
    defaultVariants: {
      size: 'base',
      variant: 'inline',
    },
  }
);

interface HeadingProps extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'style'>,
  VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

function Heading({ 
  className, 
  size = 'h2', 
  style, 
  as, 
  ...props 
}: HeadingProps) {
  const Comp = as || (size as React.ElementType) || 'h2';
  
  return (
    <Comp
      className={cn(headingVariants({ size, style }), className)}
      {...props}
    />
  );
}

interface ParagraphProps extends React.HTMLAttributes<HTMLParagraphElement>,
  VariantProps<typeof paragraphVariants> {}

function Paragraph({ 
  className, 
  size, 
  variant, 
  ...props 
}: ParagraphProps) {
  return (
    <p
      className={cn(paragraphVariants({ size, variant }), className)}
      {...props}
    />
  );
}

interface CodeProps extends React.HTMLAttributes<HTMLElement>,
  VariantProps<typeof codeVariants> {}

function Code({ 
  className, 
  size, 
  variant, 
  ...props 
}: CodeProps) {
  const Comp = variant === 'block' ? 'pre' : 'code';
  
  return (
    <Comp
      className={cn(codeVariants({ size, variant }), className)}
      {...props}
    />
  );
}

// Blockquote component for highlighting insights and quotes
function Blockquote({ className, ...props }: React.HTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      className={cn(
        'border-l-4 border-orange-400 bg-orange-50 pl-6 py-4 italic text-orange-800 font-content my-4',
        className
      )}
      {...props}
    />
  );
}

// List components for formatted content
function List({ 
  className, 
  ordered = false, 
  ...props 
}: React.HTMLAttributes<HTMLUListElement | HTMLOListElement> & {
  ordered?: boolean;
}) {
  const Comp = ordered ? 'ol' : 'ul';
  
  return (
    <Comp
      className={cn(
        'text-orange-900 font-content space-y-2',
        ordered ? 'list-decimal list-inside' : 'list-disc list-inside',
        className
      )}
      {...props}
    />
  );
}

function ListItem({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      className={cn('leading-relaxed', className)}
      {...props}
    />
  );
}

export {
  Heading,
  Paragraph,
  Code,
  Blockquote,
  List,
  ListItem,
  headingVariants,
  paragraphVariants,
  codeVariants,
};
