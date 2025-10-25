# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced collaboration documentation for humans and AI tools
  - Comprehensive CONTRIBUTING.md with detailed guidelines
  - AI_COLLABORATION.md with AI-specific workflow instructions
  - PROJECT_STATUS.md for tracking progress and goals
  - ROADMAP.md for long-term planning
  - GitHub issue templates (bug report, feature request, custom)
  - GitHub pull request template
- This CHANGELOG.md file to track all changes

### Changed
- Improved CONTRIBUTING.md with more detailed sections and examples

## [1.0.0] - 2025-10-24

### Added
- Dual-deployment strategy documentation
  - Easy Mode (API Connector) for rapid prototyping
  - Install Mode (Secure Self-Hosted) for sensitive data
- UI configuration capabilities documentation
  - Live editing of connection settings
  - Workspace/table/view selection for Baserow
  - Flexible demo data with CSV/JSON upload support
- Comprehensive deployment guides
  - VERCEL_DEPLOYMENT.md
  - DEPLOYMENT_CHECKLIST.md
  - QUICK_START_DEPLOY.md
  - VERCEL_QUICK_FIX.md
- DEMO_MODE.md documentation for flexible data sources

### Changed
- Updated README.md with dual-deployment modes explanation
- Enhanced project documentation structure

### Fixed
- GanttProvider context error by wrapping entire page (#4)

## [0.9.0] - 2025-10-20

### Added
- Complete Baserow data provider implementation
  - Full CRUD operations for tasks
  - Status management
  - Pagination support with auto-pagination for all records
  - Field mapping configuration
- Server-side API proxy layer for security
  - Environment-based credential management
  - Request validation and sanitization
  - Error handling and logging
- Webhook support for real-time updates
  - Baserow webhook endpoint
  - Cache invalidation on data changes
  - Event logging
- Comprehensive documentation
  - Baserow setup guide
  - API documentation
  - Field mapping guide

### Changed
- Improved error handling across all API routes
- Enhanced TypeScript type safety
- Optimized data fetching with pagination

### Security
- All API credentials kept server-side only
- Environment variable validation
- Secure webhook authentication support

## [0.5.0] - 2025-10-15

### Added
- Core Gantt chart functionality
  - Task visualization with timeline
  - Drag and drop task reordering
  - Task resizing for date changes
  - Status-based color coding
- Initial UI components using shadcn/ui
  - Gantt chart component
  - Task card component
  - Timeline header
  - Status indicators
- Next.js 14 App Router setup
  - Server and client components
  - API routes structure
  - TypeScript configuration
- Basic task data structure
  - Task type definitions
  - Status type definitions
  - Provider interface

### Changed
- Project structure optimized for Next.js 14
- Component organization with shadcn/ui patterns

## [0.1.0] - 2025-10-01

### Added
- Initial project setup
  - Next.js 14 with App Router
  - TypeScript with strict mode
  - Tailwind CSS configuration
  - shadcn/ui component library
  - ESLint and Prettier setup
- Basic project documentation
  - Initial README.md
  - License file (MIT)
  - Basic CONTRIBUTING.md
- Repository configuration
  - Git ignore rules
  - Prettier configuration
  - ESLint configuration
  - Vercel deployment configuration

---

## How to Update This Changelog

### For Contributors

When making changes, add an entry under the `[Unreleased]` section following this format:

```markdown
## [Unreleased]

### Added
- New features or capabilities

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future versions

### Removed
- Features that have been removed

### Fixed
- Bug fixes

### Security
- Security-related changes
```

### For Maintainers

When releasing a new version:

1. Change `[Unreleased]` to the new version number with date
2. Add a new `[Unreleased]` section above it
3. Update the version links at the bottom
4. Commit with message: `chore: release v1.0.0`
5. Tag the release: `git tag -a v1.0.0 -m "Version 1.0.0"`

### Change Categories

- **Added**: New features, files, or capabilities
- **Changed**: Changes to existing functionality (non-breaking)
- **Deprecated**: Features marked for removal (still work)
- **Removed**: Features that have been deleted
- **Fixed**: Bug fixes
- **Security**: Security fixes or improvements

### Guidelines

1. **Be specific**: Include file names, component names, or feature names
2. **Link to issues/PRs**: Use `(#123)` to reference GitHub issues/PRs
3. **Group related changes**: Keep similar changes together
4. **Date format**: Use YYYY-MM-DD format
5. **Breaking changes**: Mark with `**BREAKING:**` prefix
6. **One change per line**: Keep entries concise and scannable

### Examples

```markdown
### Added
- Task filtering by date range in Gantt component (#123)
- CSV export functionality in `lib/export/csv.ts` (#124)
- User authentication with NextAuth.js (#125)

### Changed
- **BREAKING:** Changed API response format for tasks (#126)
- Updated shadcn/ui components to v2.0 (#127)
- Improved error messages in Baserow provider (#128)

### Fixed
- Fixed null date handling in task updates (#129)
- Resolved drag-and-drop z-index issue (#130)
- Corrected TypeScript type for TaskStatus (#131)

### Security
- Updated dependencies to patch CVE-2024-12345 (#132)
- Added rate limiting to API endpoints (#133)
```

---

## Version Links

[Unreleased]: https://github.com/Llompi/Shadcn-Gantt-tool/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Llompi/Shadcn-Gantt-tool/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/Llompi/Shadcn-Gantt-tool/compare/v0.5.0...v0.9.0
[0.5.0]: https://github.com/Llompi/Shadcn-Gantt-tool/compare/v0.1.0...v0.5.0
[0.1.0]: https://github.com/Llompi/Shadcn-Gantt-tool/releases/tag/v0.1.0

---

**Note**: This changelog started tracking changes from version 0.1.0. Earlier development history may not be complete.
