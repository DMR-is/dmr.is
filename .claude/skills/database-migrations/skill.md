# Database Migrations

Create and manage Sequelize database migrations for Legal Gazette and Official Journal APIs.

## When to Use

- Creating new database tables
- Altering existing table structures
- Adding/removing columns or indexes
- Creating database relationships
- Seeding data

## Quick Reference Commands

```bash
# Legal Gazette API
yarn nx run legal-gazette-api:migrate           # Run pending migrations
yarn nx run legal-gazette-api:migrate/undo      # Rollback last migration
yarn nx run legal-gazette-api:seed              # Run seed files
yarn nx run legal-gazette-api:migrate/generate  # Generate new migration file

# Official Journal API
yarn nx run official-journal-api:migrate
yarn nx run official-journal-api:migrate/undo
yarn nx run official-journal-api:seed
```

## Migration File Location

```
apps/legal-gazette-api/migrations/
apps/official-journal-api/migrations/
```

## Naming Convention

```
m-YYYYMMDD-description.js
```

Examples:
- `m-20251229-subscriber-payments-alter.js`
- `m-20260115-create-notifications-table.js`
- `m-20260116-add-status-column-to-adverts.js`

## BaseModel Required Columns

**CRITICAL**: All tables using `BaseModel` from `@dmr.is/shared/models/base` **must include these columns**:

```sql
ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
DELETED_AT TIMESTAMP WITH TIME ZONE  -- nullable, for soft deletes
```

## Migration Templates

### CREATE TABLE

```javascript
'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE my_table (
        -- BaseModel columns (REQUIRED)
        ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        DELETED_AT TIMESTAMP WITH TIME ZONE,

        -- Custom columns
        NAME TEXT NOT NULL,
        DESCRIPTION TEXT,
        STATUS TEXT NOT NULL DEFAULT 'DRAFT',
        AMOUNT NUMERIC(12, 2),
        IS_ACTIVE BOOLEAN DEFAULT false NOT NULL,

        -- Foreign keys
        USER_ID UUID REFERENCES users(ID) ON DELETE CASCADE,
        CATEGORY_ID UUID REFERENCES categories(ID) ON DELETE SET NULL
      );

      -- Indexes
      CREATE INDEX idx_my_table_user_id ON my_table(USER_ID);
      CREATE INDEX idx_my_table_status ON my_table(STATUS);

      -- Unique constraints
      CREATE UNIQUE INDEX idx_my_table_name_unique ON my_table(NAME) WHERE DELETED_AT IS NULL;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;
      DROP TABLE IF EXISTS my_table;
      COMMIT;
    `)
  },
}
```

### ALTER TABLE - Add Column

```javascript
'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE my_table
        ADD COLUMN NEW_COLUMN TEXT,
        ADD COLUMN PRIORITY INTEGER DEFAULT 0 NOT NULL;

      -- Add index if needed
      CREATE INDEX idx_my_table_priority ON my_table(PRIORITY);

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS idx_my_table_priority;

      ALTER TABLE my_table
        DROP COLUMN IF EXISTS NEW_COLUMN,
        DROP COLUMN IF EXISTS PRIORITY;

      COMMIT;
    `)
  },
}
```

### ALTER TABLE - Modify Column

```javascript
'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Change column type
      ALTER TABLE my_table
        ALTER COLUMN AMOUNT TYPE NUMERIC(15, 2);

      -- Make column NOT NULL (ensure no nulls first!)
      UPDATE my_table SET STATUS = 'UNKNOWN' WHERE STATUS IS NULL;
      ALTER TABLE my_table
        ALTER COLUMN STATUS SET NOT NULL;

      -- Add default value
      ALTER TABLE my_table
        ALTER COLUMN IS_ACTIVE SET DEFAULT true;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE my_table
        ALTER COLUMN AMOUNT TYPE NUMERIC(12, 2),
        ALTER COLUMN STATUS DROP NOT NULL,
        ALTER COLUMN IS_ACTIVE SET DEFAULT false;

      COMMIT;
    `)
  },
}
```

### ALTER TABLE - Rename Column

```javascript
'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE my_table
        RENAME COLUMN OLD_NAME TO NEW_NAME;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE my_table
        RENAME COLUMN NEW_NAME TO OLD_NAME;

      COMMIT;
    `)
  },
}
```

### Add Foreign Key to Existing Table

```javascript
'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Add column
      ALTER TABLE my_table
        ADD COLUMN PARENT_ID UUID;

      -- Add foreign key constraint
      ALTER TABLE my_table
        ADD CONSTRAINT fk_my_table_parent
        FOREIGN KEY (PARENT_ID)
        REFERENCES parent_table(ID)
        ON DELETE SET NULL;

      -- Add index for performance
      CREATE INDEX idx_my_table_parent_id ON my_table(PARENT_ID);

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS idx_my_table_parent_id;

      ALTER TABLE my_table
        DROP CONSTRAINT IF EXISTS fk_my_table_parent,
        DROP COLUMN IF EXISTS PARENT_ID;

      COMMIT;
    `)
  },
}
```

### Create Junction Table (Many-to-Many)

```javascript
'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE user_roles (
        -- BaseModel columns
        ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        DELETED_AT TIMESTAMP WITH TIME ZONE,

        -- Junction columns
        USER_ID UUID NOT NULL REFERENCES users(ID) ON DELETE CASCADE,
        ROLE_ID UUID NOT NULL REFERENCES roles(ID) ON DELETE CASCADE,

        -- Prevent duplicates
        UNIQUE(USER_ID, ROLE_ID)
      );

      -- Indexes for both directions
      CREATE INDEX idx_user_roles_user_id ON user_roles(USER_ID);
      CREATE INDEX idx_user_roles_role_id ON user_roles(ROLE_ID);

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;
      DROP TABLE IF EXISTS user_roles;
      COMMIT;
    `)
  },
}
```

