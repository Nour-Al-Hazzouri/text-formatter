/**
 * Utility Types - Common Utilities and Helper Types
 * 
 * Reusable utility types, validation schemas, and helper functions
 */

// ============================================================================
// Common Utility Types
// ============================================================================

/**
 * Make all properties in T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make all properties in T required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Make specific keys K in T required
 */
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific keys K in T optional
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract keys from T that extend U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Exclude keys from T that extend U
 */
export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>;

/**
 * Pick keys from T that extend U
 */
export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>;

/**
 * Create a branded type for nominal typing
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/**
 * Extract the brand from a branded type
 */
export type UnBrand<T> = T extends Brand<infer U, string> ? U : T;

/**
 * Union to intersection type converter
 */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * Get the values of an object type as a union
 */
export type ValueOf<T> = T[keyof T];

/**
 * Get function parameters as tuple
 */
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

/**
 * Get function return type
 */
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

// ============================================================================
// Result and Error Types
// ============================================================================

/**
 * Result type for operations that can succeed or fail
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Success result
 */
export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

/**
 * Failure result
 */
export interface Failure<E> {
  readonly success: false;
  readonly error: E;
}

/**
 * Create a success result
 */
export const success = <T>(data: T): Success<T> => ({
  success: true,
  data,
});

/**
 * Create a failure result
 */
export const failure = <E>(error: E): Failure<E> => ({
  success: false,
  error,
});

/**
 * Option type for values that may be undefined
 */
export type Option<T> = Some<T> | None;

/**
 * Some value exists
 */
export interface Some<T> {
  readonly _tag: 'Some';
  readonly value: T;
}

/**
 * No value exists
 */
export interface None {
  readonly _tag: 'None';
}

/**
 * Create Some option
 */
export const some = <T>(value: T): Some<T> => ({
  _tag: 'Some',
  value,
});

/**
 * Create None option
 */
export const none: None = {
  _tag: 'None',
};

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation result
 */
export type ValidationResult<T = unknown> = Valid<T> | Invalid;

/**
 * Valid validation result
 */
export interface Valid<T> {
  readonly isValid: true;
  readonly value: T;
}

/**
 * Invalid validation result
 */
export interface Invalid {
  readonly isValid: false;
  readonly errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error message */
  message: string;
  
  /** Field path (for object validation) */
  path?: string;
  
  /** Error code */
  code?: string;
  
  /** Error context */
  context?: Record<string, unknown>;
}

/**
 * Validation rule function
 */
export type ValidationRule<T = unknown> = (value: T) => ValidationResult<T>;

/**
 * Schema validation definition
 */
export interface ValidationSchema<T = unknown> {
  /** Schema rules */
  rules: ValidationRule<T>[];
  
  /** Custom error messages */
  messages?: Record<string, string>;
  
  /** Whether to stop on first error */
  stopOnFirstError?: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Generic event interface
 */
export interface Event<T = unknown> {
  /** Event type */
  type: string;
  
  /** Event payload */
  payload: T;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Event source */
  source?: string;
  
  /** Event metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Event handler function
 */
export type EventHandler<T = unknown> = (event: Event<T>) => void | Promise<void>;

/**
 * Event listener configuration
 */
export interface EventListener<T = unknown> {
  /** Event type to listen for */
  type: string;
  
  /** Handler function */
  handler: EventHandler<T>;
  
  /** Whether to handle only once */
  once?: boolean;
  
  /** Handler priority */
  priority?: number;
}

/**
 * Event emitter interface
 */
export interface EventEmitter {
  /** Add event listener */
  on<T = unknown>(type: string, handler: EventHandler<T>): void;
  
  /** Add one-time event listener */
  once<T = unknown>(type: string, handler: EventHandler<T>): void;
  
  /** Remove event listener */
  off<T = unknown>(type: string, handler: EventHandler<T>): void;
  
  /** Emit event */
  emit<T = unknown>(type: string, payload: T, metadata?: Record<string, unknown>): void;
  
  /** Remove all listeners */
  removeAllListeners(type?: string): void;
}

// ============================================================================
// State Management Types
// ============================================================================

/**
 * State updater function
 */
export type StateUpdater<T> = (prevState: T) => T;

/**
 * State setter that accepts value or updater
 */
export type StateSetter<T> = (value: T | StateUpdater<T>) => void;

/**
 * State hook return type
 */
export type StateHook<T> = [T, StateSetter<T>];

/**
 * Reducer function type
 */
export type Reducer<S, A> = (state: S, action: A) => S;

/**
 * Action creator function
 */
export type ActionCreator<A> = (...args: any[]) => A;

/**
 * Store interface
 */
export interface Store<S, A = unknown> {
  /** Get current state */
  getState(): S;
  
