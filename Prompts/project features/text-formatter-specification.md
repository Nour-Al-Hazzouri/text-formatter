# Text Formatter - Complete Technical Specification Generation Prompt

## Role Assignment

You are a **principal software architect and senior full-stack developer** with 18+ years of experience specializing in:
- **Modern Web Development**: Next.js 15.5, React 18+, TypeScript 5.0+, Node.js 20+
- **Client-Side Processing**: Browser-based text processing, real-time parsing, performance optimization
- **Natural Language Processing**: Text analysis, pattern recognition, content classification
- **Enterprise Frontend Architecture**: Scalable component systems, state management, accessibility
- **Package Management**: pnpm workspaces, dependency optimization, build toolchain configuration
- **UI/UX Implementation**: Design systems, responsive layouts, notebook-aesthetic interfaces

Your expertise includes architecting **intelligent text processing applications**, implementing **real-time content transformation systems**, and creating **production-ready web applications** with advanced **pattern recognition capabilities** and **notebook-aesthetic design systems**.

## Context & Project Background

### Project Overview
You are creating a comprehensive technical specification for a **browser-based text formatting and organization tool** that transforms unorganized, plain text notes into well-structured, readable formats using intelligent pattern recognition. This is a **client-side only application** that requires no backend services or APIs.

### Core Project Characteristics
- **Zero Backend Dependency**: All processing occurs in the browser using client-side technologies
- **Real-time Processing**: Immediate text transformation with live preview capabilities
- **Intelligent Recognition**: Advanced pattern detection for meeting notes, task lists, journals, shopping lists, research notes, and study notes
- **Notebook Aesthetic**: Warm orange theme with handwritten fonts, paper textures, spiral binding effects
- **Dual-Pane Interface**: Side-by-side input/output comparison with real-time synchronization

### Technology Requirements
- **Framework**: Next.js 15.5 with App Router and Turbopack
- **Runtime**: React 18+ with concurrent features and TypeScript 5.0+
- **Styling**: Tailwind CSS 3.4+ with custom notebook-themed components and PostCSS
- **Package Manager**: pnpm 9.0+ for workspace management and dependency optimization
- **Processing Libraries**: Client-side NLP libraries (Compromise.js, natural.js, or similar)
- **State Management**: React built-in state with Context API and Local Storage integration
- **Build Tools**: ESBuild/SWC for fast compilation, bundle analysis tools

### Key Features to Implement

#### 1. Intelligent Format Detection System
- **Content Analysis Engine**: Pattern recognition for lists, headers, action items, meeting notes, quotes, code/URLs, dates/times
- **Smart Structure Detection**: Indentation logic, grouping similar lines, context awareness, length-based formatting
- **Confidence Scoring**: Algorithm to determine format recommendation accuracy
- **Manual Override**: User ability to select specific formatting modes

#### 2. Formatting Modes (6 Primary Types)
- **Meeting Notes**: Extract attendees, agenda items, decisions, action items with responsible parties
- **Task Lists**: Convert to organized todos with prioritization, due dates, category grouping
- **Journal/Notes**: Add headers, format timestamps, create readable paragraphs, highlight insights
- **Shopping Lists**: Organize by categories, remove duplicates, sort by store layout, add checkboxes
- **Research Notes**: Structure citations, create topic sections, format quotes and sources
- **Study Notes**: Convert to outlines, create Q&A sections, highlight definitions

#### 3. Notebook Aesthetic Design System
- **Color Scheme**: Warm orange primary theme with paper-like backgrounds
- **Typography**: Handwritten-style fonts for headings, clean sans-serif for content
- **Visual Effects**: Spiral binding simulation, paper textures, margin lines, torn edge details
- **Interactive Elements**: Vintage button styles, pen/pencil themed loading states

## Task Definition

### Primary Objective
Generate a **complete technical specification document** that provides implementation-ready details for building the text formatter application, including:

1. **System Architecture & Component Design**
2. **Text Processing Engine Implementation**
3. **Package Management & Dependency Strategy**
4. **Development Environment Setup**
5. **Build Pipeline & Deployment Configuration**
6. **Testing Strategy & Quality Assurance**
7. **Performance Optimization & Browser Compatibility**
8. **Accessibility Implementation & Compliance**

