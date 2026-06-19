'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Add UNKNOWN to the company lifecycle status. Set by the annual company
    // import when a company we hold is absent from the authoritative register:
    // "should be in the list — something is off, but we don't know what".
    // Distinct from INACTIVE (a deliberate admin deactivation, e.g. bankruptcy
    // or merger).
    //
    // ALTER TYPE ... ADD VALUE must be committed before the new value can be
    // referenced (Postgres forbids using it in the same transaction), so it
    // runs on its own here.
    await queryInterface.sequelize.query(`
      ALTER TYPE company_status_enum ADD VALUE IF NOT EXISTS 'UNKNOWN';
    `)
  },

  async down() {
    // Postgres has no DROP VALUE — removing 'UNKNOWN' would require recreating
    // company_status_enum and rewriting every dependent column. The value is
    // left in place; no-op.
  },
}