### Data Migration

```javascript
'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Migrate data from old structure to new
      UPDATE my_table
      SET NEW_STATUS = CASE
        WHEN OLD_STATUS = 'active' THEN 'ACTIVE'
        WHEN OLD_STATUS = 'inactive' THEN 'INACTIVE'
        ELSE 'UNKNOWN'
      END;

      -- Copy data between tables
      INSERT INTO new_table (ID, NAME, CREATED_AT, UPDATED_AT)
      SELECT ID, TITLE, CREATED_AT, UPDATED_AT
      FROM old_table
      WHERE DELETED_AT IS NULL;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Reverse the data migration
      UPDATE my_table
      SET OLD_STATUS = CASE
        WHEN NEW_STATUS = 'ACTIVE' THEN 'active'
        WHEN NEW_STATUS = 'INACTIVE' THEN 'inactive'
        ELSE NULL
      END;

      DELETE FROM new_table;

      COMMIT;
    `)
  },
}
```

## Column Type Reference

| Use Case | PostgreSQL Type | Notes |
|----------|-----------------|-------|
| Primary key | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | Always use UUID |
| Strings | `TEXT` | Never use VARCHAR |
| Short strings (enum-like) | `TEXT` | Add CHECK constraint if needed |
| Integers | `INTEGER` | For counts, quantities |
| Large integers | `BIGINT` | For large numbers |
| Money/prices | `NUMERIC(12, 2)` | Precision matters |
| Booleans | `BOOLEAN DEFAULT false NOT NULL` | Always set default |
| Timestamps | `TIMESTAMP WITH TIME ZONE` | Always with timezone |
| JSON data | `JSONB` | Use JSONB, not JSON |
| Arrays | `TEXT[]` or `UUID[]` | PostgreSQL arrays |

## Index Patterns

```sql
-- Standard index
CREATE INDEX idx_table_column ON table(column);

-- Composite index (for multi-column queries)
CREATE INDEX idx_table_col1_col2 ON table(col1, col2);

-- Partial index (for filtered queries)
CREATE INDEX idx_table_active ON table(status) WHERE status = 'ACTIVE';

-- Unique index with soft delete support
CREATE UNIQUE INDEX idx_table_email_unique ON table(email) WHERE DELETED_AT IS NULL;

-- GIN index for JSONB
CREATE INDEX idx_table_metadata ON table USING GIN (metadata);

-- Full-text search index
CREATE INDEX idx_table_search ON table USING GIN (to_tsvector('english', name || ' ' || description));
```

## Foreign Key Actions

```sql
-- Delete child when parent deleted
REFERENCES parent(ID) ON DELETE CASCADE

-- Set to NULL when parent deleted
REFERENCES parent(ID) ON DELETE SET NULL

-- Prevent parent deletion if children exist
REFERENCES parent(ID) ON DELETE RESTRICT

-- Update child FK when parent PK changes
REFERENCES parent(ID) ON UPDATE CASCADE
```

## Best Practices

### Always Do

- ✅ Wrap migrations in `BEGIN;` / `COMMIT;`
- ✅ Include `down` migration for rollback
- ✅ Test migrations locally before pushing
- ✅ Include BaseModel columns for new tables
- ✅ Add indexes for foreign keys
- ✅ Use `IF EXISTS` / `IF NOT EXISTS` for safety
- ✅ Handle NULL values before adding NOT NULL constraint

### Never Do

- ❌ Use `VARCHAR` - always use `TEXT`
- ❌ Forget `DELETED_AT` for soft-delete tables
- ❌ Create indexes without the `idx_` prefix
- ❌ Drop columns/tables without `IF EXISTS`
- ❌ Forget to update the Sequelize model after migration

## After Migration Checklist

After creating a migration, also update:

- [ ] Sequelize model (`*.model.ts`) with new columns/relationships
- [ ] DTOs if exposing new fields via API
- [ ] Service layer if business logic changes
- [ ] Tests for new functionality

## Troubleshooting

### Migration fails with "relation already exists"

```javascript
// Use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS my_table (...);
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
```

### Migration fails with "column already exists"

```javascript
// Check before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'my_table' AND column_name = 'new_column'
  ) THEN
    ALTER TABLE my_table ADD COLUMN new_column TEXT;
  END IF;
END $$;
```

### Rollback stuck migration

```bash
# Force rollback
yarn nx run legal-gazette-api:migrate/undo

# If that fails, manually fix in database:
DELETE FROM "SequelizeMeta" WHERE name = 'm-YYYYMMDD-problematic-migration.js';
```

### Check migration status

```bash
# Connect to database and check
SELECT * FROM "SequelizeMeta" ORDER BY name;
```
