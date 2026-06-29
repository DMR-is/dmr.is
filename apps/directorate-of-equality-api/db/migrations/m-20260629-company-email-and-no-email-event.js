'use strict'

/**
 * Lets the report-deadline-reminder task read the recipient straight off the
 * company instead of joining through the latest approved report:
 *
 * 1. `company.email` — nullable contact email for the company. Populated
 *    elsewhere (admin-set); the reminder task only reads it.
 *
 * 2. Two new company_event types recorded when a reminder is due but the
 *    company has no email on file, one per deadline. As with the SENT events,
 *    the ISO due date is stored in `reason`, which keeps the event idempotent
 *    per cycle (one NO_EMAIL row per company per due date, not one per run).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    // ALTER TYPE ... ADD VALUE must be committed before the new value can be
    // referenced (Postgres forbids using it in the same transaction), so each
    // runs on its own, outside any transaction block.
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum
        ADD VALUE IF NOT EXISTS 'EQUALITY_REPORT_DEADLINE_REMINDER_NO_EMAIL';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum
        ADD VALUE IF NOT EXISTS 'SALARY_REPORT_DEADLINE_REMINDER_NO_EMAIL';
    `)

    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE company
        ADD COLUMN IF NOT EXISTS email TEXT;

      COMMENT ON COLUMN company.email IS 'Contact email for the company (nullable). Read by the report-deadline-reminder task.';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    // Postgres has no DROP VALUE — the two enum values are left in place
    // (removing them would require recreating company_event_type_enum and
    // rewriting every dependent row). Only the column is dropped.
    await queryInterface.sequelize.query(`
      BEGIN;
      ALTER TABLE company DROP COLUMN IF EXISTS email;
      COMMIT;
    `)
  },
}