### Development Methodology: Feature-Driven Development (FDD)

#### Recommended Development Approach (Based on 2024 Best Practices)
Instead of traditional architecture-first development, implement using **Feature-Driven Development (FDD)** for faster feedback and incremental delivery:

**Phase 1: Core Feature Implementation (Step 1)**
- **Single Format Focus**: Meeting Notes formatter with complete pipeline
- **Basic Web Worker**: Simple pattern recognition for meeting-specific content
- **Minimal UI**: Input/output panes with basic notebook styling
- **Success Criteria**: One fully functional format type with 80%+ accuracy

**Phase 2: Pattern Recognition Expansion (Step 2)**
- **Add Task Lists + Shopping Lists**: Expand pattern recognition capabilities
- **Enhanced Web Workers**: Worker pool implementation for concurrent processing
- **React 18 Integration**: useTransition for non-blocking updates
- **Success Criteria**: Three format types with seamless switching

**Phase 3: Advanced Formatting (Step 3)**
- **Complete Format Suite**: Journal/Research/Study Notes implementation
- **Concurrent Processing**: useDeferredValue for heavy formatting operations
- **Advanced UI**: Full notebook aesthetic with animations
- **Success Criteria**: All six formats with polished user experience

**Phase 4: Performance & Enhancement (Step 4)**
- **Optimization**: Bundle analysis, lazy loading, performance monitoring
- **Progressive Enhancement**: Advanced features and edge case handling
- **Testing**: Comprehensive testing suite and accessibility validation
- **Success Criteria**: Production-ready application meeting all performance benchmarks

### Specific Technical Requirements

#### 1. Next.js 15.5 Application Architecture
- **App Router Configuration**: Route structure, layout components, page organization
- **TypeScript Integration**: Strict type checking, interface definitions, utility types
- **Build Optimization**: Turbopack configuration, bundle splitting, tree shaking
- **Static Generation**: ISR strategy for static assets and performance optimization

#### 2. pnpm Workspace Configuration  
- **Package.json Structure**: Scripts, dependencies, dev dependencies with exact versions
- **Workspace Organization**: Monorepo setup if applicable, shared dependency management
- **Lock File Management**: pnpm-lock.yaml optimization and dependency resolution
- **Script Automation**: Development, build, test, and deployment scripts

#### 3. Text Processing Engine Design (Enhanced 2024/2025 Architecture)
- **Algorithm Implementation**: Specific NLP libraries and custom pattern recognition logic
- **React 18 Concurrent Processing**: useTransition and useDeferredValue for non-blocking text analysis
- **Advanced Web Workers Pattern**: Worker pools with proper lifecycle management and error boundaries
- **Streaming Analysis**: Progressive text processing with chunk-based analysis
- **Performance Optimization**: GPU-accelerated animations, transferable objects for worker communication
- **Memory Management**: Efficient text parsing for large documents, automatic garbage collection
- **Caching Strategy**: Memoization with React.memo, localStorage optimization, and worker result caching

#### 4. State Management Architecture (Concurrent-First Design)
- **Context Providers**: Global state for formatting modes, user preferences, processing state
- **React 18 Concurrent Features**: 
  - useTransition for non-urgent text processing updates
  - useDeferredValue for delayed heavy formatting operations
  - Automatic batching for multiple state updates
- **Local Storage**: Persistence strategy for user settings, format history, custom templates
- **Component State**: Efficient re-rendering with concurrent rendering and selective hydration
- **Error Boundaries**: Worker error recovery, graceful processing failures, user feedback systems
- **Progressive Enhancement**: Layered functionality from basic to advanced features

## Implementation Requirements

### 1. Development Environment Specifications
- **Node.js Version**: 20.x LTS with specific minor version
- **pnpm Configuration**: Exact version 9.x with workspace settings
- **TypeScript Config**: Strict mode configuration with path mapping
- **ESLint/Prettier**: Code quality rules and formatting standards
- **Git Hooks**: Pre-commit linting, testing, and type checking

