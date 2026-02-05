# Documentation Guide - DMR.is Monorepo

> **🤖 For AI Agents**: Always start by reading `copilot-instructions.md`. Load specialized guides only when working on specific features (Next.js patterns, logging implementation, etc.).

This directory contains comprehensive instructions for GitHub Copilot and developers working on the DMR.is monorepo.

## Documents Overview

### 1. copilot-instructions.md (⭐ START HERE)

**Purpose**: Primary entry point for all AI agents and developers

**Load this for**:
- Initial context about the entire monorepo
- Quick reference for common tasks
- Critical conventions (logging, imports, modules)
- Development commands and workflows
- Common pitfalls and debugging

**Contains**:
- ✅ Project architecture overview
- ✅ Technology stack and dependencies
- ✅ **Logging best practices** (which logger for which runtime)
- ✅ Import conventions and ESLint rules
- ✅ NestJS and Next.js quick reference
- ✅ Development workflows (Nx commands, migrations, testing)
- ✅ Links to specialized documentation

### 2. nextjs-architecture-guide.md (📖 Next.js Deep Dive)

**Purpose**: Detailed Next.js architecture patterns and best practices

**Load this when**:
- Building or modifying Next.js pages/components
- Deciding between Server vs Client Components
- Implementing data fetching logic
- Setting up routing (dynamic, catch-all, etc.)
- Migrating from Pages Router to App Router
- Need examples of specific patterns

**Contains**:
- ✅ Pages Router vs App Router comparison
- ✅ Server/Client Components decision tree with examples
- ✅ Complete directory structure recommendations
- ✅ Data fetching patterns (parallel, streaming, etc.)
- ✅ Routing patterns with code examples
- ✅ Common DMR.is patterns (containers, forms, modals)
- ✅ Migration guide from Pages to App Router

### 3. plan-edgeCompatibleLogging.md (🔍 Implementation Details)

**Purpose**: Technical details about the logging system implementation

**Load this when**:
- Implementing logging in new code
- Troubleshooting logging issues
- Understanding Edge Runtime compatibility
- Contributing to logging libraries
- Need implementation status and TODOs

**Contains**:
- ✅ Problem statement and requirements
- ✅ Architecture decisions
- ✅ Implementation phases and status
- ✅ Edge Runtime constraints
- ✅ ESLint enforcement details
- ✅ Test cases and examples

## Quick Reference for AI Agents

### 🎯 Context Loading Strategy

**On Agent Start** (Planning/Exploration Mode):
```
1. Load: copilot-instructions.md (always)
2. Scan: project structure and current task
3. Load specialized docs only if needed:
   - Next.js task? → Load nextjs-architecture-guide.md
   - Logging issue? → Load plan-edgeCompatibleLogging.md
```

**During Edit Mode** (Implementation):
```
1. Keep: copilot-instructions.md in context (critical conventions)
2. Load: Relevant specialized guide for current feature
3. Reference: Code examples from guide for patterns
```

**Key Principle**: Start minimal, expand context as needed. This keeps token usage efficient while ensuring access to detailed patterns when required.

### For Backend (NestJS) Work

**Read**: `copilot-instructions-v2.md` sections:
- Architecture → Backend Architecture
- Critical Conventions → NestJS Module Pattern
- Logging Best Practices → For NestJS APIs
- Database Migrations
- Development Workflows

**Key Points**:
- Use `@dmr.is/logging` (Winston-based)
- Two-module pattern (provider + controller)
- Sequelize with explicit model imports
- Always use Nx commands, never npm/yarn directly

### For Frontend (Next.js) Work

**Read**: 
1. `copilot-instructions-v2.md` for overview
2. `nextjs-architecture-guide.md` for detailed patterns

**Key Points**:
- Use `@dmr.is/logging-next` (Edge Runtime compatible)
- Default to Server Components
- Use `'use client'` only when needed (hooks, events, browser APIs)
- Container pattern: separate server (data) from client (UI)
- Route groups for organization without URL segments

### For Shared Libraries

**Read**: `copilot-instructions-v2.md` sections:
- Shared Libraries Structure
- Import Path Aliases
- Custom ESLint Rules

**Key Points**:
- Always use path aliases (`@dmr.is/*`, `@island.is/*`)
- Respect Nx module boundaries
- Consider runtime environment when choosing logger

## Integration with Copilot

GitHub Copilot automatically reads:
1. `.github/copilot-instructions.md` (if configured)
2. `.claude/CLAUDE.md` (for Claude Code)

### Recommended Setup

To use the new instructions with Copilot:

1. **Option A**: Replace old instructions
   ```bash
   mv .github/copilot-instructions.md .github/copilot-instructions-old.md
   mv .github/copilot-instructions-v2.md .github/copilot-instructions.md
   ```

2. **Option B**: Update Copilot settings
   Configure your IDE to point to `copilot-instructions-v2.md`

## Document Maintenance

### When to Update

**copilot-instructions-v2.md**:
- New shared libraries added
- Architecture changes
- New conventions established
- Dependency updates
- Common pitfalls discovered

**nextjs-architecture-guide.md**:
- New Next.js patterns adopted
- Component structure changes
- New data fetching patterns
- Routing conventions change

### Update Process

1. Make changes to relevant document
2. Update "Last Updated" date in document
3. Test changes with Copilot/Claude
4. Commit with descriptive message
5. Notify team of significant changes

## Key Improvements in V2

### Logging Section (NEW)

The most significant addition is comprehensive logging guidance:

```typescript
// ✅ NestJS API (Node.js runtime)
import { getLogger } from '@dmr.is/logging'

// ✅ Next.js (Edge Runtime compatible)
import { getLogger } from '@dmr.is/logging-next'

// ❌ Never do this
console.log('some message')
```

**Why this matters**:
- Edge Runtime (middleware, NextAuth callbacks) requires special logger
- Proper logging ensures PII masking and structured output
- ESLint rules enforce correct usage

### Next.js Architecture (NEW)

Added dedicated guide for Next.js patterns:
- Clear Server Component vs Client Component decision tree
- App Router best practices (route groups, layouts, parallel routes)
- Container pattern for separating concerns
- Data fetching strategies

### Enhanced Examples

More code examples showing:
- Real patterns from Legal Gazette applications
- Container pattern implementation
- tRPC server/client separation
- Provider composition

## Related Documentation

- **plan-edgeCompatibleLogging.md**: Implementation details for new logging system
- **plan-legalGazetteAuthRefactor.md**: Authentication refactoring plans
- **README.md**: Project setup and getting started
- **Individual app READMEs**: App-specific documentation

## Questions?

For questions about:
- **Architecture**: Check copilot-instructions-v2.md
- **Next.js patterns**: Check nextjs-architecture-guide.md  
- **Logging**: Check both instructions and plan-edgeCompatibleLogging.md
- **Specific apps**: Check app's README or project.json

---

**Last Updated**: November 27, 2024
**Maintained By**: DMR Development Team
