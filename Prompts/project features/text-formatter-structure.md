# Text Formatter - Next.js 15.5 Project Structure

A production-ready Next.js 15.5 project structure for a browser-based text formatting and organization tool with intelligent pattern recognition and notebook aesthetic design.

## Project Overview

**Application Type**: Client-side text processing tool with real-time formatting capabilities  
**Framework**: Next.js 15.5 with App Router and Turbopack  
**Architecture**: Feature-Driven Development with concurrent processing  
**Styling**: Notebook aesthetic with warm orange theme using Tailwind CSS  
**Processing**: Web Workers with React 18 concurrent features for non-blocking text analysis  

## Tech Stack Configuration

- **Framework**: Next.js 15.5 with App Router and Turbopack
- **Runtime**: React 18+ with concurrent features (useTransition, useDeferredValue)
- **Language**: TypeScript 5.0+ with strict mode
- **Package Manager**: pnpm 9.0+ with workspace optimization
- **Styling**: Tailwind CSS 3.4+ with custom notebook theme + PostCSS
- **Text Processing**: Compromise.js or natural.js for client-side NLP
- **State Management**: React Context API with concurrent-aware patterns
- **Testing**: Jest + React Testing Library + Playwright
- **Build Tools**: ESBuild/SWC with bundle analysis

## Project Directory Structure

```
text-formatter/
├── public/                                  # Static assets for notebook aesthetic
│   ├── fonts/                              # Handwritten & serif fonts for notebook theme
│   ├── images/                             # Paper textures, spiral binding, notebook visuals
│   └── sounds/                             # Optional typewriter/writing sound effects
├── src/
│   ├── app/                                # Next.js 15+ App Router structure
│   │   ├── (formatter)/                    # Main app route group - dual-pane text formatter
│   │   │   ├── history/                    # Format history and saved transformations
│   │   │   └── templates/                  # Custom formatting template management
│   │   ├── @modal/                         # Parallel routes - format settings, export, help modals
│   │   └── api/                            # Optional API routes for advanced processing
│   ├── components/
│   │   ├── ui/                             # Base notebook-themed components (buttons, inputs, cards)
│   │   ├── layout/                         # App structure - header, footer, navigation
│   │   ├── formatter/                      # Core dual-pane interface components
│   │   │   ├── TextInput/                  # Left pane - text input with paste/upload features
│   │   │   ├── TextOutput/                 # Right pane - formatted output with export options
│   │   │   ├── FormatSelector/             # Format mode picker with auto-detection
│   │   │   ├── ProcessingIndicator/        # Real-time processing status and confidence scores
│   │   │   └── ExportOptions/              # Copy, download, print functionality
│   │   ├── formatters/                     # The 6 format-specific components
│   │   │   ├── MeetingNotes/               # Extract attendees, agenda, action items
│   │   │   ├── TaskLists/                  # Convert to todos with priority/categories
│   │   │   ├── JournalNotes/               # Structure paragraphs, timestamps, insights
│   │   │   ├── ShoppingLists/              # Organize by categories, remove duplicates
│   │   │   ├── ResearchNotes/              # Structure citations, references, topics
│   │   │   └── StudyNotes/                 # Convert to outlines, Q&A, definitions
│   │   ├── providers/                      # Context providers for global state
│   │   └── features/                       # Advanced features - history, templates, analytics
│   ├── hooks/                              # Custom React hooks with concurrent processing
│   │   ├── formatting/                     # Text processing hooks with Web Workers integration
│   │   ├── workers/                        # Web Worker pool management hooks
│   │   ├── ui/                             # Dual-pane interface and notebook theme hooks
│   │   ├── storage/                        # Local storage for history and preferences
│   │   └── utils/                          # Performance hooks - debounce, throttle, async state
│   ├── lib/                                # Core business logic and utilities
│   │   ├── formatting/                     # Text processing algorithms and format pipelines
│   │   ├── nlp/                            # Pattern recognition and content classification
│   │   ├── theme/                          # Notebook aesthetic configuration (colors, fonts, textures)
│   │   ├── performance/                    # React 18 concurrent helpers and optimization
│   │   └── export/                         # File generation and clipboard utilities
│   ├── workers/                            # Web Workers for heavy text processing
│   │   ├── formatters/                     # Individual workers for each of the 6 format types
│   │   └── utils/                          # Worker base classes and communication helpers
│   ├── types/                              # TypeScript definitions for the entire app
│   ├── styles/                             # CSS and styling files
│   │   ├── textures/                       # Paper backgrounds, spiral binding, torn edges
│   │   └── ...                             # Global styles, component styles, typography
│   └── utils/                              # Pure utility functions
│       ├── text/                           # String processing, pattern matching, validation
│       ├── date/                           # Date/time parsing and formatting utilities
│       ├── array/                          # List processing, deduplication, sorting
│       └── performance/                    # Memoization, batching, optimization helpers
├── tests/                                  # Testing structure
│   ├── components/                         # UI component tests
│   ├── hooks/                              # Custom hook tests
│   ├── workers/                            # Web Worker tests
│   └── e2e/                                # End-to-end user workflow tests
└── [config files]                         # Next.js, TypeScript, Tailwind, testing configs
```