  /** Dispatch action */
  dispatch(action: A): void;
  
  /** Subscribe to state changes */
  subscribe(listener: StateListener<S>): Unsubscribe;
}

/**
 * State change listener
 */
export type StateListener<S> = (state: S, prevState: S) => void;

/**
 * Unsubscribe function
 */
export type Unsubscribe = () => void;

// ============================================================================
// Async Utility Types
// ============================================================================

/**
 * Async operation status
 */
export type AsyncStatus = 'idle' | 'pending' | 'fulfilled' | 'rejected';

/**
 * Async state wrapper
 */
export interface AsyncState<T, E = Error> {
  /** Current status */
  status: AsyncStatus;
  
  /** Data when fulfilled */
  data?: T;
  
  /** Error when rejected */
  error?: E;
  
  /** Loading indicator */
  loading: boolean;
}

/**
 * Promise with additional metadata
 */
export interface PromiseWithMetadata<T> extends Promise<T> {
  /** Promise identifier */
  id: string;
  
  /** Promise creation timestamp */
  createdAt: Date;
  
  /** Promise timeout */
  timeout?: number;
  
  /** Promise abort controller */
  controller?: AbortController;
}

/**
 * Debounced function wrapper
 */
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  /** Execute the function */
  (...args: Parameters<T>): void;
  
  /** Cancel pending execution */
  cancel(): void;
  
  /** Execute immediately */
  flush(): ReturnType<T> | undefined;
  
  /** Whether execution is pending */
  pending(): boolean;
}

/**
 * Throttled function wrapper
 */
export interface ThrottledFunction<T extends (...args: any[]) => any> {
  /** Execute the function */
  (...args: Parameters<T>): ReturnType<T> | undefined;
  
  /** Cancel pending execution */
  cancel(): void;
  
  /** Execute immediately */
  flush(): ReturnType<T> | undefined;
}

// ============================================================================
// Data Structure Types
// ============================================================================

/**
 * Tree node interface
 */
export interface TreeNode<T> {
  /** Node value */
  value: T;
  
  /** Parent node */
  parent?: TreeNode<T>;
  
  /** Child nodes */
  children: TreeNode<T>[];
  
  /** Node metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Graph node interface
 */
export interface GraphNode<T> {
  /** Node identifier */
  id: string;
  
  /** Node value */
  value: T;
  
  /** Connected nodes */
  edges: GraphEdge[];
  
  /** Node metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Graph edge interface
 */
export interface GraphEdge {
  /** Target node id */
  to: string;
  
  /** Edge weight */
  weight?: number;
  
  /** Edge direction */
  directed?: boolean;
  
  /** Edge metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Queue interface
 */
export interface Queue<T> {
  /** Add item to queue */
  enqueue(item: T): void;
  
  /** Remove and return next item */
  dequeue(): T | undefined;
  
  /** Look at next item without removing */
  peek(): T | undefined;
  
  /** Check if queue is empty */
  isEmpty(): boolean;
  
  /** Get queue size */
  size(): number;
  
  /** Clear all items */
  clear(): void;
}

/**
 * Stack interface
 */
export interface Stack<T> {
  /** Add item to stack */
  push(item: T): void;
  
  /** Remove and return top item */
  pop(): T | undefined;
  
  /** Look at top item without removing */
  peek(): T | undefined;
  
  /** Check if stack is empty */
  isEmpty(): boolean;
  
  /** Get stack size */
  size(): number;
  
  /** Clear all items */
  clear(): void;
}

// ============================================================================
// Performance and Optimization Types
// ============================================================================

/**
 * Performance measurement
 */
export interface PerformanceMeasurement {
  /** Measurement name */
  name: string;
  
  /** Start timestamp */
  startTime: number;
  
  /** End timestamp */
  endTime?: number;
  
  /** Duration in milliseconds */
  duration?: number;
  
  /** Memory usage */
  memory?: MemoryUsage;
  
  /** Custom metrics */
  metrics?: Record<string, number>;
}

/**
 * Memory usage information
 */
export interface MemoryUsage {
  /** Used heap size */
  usedJSHeapSize: number;
  
  /** Total heap size */
  totalJSHeapSize: number;
  
  /** Heap size limit */
  jsHeapSizeLimit: number;
}

/**
 * Cache interface
 */
export interface Cache<K, V> {
  /** Get value by key */
  get(key: K): V | undefined;
  
  /** Set key-value pair */
  set(key: K, value: V): void;
  
  /** Check if key exists */
  has(key: K): boolean;
  
  /** Delete key */
  delete(key: K): boolean;
  
  /** Clear all entries */
  clear(): void;
  
  /** Get cache size */
  size(): number;
  