### 2. Dependency Management Strategy
- **Core Dependencies**: Next.js, React, TypeScript with locked versions
- **Processing Libraries**: Compromise.js or natural.js with performance comparisons
- **Styling Dependencies**: Tailwind CSS, PostCSS plugins, custom font integration
- **Development Tools**: Testing frameworks, build analyzers, performance monitoring
- **Bundle Size Optimization**: Tree shaking, code splitting, lazy loading strategies

### 3. Component Architecture Design
- **Design System Components**: Reusable notebook-themed UI components
- **Text Processing Components**: Input/output panes, format selection, preview system
- **Custom Hooks**: Text processing logic, local storage management, format detection
- **Context Architecture**: Global state management with type-safe contexts
- **Error Boundaries**: Component-level error handling and recovery

### 4. Performance & Optimization Requirements
- **Processing Benchmarks**: Sub-100ms processing for <10KB text, scalable algorithms
- **Bundle Size Targets**: <500KB initial bundle, optimal code splitting
- **Core Web Vitals**: LCP <2.5s, FID <100ms, CLS <0.1
- **Memory Usage**: Efficient processing with <50MB peak usage for large texts
- **Browser Compatibility**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)

### 5. Testing & Quality Assurance Strategy
- **Unit Testing**: Jest configuration for text processing algorithms and utilities
- **Component Testing**: React Testing Library for UI component validation
- **Integration Testing**: Playwright for end-to-end user workflow testing
- **Performance Testing**: Lighthouse CI integration and automated performance monitoring
- **Type Safety**: TypeScript strict mode with comprehensive interface coverage

## Expected Deliverables

### Primary Technical Specification Document
A comprehensive implementation guide containing:

#### 1. Executive Summary & Architecture Overview (800 words)
- Project scope and technical approach with technology justification
- High-level system architecture diagram with component relationships
- Key technical decisions and trade-offs with rationale
- Success metrics and performance targets with measurement strategies

#### 2. Project Setup & Configuration (1200 words)
- **Development Environment Setup**: Step-by-step Node.js, pnpm, and project initialization
- **Package.json Configuration**: Complete dependency list with versions and scripts
- **TypeScript Configuration**: tsconfig.json with strict settings and path mapping
- **Next.js Configuration**: next.config.ts with optimization settings and build configuration
- **Tooling Setup**: ESLint, Prettier, Husky, lint-staged configuration files

#### 3. System Architecture & File Structure (1500 words)
- **Directory Organization**: Detailed folder structure with purpose explanations
- **Component Hierarchy**: Visual diagram of React component relationships
- **State Management Flow**: Context providers and data flow architecture
- **Module Organization**: Import/export patterns and dependency management
- **Configuration Files**: All necessary config files with complete settings

#### 4. Text Processing Engine Implementation (2000 words)
- **Algorithm Design**: Pattern recognition logic with specific implementation details
- **Library Integration**: Compromise.js or alternative NLP library implementation
- **Processing Pipeline**: Step-by-step text transformation workflow
- **Performance Optimization**: Caching, memoization, and Web Workers integration
- **Content Type Handlers**: Specific processors for each of the 6 formatting modes
- **Error Handling**: Graceful degradation and user feedback mechanisms

#### 5. Component Implementation Details (1800 words)
- **Core Components**: TextInput, OutputPreview, FormatSelector with props and interfaces
- **Custom Hooks**: useTextProcessor, useLocalStorage, useFormatDetection implementations
- **Context Providers**: FormattingContext, UserPreferencesContext with TypeScript definitions
- **UI Components**: Notebook-themed design system components with Tailwind classes
- **Responsive Design**: Breakpoint strategies and mobile-first implementation

#### 6. Styling & Design System (1200 words)
- **Tailwind Configuration**: Custom color palette, fonts, and component classes
- **CSS Implementation**: Custom CSS for notebook effects, paper textures, animations
- **Typography System**: Font loading, fallbacks, and handwritten font integration
- **Animation Framework**: Transition specifications and performance considerations
- **Responsive Strategy**: Mobile adaptations and touch-friendly interactions

