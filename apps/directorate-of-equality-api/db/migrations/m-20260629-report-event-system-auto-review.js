'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ALTER TYPE ... ADD VALUE cannot run inside a transaction block.
    await queryInterface.sequelize.query(`
      ALTER TYPE report_event_type_enum ADD VALUE IF NOT EXISTS 'SYSTEM_AUTO_REVIEW';
    `)

    // New enum type + column for the system's auto-review verdict. Nullable;
    // only SYSTEM_AUTO_REVIEW events set it.
    await queryInterface.sequelize.query(`
      BEGIN;

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_event_system_decision_enum') THEN
          CREATE TYPE report_event_system_decision_enum AS ENUM ('AUTO_APPROVE', 'NEEDS_REVIEW');
        END IF;
      END $$;

      ALTER TABLE report_event
        ADD COLUMN IF NOT EXISTS system_decision report_event_system_decision_enum;

      COMMIT;
    `)
  },

  async down(queryInterface) {
    // Postgres cannot drop an enum value, so the SYSTEM_AUTO_REVIEW event-type
    // value is left in place. Drop the column and its enum type, removing any
    // audit-only rows that depend on it.
    await queryInterface.sequelize.query(`
      BEGIN;

      DELETE FROM report_event WHERE event_type = 'SYSTEM_AUTO_REVIEW';

      ALTER TABLE report_event DROP COLUMN IF EXISTS system_decision;

      DROP TYPE IF EXISTS report_event_system_decision_enum;

      COMMIT;
    `)
  },
}
