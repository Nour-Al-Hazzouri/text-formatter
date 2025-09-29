/**
 * Component Types - React Component Props and State Interfaces
 * 
 * Type definitions for all UI components and their interactions
 */

import { ReactNode, CSSProperties } from 'react';
import { FormattedOutput, TextInput } from './formatting';
import type { ProcessingState, FormatType } from './index';

// ============================================================================
// Base Component Types
// ============================================================================

/**
 * Base props that all components should extend
 */
export interface BaseComponentProps {
  /** Component identifier for testing */
  'data-testid'?: string;
  
  /** Custom CSS class names */
  className?: string;
  
  /** Inline styles */
  style?: CSSProperties;
  
  /** Child components */
  children?: ReactNode;
  
  /** Whether component is disabled */
  disabled?: boolean;
  
  /** Loading state */
  loading?: boolean;
}

/**
 * Notebook-themed component variant props
 */
export interface NotebookComponentProps extends BaseComponentProps {
  /** Notebook visual variant */
  variant?: 'paper' | 'binding' | 'torn' | 'spiral';
  
  /** Paper texture intensity */
  paperIntensity?: 'subtle' | 'normal' | 'strong';
  
  /** Whether to show ruled lines */
  showRuledLines?: boolean;
  
  /** Whether to show margin line */
  showMargin?: boolean;
  
  /** Animation preset */
  animation?: 'none' | 'subtle' | 'normal' | 'dynamic';
}

// ============================================================================
// Layout Component Types
// ============================================================================

/**
 * App layout component props
 */
export interface AppLayoutProps extends BaseComponentProps {
  /** Layout header content */
  header?: ReactNode;
  
  /** Layout sidebar content */
  sidebar?: ReactNode;
  
  /** Layout footer content */
  footer?: ReactNode;
  
  /** Whether sidebar is initially open */
  sidebarOpen?: boolean;
  
  /** Sidebar position */
  sidebarPosition?: 'left' | 'right';
  
  /** Layout mode */
  mode?: 'full' | 'centered' | 'fluid';
}

/**
 * Header component props
 */
export interface HeaderProps extends NotebookComponentProps {
  /** Header title */
  title: string;
  
  /** Header subtitle */
  subtitle?: string;
  
  /** Navigation items */
  navigation?: NavigationItem[];
  
  /** Action buttons */
  actions?: ReactNode;
  
  /** Whether header is sticky */
  sticky?: boolean;
}

/**
 * Navigation item definition
 */
export interface NavigationItem {
  /** Item identifier */
  id: string;
  
  /** Display label */
  label: string;
  
  /** Navigation path */
  path?: string;
  
  /** Click handler */
  onClick?: () => void;
  
  /** Whether item is active */
  active?: boolean;
  
  /** Whether item is disabled */
  disabled?: boolean;
  
  /** Item icon */
  icon?: ReactNode;
}

/**
 * Sidebar component props
 */
export interface SidebarProps extends NotebookComponentProps {
  /** Whether sidebar is open */
  open: boolean;
  
  /** Close sidebar callback */
  onClose: () => void;
  
  /** Sidebar content */
  content: ReactNode;
  
  /** Sidebar width */
  width?: number | string;
  
  /** Whether sidebar has overlay */
  overlay?: boolean;
  
  /** Sidebar position */
  position?: 'left' | 'right';
}

// ============================================================================
// Text Processing Component Types
// ============================================================================

/**
 * Main text formatter component props
 */
export interface TextFormatterProps extends BaseComponentProps {
  /** Initial input text */
  initialText?: string;
  
  /** Initial format selection */
  initialFormat?: FormatType;
  
  /** Whether to enable auto-detection */
  autoDetect?: boolean;
  
  /** Format change callback */
  onFormatChange?: (format: FormatType) => void;
  
  /** Text change callback */
  onTextChange?: (text: string) => void;
  
  /** Processing complete callback */
  onProcessingComplete?: (result: FormattedOutput) => void;
  
  /** Error callback */
  onError?: (error: Error) => void;
}

/**
 * Dual-pane interface props
 */
export interface DualPaneProps extends NotebookComponentProps {
  /** Input pane props */
  inputProps: InputPaneProps;
  
  /** Output pane props */
  outputProps: OutputPaneProps;
  
  /** Pane layout direction */
  direction?: 'horizontal' | 'vertical';
  
  /** Whether panes are resizable */
  resizable?: boolean;
  
  /** Initial split ratio (0-100) */
  initialSplit?: number;
  
  /** Split change callback */
  onSplitChange?: (ratio: number) => void;
}

/**
 * Input pane component props
 */
