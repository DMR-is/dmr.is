'use strict'

/**
 * Adds the reminder-tier dimension to company_event so the deadline-reminder
 * task can record one audit row per milestone (6 months / 2 months / 2 weeks /
 * on the due date) instead of a single "within 6 months" event.
 *
 * The existing reminder event types (…_REMINDER_SENT / …_REMINDER_NO_EMAIL)
 * are reused; `reminder_tier` qualifies which milestone the row belongs to.
 * Together with `reason` (the ISO due date) it forms the idempotency key, so
 * each company gets exactly one row per (report kind, tier, due date).
 *
 * Null for every non-reminder event.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    // A brand-new enum type can be created and used in the same transaction —
    // the "ADD VALUE outside a transaction" rule only applies to existing ones.
    await queryInterface.sequelize.query(`
      BEGIN;

      CREATE TYPE company_reminder_tier_enum AS ENUM (
        'SIX_MONTHS',
        'TWO_MONTHS',
        'TWO_WEEKS',
        'DUE'
      );

      ALTER TABLE company_event
        ADD COLUMN IF NOT EXISTS reminder_tier company_reminder_tier_enum;

      COMMENT ON COLUMN company_event.reminder_tier IS 'Which deadline-reminder milestone this row records (null for non-reminder events).';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;
      ALTER TABLE company_event DROP COLUMN IF EXISTS reminder_tier;
      DROP TYPE IF EXISTS company_reminder_tier_enum;
      COMMIT;
    `)
  },
}
