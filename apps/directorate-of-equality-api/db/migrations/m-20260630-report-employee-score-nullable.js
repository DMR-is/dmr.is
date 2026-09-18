'use strict'

/**
 * Draft reports build their employees up incrementally before any scoring
 * exists. Per-employee score is derived from step assignments and is only
 * computed + frozen at submit, so it must be NULL while the report is a DRAFT.
 * Relax the NOT NULL constraint; submitted reports always carry a score.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE report_employee ALTER COLUMN score DROP NOT NULL;
    `)
  },

  async down(queryInterface) {
    // Reinstating NOT NULL requires no NULLs — backfill draft rows to 0 first.
    await queryInterface.sequelize.query(`
      UPDATE report_employee SET score = 0 WHERE score IS NULL;
      ALTER TABLE report_employee ALTER COLUMN score SET NOT NULL;
    `)
  },
}
