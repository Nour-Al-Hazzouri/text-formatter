/**
 * Theme Types - Design System and Styling Definitions
 * 
 * Types for notebook aesthetic, orange theme, and design system components
 */

// ============================================================================
// Base Theme Types
// ============================================================================

/**
 * Application theme configuration
 */
export interface Theme {
  /** Theme identifier */
  name: string;
  
  /** Theme display name */
  displayName: string;
  
  /** Theme mode */
  mode: ThemeMode;
  
  /** Color palette */
  colors: ColorPalette;
  
  /** Typography system */
  typography: Typography;
  
  /** Spacing system */
  spacing: SpacingScale;
  
  /** Border radius values */
  borderRadius: BorderRadiusScale;
  
  /** Shadow definitions */
  shadows: ShadowScale;
  
  /** Animation configurations */
  animations: AnimationConfig;
  
  /** Notebook-specific styling */
  notebook: NotebookTheme;
}

/**
 * Theme mode options
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Color palette structure
 */
export interface ColorPalette {
  /** Primary orange color scale */
  primary: ColorScale;
  
  /** Orange accent colors */
  orange: ColorScale;
  
  /** Neutral colors */
  neutral: ColorScale;
  
  /** Semantic colors */
  semantic: SemanticColors;
  
  /** Notebook-specific colors */
  notebook: NotebookColors;
  
  /** Background colors */
  background: BackgroundColors;
  
  /** Text colors */
  text: TextColors;
  
  /** Border colors */
  border: BorderColors;
}

/**
 * Color scale definition (50-950)
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

/**
 * Semantic color definitions
 */
export interface SemanticColors {
  /** Success/positive colors */
  success: {
    light: string;
    main: string;
    dark: string;
    contrast: string;
  };
  
  /** Warning colors */
  warning: {
    light: string;
    main: string;
    dark: string;
    contrast: string;
  };
  
  /** Error/danger colors */
  error: {
    light: string;
    main: string;
    dark: string;
    contrast: string;
  };
  
  /** Info colors */
  info: {
    light: string;
    main: string;
    dark: string;
    contrast: string;
  };
}

/**
 * Notebook-specific colors
 */
export interface NotebookColors {
  /** Paper background color */
  paper: string;
  
  /** Binding/spiral color */
  binding: string;
  
  /** Margin line color */
  margin: string;
  
  /** Ink/text color */
  ink: string;
  
  /** Shadow color */
  shadow: string;
  
  /** Torn edge color */
  torn: string;
  
  /** Highlight color */
  highlight: string;
}

/**
 * Background color variations
 */
export interface BackgroundColors {
  /** Primary background */
  primary: string;
  
  /** Secondary background */
  secondary: string;
  
  /** Surface background */
  surface: string;
  
  /** Elevated surface */
  elevated: string;
  
  /** Overlay background */
  overlay: string;
}

/**
 * Text color variations
 */
export interface TextColors {
  /** Primary text */
  primary: string;
  
  /** Secondary text */
  secondary: string;
  
  /** Muted text */
  muted: string;
  
  /** Disabled text */
  disabled: string;
  
  /** Contrast text */
  contrast: string;
}

/**
 * Border color variations
 */
export interface BorderColors {
  /** Default border */
  default: string;
  
  /** Muted border */
  muted: string;
  
  /** Focus border */
  focus: string;
  
  /** Error border */
  error: string;
}

// ============================================================================
// Typography System
// ============================================================================

/**
 * Typography configuration
 */
export interface Typography {
  /** Font family definitions */
  fontFamily: FontFamilyScale;
  
  /** Font size scale */
  fontSize: FontSizeScale;
  
  /** Font weight values */
  fontWeight: FontWeightScale;
  
  /** Line height values */
  lineHeight: LineHeightScale;
  
  /** Letter spacing values */
  letterSpacing: LetterSpacingScale;
  
  /** Predefined text styles */
  textStyles: TextStyleScale;
}

/**
 * Font family definitions
 */
export interface FontFamilyScale {
  /** Sans-serif font stack */
  sans: string[];
  
  /** Serif font stack */
  serif: string[];
  
  /** Monospace font stack */
  mono: string[];
  
  /** Handwritten font stack */
  handwritten: string[];
  
  /** Heading font stack */
  heading: string[];
  
  /** Content font stack */
  content: string[];
}

/**
 * Font size scale
 */
export interface FontSizeScale {
  '2xs': FontSizeDefinition;
  xs: FontSizeDefinition;
  sm: FontSizeDefinition;
  base: FontSizeDefinition;
  lg: FontSizeDefinition;
  xl: FontSizeDefinition;
  '2xl': FontSizeDefinition;
  '3xl': FontSizeDefinition;
  '4xl': FontSizeDefinition;
  '5xl': FontSizeDefinition;
  '6xl': FontSizeDefinition;
  '7xl': FontSizeDefinition;
  '8xl': FontSizeDefinition;
  '9xl': FontSizeDefinition;
}

/**
 * Font size with line height
 */
export interface FontSizeDefinition {
  fontSize: string;
  lineHeight: string;
}

