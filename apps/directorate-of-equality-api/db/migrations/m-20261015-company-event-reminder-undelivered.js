'use strict'

/**
 * Two company_event types for a deadline reminder whose delivery to the
 * island.is mailbox stopped undelivered: UNCERTAIN (whether One sent it is
 * unknown) or out of attempts. Without them the timeline showed nothing,
 * where the email path records a NO_EMAIL event an admin can see. Same
 * idempotency rule as the other reminder events: `reason` holds the ISO due
 * date and `reminder_tier` the milestone, so one row per company per kind per
 * tier per due date.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    // ALTER TYPE ... ADD VALUE cannot be used in the transaction that adds
    // it, so each runs on its own, outside any transaction block.
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum
        ADD VALUE IF NOT EXISTS 'EQUALITY_REPORT_DEADLINE_REMINDER_UNDELIVERED';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum
        ADD VALUE IF NOT EXISTS 'SALARY_REPORT_DEADLINE_REMINDER_UNDELIVERED';
    `)
  },

  async down() {
    // Postgres has no DROP VALUE. Removing them would mean recreating
    // company_event_type_enum and rewriting every company_event row, so the
    // two values stay; nothing writes them once the code is rolled back.
  },
}