  /** Get all keys */
  keys(): K[];
  
  /** Get all values */
  values(): V[];
}

/**
 * LRU Cache configuration
 */
export interface LRUCacheConfig {
  /** Maximum cache size */
  maxSize: number;
  
  /** Time to live in milliseconds */
  ttl?: number;
  
  /** Cleanup interval */
  cleanupInterval?: number;
  
  /** On evict callback */
  onEvict?: (key: any, value: any) => void;
}

// ============================================================================
// Logging and Debugging Types
// ============================================================================

/**
 * Log level enumeration
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Log entry
 */
export interface LogEntry {
  /** Log level */
  level: LogLevel;
  
  /** Log message */
  message: string;
  
  /** Log timestamp */
  timestamp: Date;
  
  /** Logger name/category */
  logger?: string;
  
  /** Additional context */
  context?: Record<string, unknown>;
  
  /** Error object (if applicable) */
  error?: Error;
  
  /** Stack trace */
  stack?: string;
}

/**
 * Logger interface
 */
export interface Logger {
  /** Log trace message */
  trace(message: string, context?: Record<string, unknown>): void;
  
  /** Log debug message */
  debug(message: string, context?: Record<string, unknown>): void;
  
  /** Log info message */
  info(message: string, context?: Record<string, unknown>): void;
  
  /** Log warning message */
  warn(message: string, context?: Record<string, unknown>): void;
  
  /** Log error message */
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  
  /** Log fatal message */
  fatal(message: string, error?: Error, context?: Record<string, unknown>): void;
  
  /** Create child logger */
  child(name: string, context?: Record<string, unknown>): Logger;
}

/**
 * Debug information
 */
export interface DebugInfo {
  /** Component/module name */
  component: string;
  
  /** Current state */
  state?: Record<string, unknown>;
  
  /** Props/inputs */
  props?: Record<string, unknown>;
  
  /** Performance metrics */
  performance?: Record<string, number>;
  
  /** Error information */
  errors?: Error[];
  
  /** Debug timestamp */
  timestamp: Date;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration value types
 */
export type ConfigValue = string | number | boolean | object | null | undefined;

/**
 * Configuration schema
 */
export interface ConfigSchema {
  /** Configuration key */
  key: string;
  
  /** Value type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  
  /** Default value */
  default?: ConfigValue;
  
  /** Whether configuration is required */
  required?: boolean;
  
  /** Validation function */
  validate?: (value: ConfigValue) => boolean | string;
  
  /** Configuration description */
  description?: string;
  
  /** Environment variable name */
  env?: string;
}

/**
 * Configuration manager interface
 */
export interface ConfigManager {
  /** Get configuration value */
  get<T = ConfigValue>(key: string): T | undefined;
  
  /** Set configuration value */
  set(key: string, value: ConfigValue): void;
  
  /** Check if key exists */
  has(key: string): boolean;
  
  /** Get all configuration */
  getAll(): Record<string, ConfigValue>;
  
  /** Load configuration from source */
  load(source: ConfigSource): Promise<void>;
  
  /** Validate configuration */
  validate(): ValidationResult;
}

/**
 * Configuration source
 */
export type ConfigSource = 
  | { type: 'env' }
  | { type: 'file'; path: string }
  | { type: 'url'; url: string }
  | { type: 'object'; data: Record<string, ConfigValue> };

// ============================================================================
// File and I/O Types
// ============================================================================

/**
 * File information
 */
export interface FileInfo {
  /** File name */
  name: string;
  
  /** File size in bytes */
  size: number;
  
  /** File type/MIME type */
  type: string;
  
  /** Last modified date */
  lastModified: Date;
  
  /** File path (if applicable) */
  path?: string;
  
  /** File extension */
  extension?: string;
}

/**
 * File reader interface
 */
export interface FileReader<T> {
  /** Read file as specific type */
  read(file: File): Promise<T>;
  
  /** Check if file is supported */
  supports(file: File): boolean;
  
  /** Get supported file types */
  getSupportedTypes(): string[];
}

/**
 * File writer interface
 */
export interface FileWriter<T> {
  /** Write data to file */
  write(data: T, fileName: string): Promise<File>;
  
  /** Get output MIME type */
  getMimeType(): string;
  
  /** Get file extension */
  getExtension(): string;
}

/**
 * Storage interface
 */
export interface Storage {
  /** Get item */
  getItem(key: string): string | null;
  
  /** Set item */
  setItem(key: string, value: string): void;
  
  /** Remove item */
  removeItem(key: string): void;
  
  /** Clear all items */
  clear(): void;
  
  /** Get storage length */
  length: number;
  
  /** Get key by index */
  key(index: number): string | null;
}
