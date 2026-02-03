# Skill Structure

## File Location

```text
.claude/skills/{skill-name}/
├── SKILL.md              # Main skill definition
└── references/           # Supporting documentation
    └── *.md
```

## SKILL.md Template

```markdown
---
description: One-line description for skill discovery
allowed-tools: Tool1, Tool2, Tool3
argument-hint: <argument-description>
---

# Skill Title

Brief intro paragraph explaining what this skill does.

Argument reference: $ARGUMENTS

## Workflow

### 1. First Step

Explanation of first step.

### 2. Second Step

Explanation with checklist:

- [ ] Item one
- [ ] Item two

### 3. Commands/Code

\`\`\`bash
# Example commands
pnpm some-command
\`\`\`

## Quick Reference

See detailed info:

- **\`references/patterns.md\`** - Description
- **\`references/workflow.md\`** - Description
```

## Frontmatter Options

| Field | Required | Description |
|-------|----------|-------------|
| `description` | Yes | Short description shown in skill list |
| `allowed-tools` | Yes | Comma-separated tools the skill can use |
| `argument-hint` | No | Hint for expected arguments (e.g., `<route-path>`) |

### Common Tool Combinations

| Skill Type | Tools |
|------------|-------|
| File generator | `Write, Read, Glob, Edit` |
| Code runner | `Bash, Read, Glob` |
| Search/analyze | `Read, Glob, Grep` |
| Full access | `Write, Read, Glob, Grep, Edit, Bash` |

## Using Arguments

Reference user arguments with `$ARGUMENTS`:

```markdown
Route path: $ARGUMENTS

Create file at: `app/$ARGUMENTS/page.tsx`
```

## Workflow Section Patterns

### For Generators

1. Gather requirements (questions)
2. Select pattern (from references)
3. File structure (what to create)
4. Implementation checklist
5. Common imports

### For Runners

1. Determine operation (what to do)
2. Pre-flight checks
3. Commands to run
4. Post-run verification

### For Hybrid

1. Gather requirements
2. Determine if create or run
3. Branch to appropriate workflow

## Reference Files

### When to Create

| File | Create When |
|------|-------------|
| `patterns.md` | Skill generates code with multiple patterns |
| `workflow.md` | Skill has complex multi-step process |
| `examples.md` | Usage isn't obvious from SKILL.md |

### Reference File Template

```markdown
# Reference Title

## Pattern/Section 1

Brief description.

\`\`\`tsx
// Code example
\`\`\`

## Pattern/Section 2

...
```

## Checklist Best Practices

Use checklists for:
- Pre-flight verification
- Implementation steps
- Post-completion verification

```markdown
### Pre-flight Checks

- [ ] Database is running
- [ ] Environment variables set
- [ ] Dependencies installed

### Implementation

- [ ] Create main file
- [ ] Add imports
- [ ] Implement logic
```