## Key Architecture Patterns

### Feature-Driven Development Structure
- **Phase 1**: Core formatting with Meeting Notes (`/components/formatters/MeetingNotes/`)
- **Phase 2**: Expand to Task Lists and Shopping Lists (`/formatters/TaskLists/`, `/formatters/ShoppingLists/`)
- **Phase 3**: Complete format suite with advanced features
- **Phase 4**: Performance optimization and production polish

### Concurrent Processing Architecture
- **Web Workers**: Dedicated workers for each format type in `/workers/formatters/`
- **React 18 Features**: `useTransition` and `useDeferredValue` in processing hooks
- **Worker Pool Management**: Efficient worker lifecycle in `/hooks/workers/`
- **Transferable Objects**: Large text processing optimization

### Notebook Aesthetic Integration
- **Theme System**: Comprehensive theming in `/lib/theme/` and `/styles/`
- **Custom Components**: Notebook-styled UI components in `/components/ui/`
- **Visual Effects**: Paper textures and spiral binding in `/styles/textures/`
- **Typography**: Handwritten fonts and clean serif combinations

## Critical Implementation Features

### Text Processing Pipeline
1. **Input Analysis** (`/lib/nlp/content-classifiers.ts`)
2. **Pattern Recognition** (`/workers/patternRecognition.worker.ts`)
3. **Format Application** (`/workers/formatters/*.worker.ts`)
4. **Real-time Preview** (`/components/formatter/TextOutput/`)
5. **Export Generation** (`/lib/export/file-generators.ts`)

### Performance Optimization
- **Bundle Splitting**: Format-specific code splitting by worker
- **Lazy Loading**: Format components loaded on demand
- **Concurrent Updates**: Non-blocking UI updates during processing
- **Memory Management**: Efficient handling of large text inputs
- **Caching Strategy**: Format result and pattern recognition caching

### User Experience Flow
- **Dual-Pane Interface**: Side-by-side input/output comparison
- **Auto-Detection**: Intelligent format suggestion with confidence scoring
- **Manual Override**: User format selection with live preview
- **Export Options**: Copy, download, and print with multiple formats
- **Format History**: Recent transformations and custom templates

### Development Workflow
- **pnpm Workspaces**: Modular development with shared dependencies
- **TypeScript Strict**: Complete type safety with concurrent features
- **Testing Strategy**: Unit, component, and E2E testing coverage
- **Hot Reloading**: Fast development with Turbopack integration

This structure supports the complete text formatting application with intelligent pattern recognition, notebook aesthetic design, and modern concurrent processing capabilities while maintaining scalability and development efficiency.
