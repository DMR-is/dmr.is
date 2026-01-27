'use strict'

/**
 * Migration: Settlement Date Consolidation
 *
 * Consolidates two separate date columns (DEADLINE_DATE and DATE_OF_DEATH)
 * into a single DATE column in the SETTLEMENT table.
 *
 * Rationale:
 * - Only one date is ever used at a time based on settlement type
 * - Reduces complexity and improves data model clarity
 * - Prevents scenarios where both fields are populated incorrectly
 *
 * Data Migration Strategy:
 * - Prefer DEADLINE_DATE if present, fallback to DATE_OF_DEATH
 * - Uses COALESCE to preserve all existing data
 *
 * Rollback:
 * - Recreates both columns and copies DATE back to DEADLINE_DATE
 * - Note: Cannot distinguish which original field was used after migration
 */

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Add new DATE column
      ALTER TABLE SETTLEMENT
        ADD COLUMN IF NOT EXISTS DATE TIMESTAMPTZ DEFAULT NULL;

      -- Migrate existing data: prefer DEADLINE_DATE, fallback to DATE_OF_DEATH
      -- This preserves all existing dates regardless of which field they're in
      UPDATE SETTLEMENT
        SET DATE = COALESCE(DEADLINE_DATE, DATE_OF_DEATH)
        WHERE DATE IS NULL
          AND (DEADLINE_DATE IS NOT NULL OR DATE_OF_DEATH IS NOT NULL);

      -- Drop old columns
      ALTER TABLE SETTLEMENT
        DROP COLUMN IF EXISTS DEADLINE_DATE,
        DROP COLUMN IF EXISTS DATE_OF_DEATH;

      COMMIT;
    `)
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Recreate old columns
      ALTER TABLE SETTLEMENT
        ADD COLUMN IF NOT EXISTS DEADLINE_DATE TIMESTAMPTZ DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS DATE_OF_DEATH TIMESTAMPTZ DEFAULT NULL;

      -- Migrate data back to both columns
      UPDATE SETTLEMENT
        SET
          DEADLINE_DATE = DATE,
          DATE_OF_DEATH = DATE
        WHERE DATE IS NOT NULL;

      -- Drop new column
      ALTER TABLE SETTLEMENT
        DROP COLUMN IF EXISTS DATE;

      COMMIT;
    `)
  },
}