/**
 * Font weight scale
 */
export interface FontWeightScale {
  thin: number;
  extralight: number;
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
  extrabold: number;
  black: number;
}

/**
 * Line height scale
 */
export interface LineHeightScale {
  none: string;
  tight: string;
  snug: string;
  normal: string;
  relaxed: string;
  loose: string;
}

/**
 * Letter spacing scale
 */
export interface LetterSpacingScale {
  tighter: string;
  tight: string;
  normal: string;
  wide: string;
  wider: string;
  widest: string;
}

/**
 * Predefined text styles
 */
export interface TextStyleScale {
  /** Display text styles */
  display: {
    large: TextStyle;
    medium: TextStyle;
    small: TextStyle;
  };
  
  /** Heading styles */
  heading: {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    h4: TextStyle;
    h5: TextStyle;
    h6: TextStyle;
  };
  
  /** Body text styles */
  body: {
    large: TextStyle;
    medium: TextStyle;
    small: TextStyle;
  };
  
  /** Caption and label styles */
  caption: TextStyle;
  label: TextStyle;
  
  /** Code and monospace styles */
  code: TextStyle;
  
  /** Handwritten styles */
  handwritten: {
    large: TextStyle;
    medium: TextStyle;
    small: TextStyle;
  };
}

/**
 * Individual text style definition
 */
export interface TextStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing?: string;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
}

// ============================================================================
// Spacing and Layout
// ============================================================================

/**
 * Spacing scale values
 */
export interface SpacingScale {
  0: string;
  px: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  3.5: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  14: string;
  16: string;
  18: string;
  20: string;
  24: string;
  28: string;
  32: string;
  36: string;
  40: string;
  44: string;
  48: string;
  52: string;
  56: string;
  60: string;
  64: string;
  72: string;
  80: string;
  96: string;
}

/**
 * Border radius scale
 */
export interface BorderRadiusScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

/**
 * Shadow definitions
 */
export interface ShadowScale {
  /** Standard shadows */
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  
  /** Colored shadows */
  'glow-orange': string;
  'glow-orange-lg': string;
  
  /** Notebook-specific shadows */
  paper: string;
  'paper-lifted': string;
  spiral: string;
  torn: string;
  
  /** Interactive shadows */
  hover: string;
  focus: string;
  active: string;
}

// ============================================================================
// Notebook Theme Specifics
// ============================================================================

/**
 * Notebook aesthetic configuration
 */
export interface NotebookTheme {
  /** Paper texture settings */
  paper: {
    /** Background texture */
    texture: PaperTexture;
    
    /** Ruled lines configuration */
    ruledLines: RuledLinesConfig;
    
    /** Margin configuration */
    margin: MarginConfig;
    
    /** Paper color variations */
    colors: {
      light: string;
      medium: string;
      aged: string;
    };
  };
  
  /** Spiral binding configuration */
  binding: {
    /** Binding colors */
    colors: {
      metal: string;
      shadow: string;
      highlight: string;
    };
    
    /** Spiral hole configuration */
    holes: SpiralHoleConfig;
    
    /** Binding width */
    width: string;
  };
  
  /** Torn edge effects */
  tornEdge: {
    /** Edge pattern variations */
    patterns: TornEdgePattern[];
    
    /** Edge colors */
    colors: {
      light: string;
      shadow: string;
    };
  };
  
  /** Ink and writing effects */
  ink: {
    /** Ink colors */
    colors: {
      blue: string;
      black: string;
      pencil: string;
    };
    
    /** Writing textures */
    textures: InkTexture[];
  };
}

/**
 * Paper texture configuration
 */
export interface PaperTexture {
  /** Texture type */
  type: 'smooth' | 'rough' | 'canvas' | 'linen';
  
  /** Texture intensity */
  intensity: 'subtle' | 'medium' | 'strong';
  
  /** Texture pattern URL or CSS */
  pattern: string;
  
  /** Texture opacity */
  opacity: number;
}

/**
 * Ruled lines configuration
 */
export interface RuledLinesConfig {
  /** Whether to show ruled lines */
  enabled: boolean;
  
  /** Line spacing */
  spacing: string;
  
  /** Line color */
  color: string;
  
  /** Line opacity */
  opacity: number;
  
  /** Line style */
  style: 'solid' | 'dashed' | 'dotted';
  
  /** Line width */
  width: string;
}

/**
 * Margin configuration
 */
export interface MarginConfig {
  /** Whether to show margin line */
  enabled: boolean;
  
  /** Margin position from left */
  position: string;
  
  /** Margin line color */
  color: string;
  
  /** Margin line width */
  width: string;
  
  /** Margin line style */
  style: 'solid' | 'dashed' | 'dotted';
}

/**
 * Spiral hole configuration
 */
export interface SpiralHoleConfig {
  /** Hole diameter */
  diameter: string;
  
  /** Hole spacing */
  spacing: string;
  
  /** Hole colors */
  colors: {
    inner: string;
    outer: string;
    shadow: string;
  };
  
