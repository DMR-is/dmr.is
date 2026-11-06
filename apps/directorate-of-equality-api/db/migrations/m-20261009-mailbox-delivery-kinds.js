'use strict'

/**
 * One mailbox kind per notice and report type: submitted, approved, denied and
 * the deadline reminder, each for salary and equality reports. The case
 * template (`CaseType`) differs per report type, so each needs its own kind.
 *
 * Nothing here may use the new values: an enum value added in a transaction
 * cannot be used in that same transaction.
 */
module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TYPE mailbox_delivery_kind_enum ADD VALUE IF NOT EXISTS 'SALARY_REPORT_SUBMITTED';
      ALTER TYPE mailbox_delivery_kind_enum ADD VALUE IF NOT EXISTS 'EQUALITY_REPORT_SUBMITTED';
      ALTER TYPE mailbox_delivery_kind_enum ADD VALUE IF NOT EXISTS 'SALARY_REPORT_APPROVED';
      ALTER TYPE mailbox_delivery_kind_enum ADD VALUE IF NOT EXISTS 'EQUALITY_REPORT_APPROVED';
      ALTER TYPE mailbox_delivery_kind_enum ADD VALUE IF NOT EXISTS 'SALARY_REPORT_DENIED';
      ALTER TYPE mailbox_delivery_kind_enum ADD VALUE IF NOT EXISTS 'EQUALITY_REPORT_DENIED';
      ALTER TYPE mailbox_delivery_kind_enum ADD VALUE IF NOT EXISTS 'SALARY_REPORT_DEADLINE_REMINDER';
      ALTER TYPE mailbox_delivery_kind_enum ADD VALUE IF NOT EXISTS 'EQUALITY_REPORT_DEADLINE_REMINDER';

      COMMIT;
    `)
  },

  // PostgreSQL cannot drop an enum value. The values stay; nothing writes them
  // once the code that uses them is rolled back.
  down: (queryInterface) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      COMMIT;
    `)
  },
}
