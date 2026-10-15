'use strict'

/**
 * Two company_event types for a deadline reminder whose delivery to the
 * island.is mailbox has an unknown outcome: UNCERTAIN, or interrupted
 * mid-call. One may have sent it, so the UNDELIVERED events added in
 * m-20261015-company-event-reminder-undelivered.js, which now mean only "out
 * of attempts, never sent", would read as a confirmed non-delivery. Same
 * idempotency rule as the other reminder events.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    // ALTER TYPE ... ADD VALUE cannot be used in the transaction that adds
    // it, so each runs on its own, outside any transaction block.
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum
        ADD VALUE IF NOT EXISTS 'EQUALITY_REPORT_DEADLINE_REMINDER_UNCONFIRMED';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum
        ADD VALUE IF NOT EXISTS 'SALARY_REPORT_DEADLINE_REMINDER_UNCONFIRMED';
    `)
  },

  async down() {
    // Postgres has no DROP VALUE; see the UNDELIVERED migration. Nothing
    // writes these once the code is rolled back.
  },
}