#### 7. Build Pipeline & Deployment (1000 words)
- **Development Scripts**: pnpm commands for dev, build, test, and analysis
- **Build Configuration**: Next.js optimization settings and static export configuration
- **Bundle Analysis**: Tools and strategies for monitoring bundle size and performance
- **Deployment Strategy**: Static hosting options with CDN optimization
- **CI/CD Pipeline**: GitHub Actions or similar for automated testing and deployment

#### 8. Testing Implementation (1000 words)
- **Test Configuration**: Jest setup with Next.js and TypeScript integration
- **Unit Test Examples**: Text processing algorithm tests with sample data
- **Component Test Examples**: React Testing Library tests for key components
- **E2E Test Strategy**: Playwright configuration and critical user journey tests
- **Performance Monitoring**: Lighthouse CI setup and Core Web Vitals tracking

### Advanced Technical Implementation Starter Files
Generate production-ready starter code with modern patterns:

#### Package Configuration (Enhanced for 2024/2025)
- `package.json` - Complete dependency list with pnpm workspace configuration and React 18 optimizations
- `pnpm-lock.yaml` - Lock file structure explanation with performance considerations
- `pnpm-workspace.yaml` - Workspace configuration for modular text processor development

#### Next.js Configuration
- `next.config.ts` - Optimized build configuration with Turbopack settings
- `tsconfig.json` - Strict TypeScript configuration with path mapping
- `tailwind.config.ts` - Custom theme with notebook aesthetic colors and fonts
- `postcss.config.mjs` - PostCSS plugin configuration

#### Development Configuration
- `.eslintrc.json` - Comprehensive linting rules for Next.js and TypeScript
- `.prettierrc` - Code formatting configuration
- `jest.config.js` - Testing framework setup with Next.js integration
- `.gitignore` - Appropriate ignore patterns for Next.js projects

#### Enhanced Core Implementation Files
- `src/types/index.ts` - Comprehensive TypeScript definitions with concurrent processing types
- `src/hooks/useTextProcessor.ts` - Advanced text processing hook with React 18 concurrent features
- `src/hooks/useWebWorkerPool.ts` - Web Worker pool management with lifecycle handling
- `src/contexts/FormattingContext.tsx` - Concurrent-aware global state management
- `src/workers/textProcessor.worker.ts` - Advanced Web Worker with transferable objects
- `src/utils/patternRecognition.ts` - Streaming pattern detection with performance optimization
- `src/utils/concurrentHelpers.ts` - React 18 concurrent feature utilities
- `src/components/TextFormatter/index.tsx` - Progressive enhancement component architecture
- `src/components/ProcessingIndicator.tsx` - Concurrent processing state visualization

## Quality Assurance & Validation Criteria

### Technical Success Metrics
1. **Processing Performance**: <100ms for <10KB text input with 95% accuracy
2. **Bundle Optimization**: Initial load <500KB, subsequent loads <100KB
3. **Type Safety**: 100% TypeScript coverage with strict mode enabled
4. **Browser Compatibility**: Consistent functionality across target browsers
5. **Accessibility**: WCAG 2.1 AA compliance with automated testing validation

### Code Quality Standards
- **TypeScript Strict Mode**: All files must pass strict type checking
- **ESLint Compliance**: Zero linting errors with comprehensive rule set
- **Test Coverage**: >80% unit test coverage for critical functions
- **Performance Budgets**: Lighthouse scores >90 for all metrics
- **Documentation**: Comprehensive JSDoc comments and README files

### Architectural Validation
- **Separation of Concerns**: Clear boundaries between processing, UI, and state management
- **Scalability**: Extensible architecture for additional formatting modes
- **Maintainability**: Clear code organization with consistent patterns
- **Error Resilience**: Graceful handling of edge cases and invalid inputs
- **Performance Monitoring**: Built-in analytics for processing performance tracking

## Analysis & Implementation Methodology

