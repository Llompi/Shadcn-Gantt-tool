# AI Collaboration Guidelines

This document provides specific instructions for AI tools (Claude, GPT-4, Copilot, etc.) working on this repository. Following these guidelines ensures consistency, quality, and smooth collaboration with human developers.

## Table of Contents
- [First Steps](#first-steps)
- [Standard Workflow](#standard-workflow)
- [File Management](#file-management)
- [Code Standards](#code-standards)
- [Documentation Requirements](#documentation-requirements)
- [Git Practices](#git-practices)
- [Communication](#communication)
- [Common Tasks](#common-tasks)

## First Steps

### Every Time You Start Work

1. **Read PROJECT_STATUS.md**
   ```bash
   # Check current priorities and ongoing work
   cat PROJECT_STATUS.md
   ```
   - Identify current goals
   - Check what's in progress
   - Avoid duplicate work
   - Note any blockers

2. **Check Recent Changes**
   ```bash
   git log --oneline -10
   cat CHANGELOG.md | head -50
   ```

3. **Understand the Context**
   - Read relevant sections of README.md
   - Review related code files
   - Check for related issues or PRs

## Standard Workflow

### Phase 1: Planning

1. **Understand the Request**
   - Clarify ambiguous requirements with questions
   - Identify the scope (small fix vs large feature)
   - Determine which files will be affected

2. **Update PROJECT_STATUS.md**
   ```markdown
   ### 🔄 In Progress
   - **[Your Task Name]** - Started by [AI Tool] on 2025-10-24
     - Description: Brief description
     - Files affected: list of files
     - Estimated completion: today/this week
   ```

3. **Create a Mental Checklist**
   - [ ] Code changes required
   - [ ] Tests to update/create
   - [ ] Documentation to update
   - [ ] CHANGELOG.md entry
   - [ ] PROJECT_STATUS.md update

### Phase 2: Implementation

1. **Make Changes Incrementally**
   - One logical change at a time
   - Test each change mentally before implementing
   - Follow existing patterns in the codebase

2. **Follow Code Standards**
   - Match existing code style exactly
   - Use TypeScript strict mode
   - Add proper type annotations
   - Include JSDoc comments for public functions

3. **Validate Syntax**
   - Ensure all imports are correct
   - Check for TypeScript errors
   - Verify all brackets/braces are balanced
   - Confirm proper async/await usage

### Phase 3: Documentation

1. **Update Code Documentation**
   ```typescript
   /**
    * Function description
    * @param paramName - Parameter description
    * @returns Return value description
    * @example
    * ```typescript
    * const result = functionName(param);
    * ```
    */
   ```

2. **Update CHANGELOG.md**
   ```markdown
   ## [Unreleased]

   ### Added
   - New feature description

   ### Fixed
   - Bug fix description

   ### Changed
   - Breaking changes or significant modifications
   ```

3. **Update README.md** (if needed)
   - New features
   - New configuration options
   - New API endpoints
   - Changed behavior

### Phase 4: Completion

1. **Update PROJECT_STATUS.md**
   ```markdown
   ### ✅ Recently Completed
   - **[Your Task Name]** - Completed by [AI Tool] on 2025-10-24
     - Changes made: summary
     - Files modified: list
     - Next steps: if any
   ```

2. **Create Commit Message**
   ```
   <type>(<scope>): <short summary>

   Detailed explanation of changes made.
   What was changed and why.

   Related issue: #123
   ```

3. **Summary for Human**
   Provide a clear summary including:
   - What was done
   - Files changed
   - How to test
   - Any important notes

## File Management

### Reading Files

**Always read before editing:**
```bash
# Read the entire file first
cat filename.ts

# Or read specific sections
cat filename.ts | grep -A 10 "function name"
```

### Creating New Files

**Only create when necessary:**
- Prefer editing existing files
- Follow project structure
- Use appropriate naming conventions
- Add file header comments

```typescript
/**
 * @file new-feature.ts
 * @description Brief description of file purpose
 * @created 2025-10-24
 */
```

### Editing Files

**Make surgical changes:**
- Preserve existing formatting
- Match indentation style (2 spaces)
- Keep changes minimal and focused
- Don't refactor unless asked

## Code Standards

### TypeScript

```typescript
// ✅ Good: Explicit types
interface TaskParams {
  id: string;
  name: string;
  startDate: Date;
}

async function getTasks(params: TaskParams): Promise<Task[]> {
  // Implementation
}

// ❌ Bad: Implicit any
async function getTasks(params) {
  // Implementation
}
```

### Imports

```typescript
// ✅ Good: Organized imports
import { useState, useEffect } from 'react';
import type { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

// ❌ Bad: Messy imports
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
```

### Error Handling

```typescript
// ✅ Good: Proper error handling
try {
  const tasks = await fetchTasks();
  return tasks;
} catch (error) {
  console.error('Failed to fetch tasks:', error);
  throw new Error(`Task fetch failed: ${error.message}`);
}

// ❌ Bad: Silent failures
try {
  const tasks = await fetchTasks();
  return tasks;
} catch (error) {
  return [];
}
```

### Async/Await

```typescript
// ✅ Good: Async/await
async function processTask(taskId: string): Promise<void> {
  const task = await getTask(taskId);
  await updateTask(task);
}

// ❌ Bad: Promise chains (unless necessary)
function processTask(taskId: string): Promise<void> {
  return getTask(taskId).then(task => {
    return updateTask(task);
  });
}
```

## Documentation Requirements

### JSDoc Comments

**Required for:**
- All exported functions
- All class methods (public)
- Complex algorithms
- API endpoints

```typescript
/**
 * Fetches tasks from the data provider with optional filtering
 *
 * @param params - Query parameters for filtering and pagination
 * @param params.page - Page number (1-indexed, default: 1)
 * @param params.pageSize - Items per page (default: 50)
 * @param params.status - Filter by status name
 * @returns Promise resolving to paginated task list
 * @throws {Error} When API request fails
 *
 * @example
 * ```typescript
 * const tasks = await getTasks({ page: 1, pageSize: 20 });
 * ```
 */
async function getTasks(params: TaskQueryParams): Promise<PaginatedTasks> {
  // Implementation
}
```

### Inline Comments

**Use for:**
- Complex logic
- Non-obvious decisions
- Workarounds
- Future TODOs

```typescript
// Calculate business days between dates, excluding weekends
// This is needed because some clients track sprints in business days only
const businessDays = calculateBusinessDays(startDate, endDate);

// TODO: Add support for custom holidays list
// See issue #123 for requirements
```

### README Updates

**Update when adding:**
- New features
- New environment variables
- New API endpoints
- Changed behavior
- New dependencies

## Git Practices

### Commit Messages

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```bash
# Simple feature
feat(gantt): add task filtering by date range

# Bug fix with context
fix(api): handle null dates in task response

Previously, null dates caused the API to crash.
Now they're converted to undefined and handled gracefully.

Fixes #456

# Breaking change
feat(api)!: change task date format to ISO strings

BREAKING CHANGE: Task API now returns dates as ISO 8601 strings
instead of Unix timestamps. Update clients to use Date.parse().

Migration guide: See docs/MIGRATION.md
```

### Branch Naming

**For AI tools working on GitHub repositories:**
- Use the format: `claude/task-description-sessionid`
- Example: `claude/add-filtering-feature-abc123`

**For local work:**
- `feature/description`
- `fix/description`
- `docs/description`

### Before Committing

**Mental checklist:**
- [ ] Code compiles without errors
- [ ] No obvious syntax errors
- [ ] Follows existing patterns
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] PROJECT_STATUS.md updated
- [ ] Commit message follows convention

## Communication

### Asking Questions

**When unclear:**
```markdown
I need clarification on the following:

1. **Feature Scope**: Should filtering apply to all views or just the Gantt view?
2. **Error Handling**: How should we handle network timeouts - retry or fail fast?
3. **Breaking Changes**: This change affects the API. Is that acceptable?

Please advise before I proceed.
```

### Reporting Completion

**Provide detailed summary:**
```markdown
✅ **Task Completed: Add Task Filtering**

**Changes Made:**
1. Added filter UI component in `components/gantt/task-filters.tsx`
2. Implemented filter logic in `lib/providers/baserow/baserow-provider.ts`
3. Updated API route to support filter parameters
4. Added TypeScript types for filter options

**Files Modified:**
- components/gantt/task-filters.tsx (new)
- lib/providers/baserow/baserow-provider.ts
- app/api/tasks/route.ts
- types/task.ts
- README.md
- CHANGELOG.md
- PROJECT_STATUS.md

**Testing:**
- Manually tested with various filter combinations
- Verified API responses are correct
- Checked TypeScript compilation - no errors

**How to Test:**
1. Run `npm run dev`
2. Navigate to /gantt
3. Use the filter dropdown to filter by status
4. Verify tasks are filtered correctly

**Notes:**
- Used existing shadcn Select component for consistency
- Filter state is preserved in URL query parameters
- No breaking changes to existing APIs
```

### Reporting Blockers

**Be specific:**
```markdown
⚠️ **Blocker Encountered**

**Task:** Add PostgreSQL provider

**Issue:** Missing database schema information

**What I Need:**
- Database table structure for tasks
- Column names and types
- Relationship definitions

**What I've Done So Far:**
- Created provider skeleton in `lib/providers/postgres/`
- Implemented connection logic
- Added TypeScript interfaces

**Cannot Proceed Without:**
Schema documentation or access to test database

Please provide schema or I'll need to pause this task.
```

## Common Tasks

### Adding a New Feature

1. Read existing similar features
2. Update PROJECT_STATUS.md (in progress)
3. Create/modify necessary files
4. Add TypeScript types
5. Update documentation
6. Update CHANGELOG.md
7. Update PROJECT_STATUS.md (completed)
8. Commit with proper message

### Fixing a Bug

1. Understand the bug thoroughly
2. Locate the problematic code
3. Update PROJECT_STATUS.md (in progress)
4. Implement fix
5. Add comments explaining the fix
6. Update CHANGELOG.md
7. Update PROJECT_STATUS.md (completed)
8. Commit with `fix:` prefix

### Adding Documentation

1. Determine what needs documenting
2. Check existing docs for style
3. Create/update markdown files
4. Use clear headings and examples
5. Add to README.md if user-facing
6. Update PROJECT_STATUS.md if major docs
7. Commit with `docs:` prefix

### Refactoring Code

1. **Only if explicitly requested**
2. Update PROJECT_STATUS.md
3. Ensure no functionality changes
4. Maintain existing tests/behavior
5. Update comments if needed
6. Commit with `refactor:` prefix

## Error Recovery

### If You Make a Mistake

1. **Acknowledge it clearly:**
   ```markdown
   ⚠️ **Error in Previous Change**

   I made an error in the last commit. Specifically:
   - [What went wrong]
   - [Why it's wrong]
   - [How to fix it]
   ```

2. **Propose fix:**
   - Revert the change, or
   - Fix forward with a new commit

3. **Update documentation:**
   - Fix any incorrect docs
   - Update CHANGELOG.md if needed

### If You Don't Understand

**Stop and ask:**
```markdown
🤔 **Need Clarification**

I'm not certain about [specific aspect].

**My Understanding:**
[What you think is correct]

**Questions:**
1. [Specific question]
2. [Another question]

**Proposed Approach:**
[How you plan to proceed if your understanding is correct]

Please confirm before I continue.
```

## Best Practices Summary

### DO ✅

- Read files before editing
- Follow existing patterns exactly
- Update all relevant documentation
- Use proper TypeScript types
- Add helpful comments
- Test changes mentally
- Update PROJECT_STATUS.md
- Write clear commit messages
- Ask when uncertain
- Provide detailed summaries

### DON'T ❌

- Assume anything without checking
- Make changes without reading existing code
- Skip documentation updates
- Use `any` type in TypeScript
- Refactor without permission
- Make breaking changes without discussion
- Commit without updating CHANGELOG.md
- Skip PROJECT_STATUS.md updates
- Guess at configuration values
- Leave TODOs without issue references

## Templates

### PROJECT_STATUS.md Entry (Starting)

```markdown
### 🔄 In Progress
- **[Feature/Fix Name]** - Started by [AI Tool Name] on YYYY-MM-DD
  - **Description**: One-line description
  - **Files**: file1.ts, file2.tsx
  - **Estimated completion**: today/this week
  - **Notes**: Any important context
```

### PROJECT_STATUS.md Entry (Completing)

```markdown
### ✅ Recently Completed
- **[Feature/Fix Name]** - Completed by [AI Tool Name] on YYYY-MM-DD
  - **Changes**: Summary of what was done
  - **Files modified**: List of files
  - **Testing**: How it was tested
  - **Next steps**: If any follow-up needed
```

### CHANGELOG.md Entry

```markdown
## [Unreleased]

### Added
- Task filtering by status and date range (#123)
- Export functionality for Gantt chart (#124)

### Fixed
- Null date handling in Baserow provider (#125)
- Task drag-and-drop z-index issue (#126)

### Changed
- Updated shadcn/ui components to v2.0 (#127)
- Improved error messages in API responses (#128)
```

### Commit Message Template

```
<type>(<scope>): <short summary in imperative mood>

Longer explanation of what changed and why.
Wrap at 72 characters.

- Bullet points are fine for listing multiple changes
- Reference issues and PRs with #123

Fixes #123
Related to #456
```

---

## Quick Reference Card

**Before Starting:**
1. ✅ Read PROJECT_STATUS.md
2. ✅ Check recent commits
3. ✅ Update PROJECT_STATUS.md (in progress)

**While Working:**
1. ✅ Follow existing patterns
2. ✅ Add TypeScript types
3. ✅ Write clear comments
4. ✅ Test mentally

**Before Finishing:**
1. ✅ Update CHANGELOG.md
2. ✅ Update README.md (if needed)
3. ✅ Update PROJECT_STATUS.md (completed)
4. ✅ Write clear commit message
5. ✅ Provide detailed summary

---

**Last Updated**: 2025-10-24

Remember: **Quality over speed**. It's better to ask questions and get it right than to rush and create technical debt.
