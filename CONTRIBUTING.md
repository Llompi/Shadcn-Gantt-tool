# Contributing to Gantt Project Manager

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and configure your Baserow credentials
4. Start the development server: `npm run dev`

## Code Style

This project uses:
- **ESLint** for code quality
- **Prettier** for code formatting
- **TypeScript** in strict mode

Before committing:
```bash
npm run lint        # Check for linting errors
npm run type-check  # Check for TypeScript errors
```

## Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the code style

3. Test your changes thoroughly:
   - Manual testing in the UI
   - Verify API endpoints work correctly
   - Check console for errors

4. Commit with clear, descriptive messages:
   ```bash
   git commit -m "feat: add task filtering by status"
   ```

## Pull Request Process

1. Update the README.md if you've added new features
2. Ensure all tests pass and there are no linting errors
3. Push to your fork and submit a pull request
4. Wait for review and address any feedback

## Commit Message Convention

Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Adding New Features

### Adding a New Data Provider

1. Create a new provider class implementing `IDataProvider`
2. Add it to `lib/providers/`
3. Update `provider-factory.ts`
4. Document the setup in README.md

### Adding New Fields

1. Update `types/task.ts`
2. Update field mapping in `lib/providers/baserow/field-mapping.ts`
3. Update mapper methods in the provider
4. Update UI components if needed

## Questions?

Open an issue for discussion before starting major changes.