### Phase 1: Architecture Planning (Week 1)
1. **Technology Stack Finalization**: Library selection and version locking
2. **Component Architecture Design**: Detailed component hierarchy and interfaces
3. **State Management Strategy**: Context design and data flow planning
4. **Performance Requirements**: Benchmark setting and optimization strategy

### Phase 2: Core Implementation (Weeks 2-3)
1. **Project Setup**: Environment configuration and toolchain setup
2. **Text Processing Engine**: Algorithm implementation and optimization
3. **Core Components**: Input/output interface and format selection system
4. **Design System**: Notebook aesthetic implementation with Tailwind

### Phase 3: Integration & Testing (Week 4)
1. **Component Integration**: Full application assembly and testing
2. **Performance Optimization**: Bundle analysis and optimization implementation
3. **Accessibility Implementation**: WCAG compliance and keyboard navigation
4. **Cross-browser Testing**: Compatibility validation and polyfill integration

### Phase 4: Deployment & Monitoring (Week 5)
1. **Build Pipeline Setup**: CI/CD configuration and automated testing
2. **Performance Monitoring**: Analytics integration and monitoring setup
3. **Documentation**: Technical documentation and user guide creation
4. **Production Deployment**: Static hosting setup with CDN optimization

---

## Processing Instructions for Technical Specification Generation

**CRITICAL IMPLEMENTATION REQUIREMENTS:**

1. **Technology-First Approach**: Every recommendation must specify exact versions, configurations, and implementation details
2. **pnpm Optimization**: All package management must leverage pnpm workspaces and optimization features
3. **Next.js 15.5 Features**: Utilize App Router, Turbopack, and latest React 18 concurrent features
4. **Performance Focus**: Every component and algorithm must meet specified performance benchmarks
5. **Production Readiness**: All code examples and configurations must be production-ready with error handling
6. **TypeScript Strict Mode**: Complete type safety with comprehensive interface definitions
7. **Accessibility First**: WCAG 2.1 AA compliance built into every component and interaction

## Advanced Implementation Patterns (2024/2025 Standards)

### React 18 Concurrent Text Processing Pattern
```typescript
// Enhanced useTextProcessor hook with concurrent features
const useTextProcessor = () => {
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState('');
  const [processedResult, setProcessedResult] = useState(null);
  const deferredText = useDeferredValue(text);
  
  const handleTextChange = useCallback((newText: string) => {
    setText(newText); // Immediate UI update
    startTransition(() => {
      // Heavy processing in background
      processTextWithWorker(newText);
    });
  }, []);
  
  return { text, processedResult, isPending, handleTextChange };
};
```

### Modern Web Worker Pool Implementation
```typescript
// Advanced worker pool with lifecycle management
class TextProcessorWorkerPool {
  private workers: Worker[] = [];
  private taskQueue: ProcessingTask[] = [];
  
  async processText(text: string, formatType: string): Promise<ProcessedText> {
    const worker = this.getAvailableWorker();
    return new Promise((resolve, reject) => {
      worker.postMessage(
        { text, formatType }, 
        // Use transferable objects for large text
        [new TextEncoder().encode(text).buffer]
      );
      worker.onmessage = (e) => resolve(e.data);
      worker.onerror = reject;
    });
  }
}
```

### Progressive Enhancement Architecture
```typescript
// Layered functionality approach
const TextFormatter = () => {
  const [enhancementLevel, setEnhancementLevel] = useState('basic');
  
  // Level 1: Basic functionality (works without JS)
  const BasicFormatter = () => <textarea />;
  
  // Level 2: Enhanced with pattern recognition
  const EnhancedFormatter = () => {
    const { processedText } = useTextProcessor();
    return <DualPaneInterface />;
  };
  
  // Level 3: Advanced with Web Workers and concurrent processing
  const AdvancedFormatter = () => {
    return (
      <Suspense fallback={<ProcessingIndicator />}>
        <ConcurrentTextProcessor />
      </Suspense>
    );
  };
};
```

**Begin comprehensive technical specification generation now, implementing Feature-Driven Development methodology with React 18 concurrent features, advanced Web Worker patterns, and progressive enhancement architecture for building a cutting-edge text formatting application that leverages 2024/2025 best practices.**
