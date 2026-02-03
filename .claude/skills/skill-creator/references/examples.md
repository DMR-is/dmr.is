# Skill Examples

Real examples from this project.

## Generator Skill: new-page

Creates Next.js pages from patterns.

**Structure:**

```text
.claude/skills/new-page/
├── skill.md
└── references/
    ├── patterns.md    # Page patterns (dashboard, detail, form)
    └── styling.md     # UI components and Tailwind patterns
```

**Frontmatter:**

```yaml
---
description: Create Next.js App Router pages following established patterns
allowed-tools: Write, Read, Glob, Grep, Edit
argument-hint: <route-path>
---
```

**Key sections:**
- Workflow asks about page type, data needs, mutations
- References patterns.md for code templates
- Includes common imports block

## Generator Skill: new-action

Creates Server Actions for mutations.

**Structure:**

```text
.claude/skills/new-action/
├── skill.md
└── references/
    └── patterns.md    # CRUD patterns, relationships
```

**Frontmatter:**

```yaml
---
description: Create Next.js Server Actions for database mutations
allowed-tools: Write, Read, Glob, Grep, Edit
argument-hint: <action-name>
---
```

**Key sections:**
- Workflow asks about operation type, tables, input shape
- Patterns include create, update, delete, with-children

## Runner Skill: validate

Runs validation commands.

**Structure:**

```text
.claude/skills/validate/
└── skill.md           # No references needed - simple runner
```

**Frontmatter:**

```yaml
---
description: Run full validation suite - lint, typecheck, and build
allowed-tools: Bash
---
```

**Key sections:**
- Just lists commands to run in order
- Stop on first failure instruction
- No references needed (commands are simple)

## Runner Skill: db-migrate

Manages database migrations.

**Structure:**

```text
.claude/skills/db-migrate/
├── skill.md
└── references/
    └── workflow.md    # Full migration process, troubleshooting
```

**Frontmatter:**

```yaml
---
description: Generate and apply database migrations with Drizzle ORM
allowed-tools: Bash, Read, Glob
---
```

**Key sections:**
- Pre-flight checks (Docker, schema)
- Commands for generate/apply
- References workflow.md for details

## Hybrid Skill: db-seed

Both runs existing seeds and creates new ones.

**Structure:**

```text
.claude/skills/db-seed/
├── skill.md
└── references/
    └── patterns.md    # Seed script templates
```

**Frontmatter:**

```yaml
---
description: Seed the database with initial or test data
allowed-tools: Bash, Read, Write, Glob
argument-hint: [script-name]
---
```

**Key sections:**
- Workflow branches: run existing vs create new
- Commands for running seeds
- Patterns for creating new seed scripts

## Common Patterns

### Questions Section

```markdown
### 1. Gather Requirements

Ask clarifying questions:

1. **Question one?** (options or context)
2. **Question two?** (options or context)
```

### Pattern Selection Table

```markdown
### 2. Select Pattern

| Type | Use Case |
|------|----------|
| Pattern A | When to use A |
| Pattern B | When to use B |
```

### File Structure Block

```markdown
### 3. File Structure

\`\`\`text
path/
├── file1.ts
└── file2.ts
\`\`\`
```

### Checklist

```markdown
### 4. Implementation Checklist

- [ ] Step one
- [ ] Step two
- [ ] Step three
```

### Quick Reference Footer

```markdown
## Quick Reference

See detailed info:

- **\`references/patterns.md\`** - What it contains
- **\`references/workflow.md\`** - What it contains
```
