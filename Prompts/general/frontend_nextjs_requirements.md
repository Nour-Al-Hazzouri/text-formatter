# Frontend Requirements - General Next.js Best Practices

## Project Overview
This document outlines general frontend development requirements and best practices for Next.js applications. The guidelines focus on modern web development standards, performance optimization, maintainability, and scalability principles that apply to any Next.js project.

## Core Technology Stack Requirements

### Framework & Language
- **Framework**: Next.js 15+ with App Router (mandatory)
- **Language**: TypeScript (strictly enforced - no plain JavaScript)
- **Package Manager**: pnpm (use pnpm commands, not npm/yarn)
- **Bundler**: Turbopack (significantly improved in Next.js 15+)

### UI & Styling
- **UI Library**: ShadCN UI components (recommended for consistent design systems)
- **Styling**: Tailwind CSS v4 (latest version with improved performance)
- **Design System**: Follow established UI component patterns
- **Responsive Design**: Mobile-first approach, ensure cross-device compatibility

### State & Data Management
- **State Management**: Zustand (lightweight, flexible) or React Context API
- **HTTP Client**: Axios integrated with React Query/TanStack Query for data fetching
- **Form Handling**: React Hook Form with Zod validation for complex forms, React 19 Actions for simple forms
- **Caching**: React Query for API response caching and synchronization

## Project Structure Standards

