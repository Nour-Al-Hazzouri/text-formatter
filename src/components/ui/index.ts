/**
 * UI Components Index
 * 
 * Central export file for all UI components following shadcn/ui patterns
 * with custom modern orange theme customizations for the text formatter
 */

// Core shadcn/ui components (customized)
export { Button, buttonVariants } from './button';
export { Input } from './input';
export { Textarea } from './textarea';
export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardAction, 
  CardDescription, 
  CardContent 
} from './card';
export { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup,
  SelectLabel
} from './select';
export { Checkbox } from './checkbox';
export { 
  Dialog, 
  DialogPortal, 
  DialogOverlay, 
  DialogTrigger, 
  DialogClose, 
  DialogContent, 
  DialogHeader, 
  DialogFooter, 
  DialogTitle, 
  DialogDescription 
} from './dialog';
export { 
  Drawer, 
  DrawerPortal, 
  DrawerOverlay, 
  DrawerTrigger, 
  DrawerClose, 
  DrawerContent, 
  DrawerHeader, 
  DrawerFooter, 
  DrawerTitle, 
  DrawerDescription 
} from './drawer';
export { Skeleton } from './skeleton';
export { Badge } from './badge';

// Custom components
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
} from './typography';

export {
  LoadingSpinner,
  ProcessingIndicator,
  PaperSkeleton,
  TypingAnimation,
  loadingVariants,
} from './loading';

// Component type exports for TypeScript
export type { VariantProps } from 'class-variance-authority';