export interface InputPaneProps extends NotebookComponentProps {
  /** Input text content */
  value: string;
  
  /** Text change callback */
  onChange: (value: string) => void;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Whether input is read-only */
  readOnly?: boolean;
  
  /** Text area properties */
  textAreaProps?: Partial<React.TextareaHTMLAttributes<HTMLTextAreaElement>>;
  
  /** Character limit */
  maxLength?: number;
  
  /** Whether to show character count */
  showCharacterCount?: boolean;
  
  /** File upload handler */
  onFileUpload?: (file: File) => void;
  
  /** Paste handler */
  onPaste?: (event: React.ClipboardEvent) => void;
}

/**
 * Output pane component props
 */
export interface OutputPaneProps extends NotebookComponentProps {
  /** Formatted output content */
  output: FormattedOutput | null;
  
  /** Whether output is loading/processing */
  loading?: boolean;
  
  /** Processing state */
  processingState?: ProcessingState;
  
  /** Copy to clipboard callback */
  onCopy?: () => void;
  
  /** Export callback */
  onExport?: (format: string) => void;
  
  /** Whether to show metadata */
  showMetadata?: boolean;
  
  /** Whether to show confidence score */
  showConfidence?: boolean;
}

/**
 * Format selector component props
 */
export interface FormatSelectorProps extends BaseComponentProps {
  /** Currently selected format */
  selectedFormat: FormatType | null;
  
  /** Auto-detected format */
  detectedFormat?: FormatType;
  
  /** Detection confidence score */
  confidence?: number;
  
  /** Format selection callback */
  onFormatSelect: (format: FormatType) => void;
  
  /** Available formats */
  availableFormats?: FormatType[];
  
  /** Whether auto-detection is enabled */
  autoDetectEnabled?: boolean;
  
  /** Auto-detection toggle callback */
  onAutoDetectToggle?: (enabled: boolean) => void;
  
  /** Display mode */
  mode?: 'grid' | 'list' | 'tabs';
  
  /** Whether to show previews */
  showPreviews?: boolean;
}

/**
 * Processing indicator component props
 */
export interface ProcessingIndicatorProps extends NotebookComponentProps {
  /** Current processing state */
  state: ProcessingState;
  
  /** Whether to show detailed progress */
  detailed?: boolean;
  
  /** Whether to show step information */
  showSteps?: boolean;
  
  /** Whether to show duration */
  showDuration?: boolean;
  
  /** Custom progress messages */
  messages?: Record<string, string>;
  
  /** Animation style */
  animationStyle?: 'pen' | 'typewriter' | 'pulse' | 'spin';
}

// ============================================================================
// UI Component Types
// ============================================================================

/**
 * Button component props
 */
export interface ButtonProps extends BaseComponentProps {
  /** Button content */
  children: ReactNode;
  
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'vintage';
  
  /** Notebook styling variant */
  notebookVariant?: 'paper' | 'binding' | 'torn' | 'spiral';
  
  /** Button size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  
  /** Loading state */
  loading?: boolean;
  
  /** Button icon */
  icon?: ReactNode;
  
  /** Icon position */
  iconPosition?: 'left' | 'right';
}

/**
 * Input/TextArea component props
 */
export interface InputProps extends NotebookComponentProps {
  /** Input value */
  value?: string;
  
  /** Default value */
  defaultValue?: string;
  
  /** Value change callback */
  onChange?: (value: string) => void;
  
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Whether input is required */
  required?: boolean;
  
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Error message */
  error?: string;
  
  /** Help text */
  helpText?: string;
  
  /** Input label */
  label?: string;
}

/**
 * Card component props
 */
export interface CardProps extends NotebookComponentProps {
  /** Card header content */
  header?: ReactNode;
  
  /** Card footer content */
  footer?: ReactNode;
  
  /** Whether card is interactive/clickable */
  interactive?: boolean;
  
  /** Click handler for interactive cards */
  onClick?: () => void;
  
  /** Card elevation level */
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Card padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Modal component props
 */
export interface ModalProps extends BaseComponentProps {
  /** Whether modal is open */
  open: boolean;
  
  /** Close modal callback */
  onClose: () => void;
  
  /** Modal title */
  title?: string;
  
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /** Whether modal can be closed by clicking overlay */
  closeOnOverlayClick?: boolean;
  
  /** Whether modal can be closed with escape key */
  closeOnEscape?: boolean;
  
  /** Modal footer content */
  footer?: ReactNode;
  
  /** Whether modal has paper texture */
  notebookStyle?: boolean;
}

/**
 * Tooltip component props
 */
export interface TooltipProps extends BaseComponentProps {
  /** Tooltip content */
  content: ReactNode;
  