### File Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`, `NavigationMenu.tsx`)
- **Pages**: `page.tsx` for App Router pages
- **Layouts**: `layout.tsx` for App Router layouts
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`, `useLocalStorage.ts`)
- **Types**: camelCase files with descriptive names (e.g., `user.ts`, `api.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`, `validateEmail.ts`)

### Component Architecture Requirements

#### Server vs Client Component Separation
**CRITICAL**: Server Components and Client Components must be in separate files and clearly distinguished:

- **Server Components (Default)**:
  - No file directive needed
  - Use for data fetching, static content, layouts
  - Cannot use browser-only APIs or event handlers
  - Rendered on the server, reducing bundle size

- **Client Components**:
  - Must include `'use client'` directive at top of file
  - Use for interactivity, event handlers, browser APIs, React hooks
  - Should be pushed to leaf nodes of component tree when possible
  - Keep client components small and focused

#### Component Development Standards
- **React 19 Features**: Leverage improved Suspense, concurrent features, and React Compiler optimizations
- **Server Components First**: Use React Server Components by default where possible
- **Client Components**: Use `'use client'` directive only when necessary for interactivity
- **React Compiler**: Take advantage of automatic optimizations (avoid manual memoization unless needed)
- **Suspense**: Use React 19's enhanced Suspense for better loading states
- **Props Interface**: Always define TypeScript interfaces for component props
- **Default Exports**: Use default exports for page components and layouts
- **Named Exports**: Use named exports for reusable components and utilities

### TypeScript Requirements
- **Strict Mode**: Always use strict TypeScript settings
- **Type Safety**: Define proper interfaces and types for all data structures
- **No `any` Types**: Avoid using `any` - define proper types or use `unknown`
- **Path Mapping**: Use `@/*` imports for cleaner import paths
- **Generic Types**: Use generics for reusable type definitions
- **Type Guards**: Implement type guards for runtime type safety

## Build & Production Readiness

### Build-First Development Philosophy
Writing code with Next.js build considerations from the start is essential for maintaining deployment readiness and preventing production issues. Every line of code should be written to pass Next.js build processes without errors.

#### Next.js Build Requirements
- **Zero Build Errors**: Code must compile successfully with `next build` without any errors
- **TypeScript Compilation**: All TypeScript must compile without errors using Next.js TypeScript integration
- **Server/Client Boundary Validation**: Proper separation between Server and Client Components must be verified at build time
- **Route Validation**: All pages, layouts, and API routes must be properly structured for App Router
- **Import/Export Consistency**: Ensure all imports work correctly in both development and production builds

#### Server Component Build Considerations
- **No Client-Side APIs**: Server Components must not use browser-only APIs or React hooks
- **Async Component Support**: Properly implement async Server Components for data fetching
- **Serializable Props**: All props passed to Client Components must be serializable
- **Import Validation**: Server-only imports must be properly isolated from client bundles
- **Database Connection Handling**: Ensure proper connection management for database queries in Server Components

#### Client Component Build Optimization
- **Bundle Size Monitoring**: Regular monitoring of client bundle sizes with Next.js analyzer
- **Dynamic Imports**: Use Next.js dynamic imports for code splitting optimization
- **Third-Party Library Integration**: Ensure proper tree shaking and bundle optimization for external libraries
- **CSS Optimization**: Leverage Next.js CSS optimization and Tailwind purging in production builds
- **Image Optimization**: Proper usage of Next.js Image component for build-time optimization

#### Environment & Configuration Management
- **Environment Variables**: Proper validation of `NEXT_PUBLIC_` prefixed variables and server-side environment variables
- **Build-Time Configuration**: Clear separation between build-time and runtime configuration
- **Static Generation**: Proper implementation of Static Site Generation (SSG) and Incremental Static Regeneration (ISR)
- **Edge Runtime Compatibility**: Ensure compatibility with Edge Runtime where applicable
- **Middleware Configuration**: Proper middleware setup that works across all deployment environments
#### Production Build Optimization
- **Static Asset Optimization**: Leverage Next.js automatic asset optimization
- **API Route Performance**: Ensure API routes are optimized for production workloads
- **Caching Strategy**: Implement proper caching headers and strategies for static and dynamic content
- **Bundle Analysis**: Regular bundle analysis to identify optimization opportunities
- **Build Performance**: Monitor and optimize build times for faster deployments

## Code Quality Standards

### Form Handling Requirements
- **React Hook Form**: Use for complex forms with multiple validation rules
- **React 19 Actions**: Use for straightforward form submissions with server actions
- **Zod Validation**: All form schemas must use Zod for type-safe validation
- **useFormStatus**: Utilize React 19's useFormStatus hook for form state management
- **useOptimistic**: Use React 19's useOptimistic for optimistic UI updates
- **Error Handling**: Implement comprehensive form error states and messages
- **Loading States**: Include loading indicators during form submission
- **Accessibility**: Ensure forms are accessible with proper labels and ARIA attributes

### Performance Optimization
- **React 19 Compiler**: Leverage automatic optimizations, minimize manual memoization
- **Next.js 15 Features**: Utilize partial prerendering and enhanced caching strategies
- **Core Web Vitals**: Maintain excellent performance metrics
- **Image Optimization**: Use Next.js Image component with proper sizing and formats
- **Code Splitting**: Implement proper code splitting with React 19's improved lazy loading
- **Bundle Analysis**: Regular bundle size analysis and optimization
- **Client-Side Caching**: Optimize caching strategies with React 19 concurrent features

## Data Management & API Integration

### API Integration Standards
- **Error Handling**: Implement robust error handling using React Query error boundaries
- **Loading States**: Always implement loading states for better UX
- **Optimistic Updates**: Use React Query's optimistic updates where appropriate
- **Retry Logic**: Implement appropriate retry logic for failed API calls
- **Request/Response Types**: Define TypeScript types for all API interactions
- **Error Boundaries**: Use React 19's enhanced error boundaries

### State Management Patterns
- **Local State**: Use React's useState for component-specific state
- **Global State**: Use Zustand for application-wide state management
- **Server State**: Use React Query/TanStack Query for server state management
- **Form State**: Use React Hook Form for complex form state
- **URL State**: Use Next.js router for URL-based state management

## UI/UX Standards

### Design Principles
- **Accessibility**: WCAG 2.1 AA compliance minimum
- **Performance**: Optimize for various network conditions and devices
- **Mobile-First**: Prioritize mobile experience in design and development
- **Progressive Enhancement**: Ensure core functionality works without JavaScript
- **Semantic HTML**: Use proper HTML5 semantic elements

### Component Standards
- **Consistent Styling**: Follow established design system patterns
- **Loading States**: Implement skeleton loading and proper loading indicators
- **Error States**: User-friendly error messages and recovery options
- **Empty States**: Meaningful empty state designs and messaging
- **Interactive States**: Clear hover, focus, and active states for all interactive elements

### Responsive Design Requirements
- **Breakpoints**: Use consistent breakpoint system across application
- **Flexible Layouts**: Use CSS Grid and Flexbox for responsive layouts
- **Touch Interactions**: Optimize for touch interfaces with appropriate target sizes
- **Viewport Management**: Proper viewport configuration for mobile devices

## Security & Performance

### Security Best Practices
- **Input Validation**: Client-side validation with server-side verification
- **XSS Prevention**: Sanitize user inputs and outputs
- **CSP Headers**: Implement Content Security Policy headers
- **HTTPS Only**: Ensure all communications use HTTPS
- **Environment Variables**: Proper handling of public vs private environment variables
- **Authentication**: Secure token handling and storage practices

### Performance Requirements
- **Lighthouse Scores**: Maintain high Lighthouse scores across all metrics
- **Time to Interactive**: Minimize time to interactive for better UX
- **Bundle Size**: Keep bundle sizes optimized and monitor growth
- **Lazy Loading**: Implement lazy loading for non-critical resources
- **Prefetching**: Use Next.js prefetching for better navigation performance

## Development Workflow Standards

### Code Quality Assurance
- **Linting**: Use ESLint with Next.js recommended rules
- **Formatting**: Use Prettier for consistent code formatting
- **Type Checking**: Regular TypeScript compilation checks
- **Testing**: Implement appropriate testing strategies (unit, integration, e2e)
- **Code Reviews**: Implement thorough code review processes
### Environment Management
- **Environment Variables**: Clear separation of development, staging, and production configs
- **Build Optimization**: Different optimization strategies per environment
- **Deployment**: Automated deployment pipelines with proper testing gates
- **Monitoring**: Implement error tracking and performance monitoring

## Testing Requirements

### Testing Strategy
- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions and API integrations
- **E2E Tests**: Test complete user workflows
- **Accessibility Tests**: Automated accessibility testing
- **Visual Regression Tests**: Prevent unintended UI changes
- **Performance Tests**: Regular performance regression testing

### Testing Tools & Frameworks
- **Jest**: Unit and integration testing framework
- **React Testing Library**: Component testing utilities
- **Playwright/Cypress**: End-to-end testing
- **Storybook**: Component development and visual testing
- **Lighthouse CI**: Automated performance testing

## Documentation Standards

### Code Documentation
- **Component Documentation**: Document component props, usage, and examples
- **API Documentation**: Document all API integration points
- **Type Documentation**: Document complex TypeScript types and interfaces
- **README Files**: Comprehensive setup and development instructions
- **Changelog**: Maintain detailed changelog for all releases

### Development Documentation
- **Architecture Decisions**: Document major architectural choices
- **Setup Instructions**: Clear development environment setup
- **Deployment Guide**: Step-by-step deployment instructions
- **Troubleshooting**: Common issues and solutions documentation

## AI Assistant Guidelines

When working with these requirements:

### Component Creation Guidelines
1. Always use TypeScript with strict typing
2. Separate server and client components into different files
3. **Prioritize ShadCN UI**: Check `components/ui` folder first and use existing ShadCN components before building custom ones
4. Implement proper loading and error states
5. Follow established project structure
6. Ensure mobile responsiveness
7. Add proper accessibility attributes
8. Use appropriate state management patterns
9. Leverage React 19 and Next.js 15 features

### Code Quality Guidelines
1. Prioritize type safety and clear interfaces
2. Write self-documenting code with descriptive naming
3. Follow established patterns and conventions
4. Consider performance implications
5. Ensure code is maintainable and scalable
6. Implement proper error handling
7. Use React 19 Compiler optimizations effectively

### Best Practice Enforcement
1. Server components by default, client components when needed
2. Proper TypeScript usage without any types
3. React Query for server state management
4. Zod validation for all user inputs
5. Proper accessibility implementation
6. Performance optimization techniques
7. Security best practices implementation

## Quality Assurance Checklist
- [ ] Code compiles without TypeScript errors
- [ ] Next.js builds successfully without errors (`next build`)
- [ ] Server/Client component boundaries are properly defined
- [ ] Components render correctly on all device sizes
- [ ] Forms include proper validation and error handling
- [ ] Error scenarios are handled gracefully
- [ ] Accessibility requirements are met
- [ ] Performance is optimized
- [ ] Code follows project conventions
- [ ] Security best practices are implemented
- [ ] Documentation is complete and accurate
- [ ] Tests are comprehensive and passing

This document serves as a comprehensive guide for frontend development using Next.js, focusing on modern best practices, performance, maintainability, and user experience. The requirements should be adapted based on specific project needs while maintaining the core principles outlined here.