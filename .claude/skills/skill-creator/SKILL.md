---
name: skill-creator
description: Create new agent skills with proper structure and patterns. Use when adding reusable workflows to the project.
allowed-tools: Write, Read, Glob, Edit
argument-hint: <skill-name>
---

# Skill Creator

Create properly structured Claude Code skills following established patterns.

Skill name: $ARGUMENTS

## Workflow

### 1. Gather Requirements

Ask clarifying questions:

1. **What does the skill do?** (one-sentence description)
2. **What tools are needed?** (Bash, Read, Write, Edit, Glob, Grep)
3. **Takes arguments?** (e.g., route path, action name)
4. **Reference files needed?** (patterns, examples, workflows)

### 2. Determine Skill Type

| Type | Use Case | Example |
|------|----------|---------|
| Generator | Creates new files from patterns | new-page, new-action |
| Runner | Executes commands/workflows | validate, db-migrate |
| Hybrid | Both creates files and runs commands | db-seed |

### 3. Create File Structure

```text
.claude/skills/{skill-name}/
├── SKILL.md              # Main skill file (required)
└── references/           # Reference files (if needed)
    ├── patterns.md       # Code patterns/templates
    ├── workflow.md       # Step-by-step processes
    └── examples.md       # Usage examples
```

### 4. Write SKILL.md

Follow template in `references/structure.md`:

- [ ] Add frontmatter (description, allowed-tools, argument-hint)
- [ ] Write workflow steps
- [ ] Add implementation checklist
- [ ] Include common imports/commands
- [ ] Reference the reference files

### 5. Create Reference Files

Only create what's needed:

- **patterns.md** - For generator skills with code templates
- **workflow.md** - For runner skills with multi-step processes
- **examples.md** - When usage isn't obvious

### 6. Update CLAUDE.md

Add skill to the Skills section:

```markdown
- `/skill-name` - Brief description
```

## Quick Reference

See detailed info:

- **`references/structure.md`** - SKILL.md template and frontmatter options
- **`references/examples.md`** - Real examples from this project
