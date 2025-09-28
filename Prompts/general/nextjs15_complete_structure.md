# Next.js 15+ Project Structure Guide

A clean, production-ready Next.js 15+ project structure with App Router, following modern best practices for scalable development.

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Package Manager**: pnpm (recommended) / npm / yarn
- **Styling**: Tailwind CSS + CSS Modules
- **State Management**: Zustand / Context API
- **Data Fetching**: React Query + Fetch API
- **Form Handling**: React Hook Form + Zod
- **Testing**: Vitest + Playwright

## Project Directory Structure

```
nextjs-project/
├── public/                           # Static assets served directly
│   ├── images/                       # Image assets and graphics
│   ├── icons/                        # Favicons and PWA icons
│   ├── fonts/                        # Custom font files
│   └── documents/                    # PDFs and downloadable files
├── src/                              # Source code directory
│   ├── app/                          # App Router directory (Next.js 15+)
│   │   ├── (auth)/                   # Route group for authentication pages
│   │   │   ├── login/                # Login page with loading/error states
│   │   │   ├── register/             # Registration page
│   │   │   └── layout.tsx            # Auth layout wrapper
│   │   ├── (dashboard)/              # Route group for protected pages
│   │   │   ├── dashboard/            # Main dashboard page
│   │   │   ├── profile/              # User profile management
│   │   │   └── layout.tsx            # Dashboard layout with navigation
│   │   ├── (marketing)/              # Route group for public pages
│   │   │   ├── about/                # About page
│   │   │   ├── contact/              # Contact page
│   │   │   └── blog/                 # Blog section with dynamic routes
│   │   ├── api/                      # API routes and server endpoints
│   │   │   ├── auth/                 # Authentication API endpoints
│   │   │   ├── users/                # User management APIs
│   │   │   └── upload/               # File upload handling
│   │   ├── @modal/                   # Parallel routes for modals
│   │   ├── _actions/                 # Server Actions (private folder)
│   │   ├── _lib/                     # Server-side utilities (private)
│   │   ├── layout.tsx                # Root layout component
│   │   ├── page.tsx                  # Home page
│   │   ├── loading.tsx               # Global loading UI
│   │   ├── error.tsx                 # Global error boundary
│   │   └── not-found.tsx             # 404 page
│   ├── components/                   # React components
│   │   ├── ui/                       # Base UI components (buttons, inputs, cards)
│   │   ├── layout/                   # Layout components (header, footer, sidebar)
│   │   ├── forms/                    # Form-specific components
│   │   ├── common/                   # Shared components (loading, error states)
│   │   ├── providers/                # Context providers and wrappers
│   │   └── features/                 # Feature-specific components
│   ├── hooks/                        # Custom React hooks
│   │   ├── auth/                     # Authentication hooks
│   │   ├── api/                      # Data fetching hooks
│   │   ├── ui/                       # UI state management hooks
│   │   └── utils/                    # Utility hooks (debounce, localStorage)
│   ├── lib/                          # Client-side utilities and configuration
│   │   ├── api.ts                    # API client setup
│   │   ├── auth.ts                   # Authentication utilities
│   │   ├── utils.ts                  # General helper functions
│   │   ├── constants.ts              # Application constants
│   │   └── validations.ts            # Validation schemas and utilities
│   ├── store/                        # State management
│   │   ├── slices/                   # State slices (auth, ui, user data)
│   │   ├── providers/                # Store providers and middleware
│   │   └── index.ts                  # Store configuration and exports
│   ├── types/                        # TypeScript type definitions
│   │   ├── auth.ts                   # Authentication types
│   │   ├── api.ts                    # API request/response types
│   │   ├── components.ts             # Component prop types
│   │   └── global.ts                 # Global type definitions
│   ├── styles/                       # Styling files
│   │   ├── globals.css               # Global CSS and Tailwind imports
│   │   ├── components.css            # Component-specific styles
│   │   └── themes/                   # Theme definitions (light/dark)
│   └── utils/                        # Pure utility functions
│       ├── date.ts                   # Date manipulation helpers
│       ├── string.ts                 # String formatting utilities
│       ├── array.ts                  # Array processing helpers
│       └── formatters.ts             # Data formatting functions
├── middleware.ts                     # Next.js middleware for auth/routing
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # Dependencies and scripts
├── .env.local                        # Local environment variables
├── .env.example                      # Environment variables template
└── README.md                         # Project documentation
```

## Directory Explanations

### App Directory (`src/app/`)
Next.js App Router with file-based routing system. Route groups organize pages without affecting URLs, while special files handle loading, error, and layout states.

### Components (`src/components/`)
Reusable React components organized by purpose - UI elements, layout structures, forms, shared utilities, and feature-specific components.

### Hooks (`src/hooks/`)
Custom React hooks for authentication, API interactions, UI state management, and utility functions like debouncing and local storage.

### Lib (`src/lib/`)
Client-side configuration and utilities including API setup, authentication helpers, validation schemas, and general purpose functions.

### Store (`src/store/`)
Global state management using Zustand or similar, with organized slices for different data domains and provider components.

### Types (`src/types/`)
TypeScript definitions for authentication, API interactions, component props, and global application types.

### Styles (`src/styles/`)
CSS files including global styles, Tailwind imports, component-specific styling, and theme configurations.

### Utils (`src/utils/`)
Pure utility functions for data manipulation, formatting, and processing that don't depend on React or Next.js APIs.

## Key Features

- **App Router**: File-based routing with layouts, loading states, and error boundaries
- **Route Groups**: Organize pages without affecting URL structure
- **Server Actions**: Direct server-side functions for form handling and mutations
- **Parallel Routes**: Modal and overlay patterns with intercepting routes
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Mobile-first approach with Tailwind CSS utilities

This structure supports projects from small applications to large-scale systems while maintaining clarity and development efficiency.