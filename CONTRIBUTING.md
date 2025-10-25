# Contributing to Gantt Project Manager

Thank you for your interest in contributing! This document provides comprehensive guidelines for both humans and AI tools contributing to this project.

## Table of Contents
- [Quick Start for Contributors](#quick-start-for-contributors)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Commit Message Convention](#commit-message-convention)
- [Testing Guidelines](#testing-guidelines)
- [Adding New Features](#adding-new-features)
- [Documentation Requirements](#documentation-requirements)
- [AI Tool Collaboration](#ai-tool-collaboration)

## Quick Start for Contributors

### For Human Contributors
1. Check [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current goals and priorities
2. Review [ROADMAP.md](./ROADMAP.md) to understand the project direction
3. Look at open issues tagged with `good first issue` or `help wanted`
4. Read the full development setup below

### For AI Tools
1. **Always read** [AI_COLLABORATION.md](./AI_COLLABORATION.md) before starting work
2. **Check** [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current priorities and active work
3. **Update** PROJECT_STATUS.md when starting or completing tasks
4. **Follow** the commit message conventions strictly
5. **Document** all changes in your PR description

## Development Setup

### Prerequisites
- Node.js 18+ and npm/pnpm
- Git 2.0+
- A Baserow account (for testing) or use demo mode
- Code editor with TypeScript support (VS Code recommended)

### Initial Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/Shadcn-Gantt-tool.git
   cd Shadcn-Gantt-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:
   ```env
   # For Baserow connection
   BASEROW_BASE_URL=https://api.baserow.io
   BASEROW_TOKEN=your_token_here
   BASEROW_TABLE_ID_TASKS=12345
   BASEROW_TABLE_ID_STATUSES=12346
   DATA_PROVIDER=baserow

   # Or use demo mode for development
   DATA_PROVIDER=demo
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000/gantt](http://localhost:3000/gantt) to see the Gantt chart.

### Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Run production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run type-check       # TypeScript type checking
npm run format           # Format with Prettier
npm run format:check     # Check formatting

# Full Quality Check (run before committing)
npm run lint && npm run type-check && npm run format:check
```

## Code Standards

### TypeScript
- **Strict mode enabled** - No implicit `any` types
- **Type everything** - Interfaces for all data structures
- **Use type guards** - For runtime type checking
- **Avoid `as` casting** - Prefer type guards and proper types

### Code Style
- **ESLint** for code quality (see `.eslintrc.json`)
- **Prettier** for formatting (see `.prettierrc`)
- **2 spaces** for indentation
- **Single quotes** for strings
- **Semicolons** required
- **Trailing commas** in multiline objects/arrays

### File Organization
```
app/                    # Next.js app router pages
├── api/                # API routes
└── gantt/              # Gantt page
components/             # React components
├── ui/                 # shadcn/ui components
└── gantt/              # Gantt-specific components
lib/                    # Utilities and core logic
├── providers/          # Data provider implementations
└── utils/              # Helper functions
types/                  # TypeScript type definitions
docs/                   # Documentation
```

### Naming Conventions
- **Files**: `kebab-case.ts` (e.g., `task-provider.ts`)
- **Components**: `PascalCase.tsx` (e.g., `GanttChart.tsx`)
- **Functions**: `camelCase` (e.g., `fetchTasks()`)
- **Types/Interfaces**: `PascalCase` (e.g., `Task`, `IDataProvider`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_PAGE_SIZE`)

## Making Changes

### Workflow

1. **Check current work**
   ```bash
   # Read PROJECT_STATUS.md to see what's being worked on
   cat PROJECT_STATUS.md
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or for bug fixes
   git checkout -b fix/bug-description
   ```

3. **Make your changes**
   - Write clean, documented code
   - Follow the code standards above
   - Add types for all new code
   - Update tests if applicable

4. **Test thoroughly**
   - Manual testing in the UI
   - Test API endpoints with different data
   - Check browser console for errors
   - Test edge cases and error handling
   - Verify responsive design on different screen sizes

5. **Check code quality**
   ```bash
   npm run lint
   npm run type-check
   npm run format:check
   ```

6. **Update documentation**
   - Update README.md for new features
   - Add inline code comments for complex logic
   - Update PROJECT_STATUS.md if completing a goal
   - Add entry to CHANGELOG.md

7. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add task filtering by status"
   ```

## Pull Request Process

### Before Submitting

- [ ] All tests pass and no linting errors
- [ ] Code is formatted with Prettier
- [ ] TypeScript compiles without errors
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] PROJECT_STATUS.md updated if needed
- [ ] Commit messages follow convention

### Submitting a PR

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub with:
   - **Clear title** following commit convention
   - **Description** of changes and motivation
   - **Screenshots** for UI changes
   - **Testing notes** - how to test the changes
   - **Breaking changes** - if any
   - **Related issues** - link to issues this resolves

3. **PR Template** (filled automatically):
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - Tested manually in development
   - Tested with [specific data/scenarios]

   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented)
   ```

4. **Wait for review** and address feedback promptly

### Review Process

- Maintainers will review within 2-3 business days
- Address all review comments
- Re-request review after making changes
- PRs require at least 1 approval before merging

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format
```
<type>(<scope>): <short summary>

<optional body>

<optional footer>
```

### Types
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, semicolons, etc.)
- `refactor:` - Code refactoring (no functional changes)
- `perf:` - Performance improvement
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks (deps, config, etc.)
- `ci:` - CI/CD changes
- `build:` - Build system changes

### Scope (optional)
- `api` - API routes
- `gantt` - Gantt chart component
- `provider` - Data provider
- `ui` - UI components
- `types` - TypeScript types
- `docs` - Documentation

### Examples
```bash
# Feature
git commit -m "feat(gantt): add task filtering by status"

# Bug fix
git commit -m "fix(api): handle null dates in task response"

# Documentation
git commit -m "docs: update deployment instructions for Vercel"

# Refactoring
git commit -m "refactor(provider): extract common pagination logic"

# Breaking change
git commit -m "feat(api)!: change task response format

BREAKING CHANGE: Task dates now return ISO strings instead of timestamps"
```

### Why Conventional Commits?
- Automatic CHANGELOG generation
- Semantic versioning automation
- Easy to scan commit history
- Better collaboration with AI tools

## Testing Guidelines

### Manual Testing Checklist
- [ ] UI renders correctly on desktop and mobile
- [ ] All interactive elements work (drag, resize, click)
- [ ] Data loads correctly from provider
- [ ] Error states display properly
- [ ] Loading states show during data fetch
- [ ] Console has no errors or warnings
- [ ] Performance is acceptable with 100+ tasks

### Testing New Features
1. Test happy path (expected use)
2. Test edge cases (empty data, large data)
3. Test error cases (network errors, invalid data)
4. Test cross-browser (Chrome, Firefox, Safari)
5. Test mobile responsiveness

### Future: Automated Testing
We plan to add:
- Unit tests with Jest
- Integration tests with React Testing Library
- E2E tests with Playwright

## Adding New Features

### Adding a New Data Provider

1. **Create provider class**
   ```typescript
   // lib/providers/your-provider/your-provider.ts
   import { IDataProvider } from '../types';

   export class YourProvider implements IDataProvider {
     async getTasks(params) { /* ... */ }
     async getTask(id) { /* ... */ }
     async createTask(task) { /* ... */ }
     async updateTask(id, updates) { /* ... */ }
     async deleteTask(id) { /* ... */ }
     async getStatuses() { /* ... */ }
   }
   ```

2. **Add to provider factory**
   ```typescript
   // lib/providers/provider-factory.ts
   import { YourProvider } from './your-provider/your-provider';

   export function createProvider(): IDataProvider {
     switch (process.env.DATA_PROVIDER) {
       case 'your-provider':
         return new YourProvider();
       // ...
     }
   }
   ```

3. **Document setup** in README.md and create a guide in `docs/YOUR_PROVIDER_SETUP.md`

4. **Update PROJECT_STATUS.md** to reflect completion

### Adding New Task Fields

1. **Update type definition**
   ```typescript
   // types/task.ts
   export interface Task {
     // ... existing fields
     newField: string;
   }
   ```

2. **Update field mapping** (for Baserow/external providers)
   ```typescript
   // lib/providers/baserow/field-mapping.ts
   export const DEFAULT_FIELD_MAPPING = {
     tasks: {
       // ... existing mappings
       newField: 'New Field Name',
     }
   }
   ```

3. **Update provider mapper**
   ```typescript
   // lib/providers/baserow/baserow-provider.ts
   private mapBaserowToTask(row: any): Task {
     return {
       // ... existing mappings
       newField: row[this.fieldMapping.tasks.newField] || '',
     };
   }
   ```

4. **Update UI components** if the field needs to be displayed

### Adding UI Components

1. Place in appropriate directory:
   - `components/ui/` - Reusable UI primitives
   - `components/gantt/` - Gantt-specific components

2. Use TypeScript and proper typing

3. Follow shadcn/ui patterns for consistency

4. Document props with JSDoc comments

## Documentation Requirements

### Code Documentation
- **JSDoc comments** for all public functions
- **Inline comments** for complex logic
- **Type annotations** for all parameters and returns

Example:
```typescript
/**
 * Fetches tasks from the data provider with pagination
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Promise resolving to tasks and pagination info
 */
async function getTasks(page: number, pageSize: number): Promise<TasksResponse> {
  // Implementation
}
```

### File Documentation
Add a header comment to new files:
```typescript
/**
 * @file task-provider.ts
 * @description Provides task data from various sources
 * @author Your Name
 * @created 2025-01-15
 */
```

### Feature Documentation
For new features, update:
1. **README.md** - User-facing documentation
2. **docs/** - Detailed guides if needed
3. **Code comments** - Implementation details
4. **PROJECT_STATUS.md** - Mark feature as completed

## AI Tool Collaboration

### For AI Tools Working on This Project

See [AI_COLLABORATION.md](./AI_COLLABORATION.md) for detailed instructions.

**Quick checklist:**
- [ ] Read PROJECT_STATUS.md before starting
- [ ] Check for conflicts with ongoing work
- [ ] Update PROJECT_STATUS.md when starting a task
- [ ] Follow commit conventions exactly
- [ ] Document all changes clearly
- [ ] Update CHANGELOG.md
- [ ] Mark tasks as completed in PROJECT_STATUS.md

### For Humans Working with AI Tools

- **Check PROJECT_STATUS.md** before assigning work to AI
- **Be specific** in instructions to AI tools
- **Review AI contributions** carefully
- **Provide feedback** on AI-generated code
- **Update documentation** if AI misses anything

## Git Best Practices

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring
- `chore/description` - Maintenance

### Commit Hygiene
- **One logical change per commit**
- **Clear, descriptive messages**
- **Test before committing**
- **No secrets in commits** (use .env files)

### Before Pushing
```bash
# Update from main
git fetch origin
git rebase origin/main

# Run quality checks
npm run lint && npm run type-check

# Push
git push origin feature/your-feature
```

## Questions or Issues?

- **Questions**: Open a discussion on GitHub
- **Bugs**: Open an issue with bug report template
- **Features**: Open an issue with feature request template
- **Security**: Email maintainers (see SECURITY.md if available)

## Code of Conduct

- Be respectful and professional
- Provide constructive feedback
- Help others learn and grow
- Follow project guidelines
- Report inappropriate behavior to maintainers

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- CHANGELOG.md for significant contributions
- Project documentation for major features

Thank you for contributing to Gantt Project Manager!

---

**Last Updated**: 2025-10-24
**Maintainers**: See [PROJECT_STATUS.md](./PROJECT_STATUS.md)