  /** Number of holes */
  count: number;
}

/**
 * Torn edge pattern
 */
export interface TornEdgePattern {
  /** Pattern name */
  name: string;
  
  /** CSS clip-path value */
  clipPath: string;
  
  /** Pattern complexity */
  complexity: 'simple' | 'medium' | 'complex';
}

/**
 * Ink texture effects
 */
export interface InkTexture {
  /** Texture name */
  name: string;
  
  /** CSS filter effects */
  filter: string;
  
  /** Texture pattern */
  pattern?: string;
  
  /** Texture blend mode */
  blendMode: string;
}

// ============================================================================
// Animation Configuration
// ============================================================================

/**
 * Animation system configuration
 */
export interface AnimationConfig {
  /** Animation durations */
  duration: AnimationDuration;
  
  /** Animation timing functions */
  easing: AnimationEasing;
  
  /** Predefined animations */
  presets: AnimationPresets;
  
  /** Notebook-specific animations */
  notebook: NotebookAnimations;
}

/**
 * Animation duration values
 */
export interface AnimationDuration {
  none: string;
  fast: string;
  normal: string;
  slow: string;
  slower: string;
}

/**
 * Animation easing functions
 */
export interface AnimationEasing {
  linear: string;
  easeIn: string;
  easeOut: string;
  easeInOut: string;
  bounce: string;
  elastic: string;
}

/**
 * Animation presets
 */
export interface AnimationPresets {
  /** Fade animations */
  fadeIn: AnimationKeyframes;
  fadeOut: AnimationKeyframes;
  fadeUp: AnimationKeyframes;
  fadeDown: AnimationKeyframes;
  
  /** Slide animations */
  slideIn: AnimationKeyframes;
  slideOut: AnimationKeyframes;
  
  /** Scale animations */
  scaleIn: AnimationKeyframes;
  scaleOut: AnimationKeyframes;
  
  /** Rotation animations */
  spin: AnimationKeyframes;
  pulse: AnimationKeyframes;
  bounce: AnimationKeyframes;
}

/**
 * Notebook-specific animations
 */
export interface NotebookAnimations {
  /** Writing animations */
  penWrite: AnimationKeyframes;
  typewriter: AnimationKeyframes;
  
  /** Paper animations */
  pageTurn: AnimationKeyframes;
  paperFlutter: AnimationKeyframes;
  
  /** Binding animations */
  spiralRotate: AnimationKeyframes;
  
  /** Interaction animations */
  paperLift: AnimationKeyframes;
  inkFlow: AnimationKeyframes;
}

/**
 * Animation keyframes definition
 */
export interface AnimationKeyframes {
  /** Animation name */
  name: string;
  
  /** Keyframe steps */
  keyframes: Record<string, CSSProperties>;
  
  /** Default duration */
  duration: string;
  
  /** Default easing */
  easing: string;
}

/**
 * CSS properties subset for animations
 */
export interface CSSProperties {
  transform?: string;
  opacity?: string | number;
  filter?: string;
  boxShadow?: string;
  backgroundColor?: string;
  borderRadius?: string;
  scale?: string | number;
  rotate?: string;
  translate?: string;
  [key: string]: string | number | undefined;
}

// ============================================================================
// Theme Utilities and Helpers
// ============================================================================

/**
 * Theme provider configuration
 */
export interface ThemeProviderConfig {
  /** Default theme */
  defaultTheme: Theme;
  
  /** Available themes */
  themes: Record<string, Theme>;
  
  /** Storage key for persisting theme */
  storageKey: string;
  
  /** System theme detection */
  enableSystemDetection: boolean;
}

/**
 * Theme context value
 */
export interface ThemeContextValue {
  /** Current theme */
  theme: Theme;
  
  /** Current theme mode */
  mode: ThemeMode;
  
  /** Set theme mode */
  setMode: (mode: ThemeMode) => void;
  
  /** Switch to specific theme */
  setTheme: (themeName: string) => void;
  
  /** Toggle between light/dark */
  toggleMode: () => void;
  
  /** Available themes */
  availableThemes: string[];
}

/**
 * Responsive breakpoint definitions
 */
export interface Breakpoints {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

/**
 * Media query helpers
 */
export interface MediaQueries {
  /** Mobile first queries */
  up: (breakpoint: keyof Breakpoints) => string;
  
  /** Desktop first queries */
  down: (breakpoint: keyof Breakpoints) => string;
  
  /** Between breakpoints */
  between: (min: keyof Breakpoints, max: keyof Breakpoints) => string;
  
  /** Only specific breakpoint */
  only: (breakpoint: keyof Breakpoints) => string;
}

/**
 * Theme customization options
 */
export interface ThemeCustomization {
  /** Primary color override */
  primaryColor?: string;
  
  /** Font family overrides */
  fontFamily?: Partial<FontFamilyScale>;
  
  /** Spacing multiplier */
  spacingMultiplier?: number;
  
  /** Border radius multiplier */
  borderRadiusMultiplier?: number;
  
  /** Custom CSS variables */
  customProperties?: Record<string, string>;
}