  /** Tooltip trigger element */
  trigger: ReactNode;
  
  /** Tooltip placement */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  
  /** Tooltip delay in milliseconds */
  delay?: number;
  
  /** Whether tooltip is disabled */
  disabled?: boolean;
}

// ============================================================================
// Form Component Types
// ============================================================================

/**
 * Form component props
 */
export interface FormProps extends BaseComponentProps {
  /** Form submit handler */
  onSubmit?: (event: React.FormEvent) => void;
  
  /** Form validation schema */
  validation?: Record<string, ValidationRule>;
  
  /** Form initial values */
  initialValues?: Record<string, unknown>;
  
  /** Form value change callback */
  onChange?: (values: Record<string, unknown>) => void;
  
  /** Whether form is submitting */
  submitting?: boolean;
}

/**
 * Field validation rule
 */
export interface ValidationRule {
  /** Whether field is required */
  required?: boolean;
  
  /** Minimum length */
  minLength?: number;
  
  /** Maximum length */
  maxLength?: number;
  
  /** Validation pattern */
  pattern?: RegExp;
  
  /** Custom validation function */
  validator?: (value: unknown) => boolean | string;
  
  /** Error message */
  message?: string;
}

// ============================================================================
// Export and History Component Types
// ============================================================================

/**
 * Export dialog component props
 */
export interface ExportDialogProps extends BaseComponentProps {
  /** Whether dialog is open */
  open: boolean;
  
  /** Close dialog callback */
  onClose: () => void;
  
  /** Content to export */
  content: FormattedOutput;
  
  /** Export callback */
  onExport: (format: string, options: ExportOptions) => void;
  
  /** Available export formats */
  formats?: ExportFormat[];
}

/**
 * Export format definition
 */
export interface ExportFormat {
  /** Format identifier */
  id: string;
  
  /** Format name */
  name: string;
  
  /** Format description */
  description: string;
  
  /** File extension */
  extension: string;
  
  /** MIME type */
  mimeType: string;
  
  /** Available options */
  options?: ExportFormatOption[];
}

/**
 * Export format option
 */
export interface ExportFormatOption {
  /** Option key */
  key: string;
  
  /** Option label */
  label: string;
  
  /** Option type */
  type: 'boolean' | 'string' | 'number' | 'select';
  
  /** Default value */
  defaultValue: unknown;
  
  /** Available choices (for select type) */
  choices?: Array<{ label: string; value: unknown }>;
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Include metadata */
  includeMetadata: boolean;
  
  /** Preserve formatting */
  preserveFormatting: boolean;
  
  /** Include confidence score */
  includeConfidence: boolean;
  
  /** Custom options */
  custom: Record<string, unknown>;
}

/**
 * Format history component props
 */
export interface FormatHistoryProps extends BaseComponentProps {
  /** History items */
  items: HistoryItem[];
  
  /** Load history item callback */
  onLoadItem: (item: HistoryItem) => void;
  
  /** Delete history item callback */
  onDeleteItem: (itemId: string) => void;
  
  /** Clear all history callback */
  onClearHistory: () => void;
  
  /** Maximum items to display */
  maxItems?: number;
  
  /** Whether to show search */
  searchEnabled?: boolean;
}

/**
 * History item definition
 */
export interface HistoryItem {
  /** Unique identifier */
  id: string;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Original input */
  input: TextInput;
  
  /** Formatted output */
  output: FormattedOutput;
  
  /** User-defined title */
  title?: string;
  
  /** User-defined tags */
  tags?: string[];
  
  /** Whether item is favorited */
  favorited?: boolean;
}

// ============================================================================
// Event Handler Types
// ============================================================================

/**
 * Generic event handler types for type safety
 */
export type ChangeHandler<T = string> = (value: T) => void;
export type ClickHandler = (event: React.MouseEvent) => void;
export type SubmitHandler = (event: React.FormEvent) => void;
export type FileHandler = (file: File) => void;
export type ErrorHandler = (error: Error) => void;

/**
 * Text processing specific event handlers
 */
export interface TextProcessingHandlers {
  onTextChange: ChangeHandler<string>;
  onFormatChange: ChangeHandler<FormatType>;
  onProcessingStart: () => void;
  onProcessingComplete: (output: FormattedOutput) => void;
  onProcessingError: ErrorHandler;
  onExport: (format: string, content: string) => void;
  onCopy: (content: string) => void;
}

/**
 * Component state management helpers
 */
export interface ComponentState<T = Record<string, unknown>> {
  /** Component data state */
  data: T;
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** State setters */
  setState: {
    setData: (data: T) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: Error | null) => void;
  };
}
