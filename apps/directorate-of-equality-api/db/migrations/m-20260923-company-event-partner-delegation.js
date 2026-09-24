'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ALTER TYPE ... ADD VALUE cannot run inside a transaction block, so no
    // BEGIN/COMMIT — the same as m-20260821-company-event-api-key.
    //
    // A company allowing a vendor client to act for it, and withdrawing that,
    // are company-lifecycle events: they decide who may file in the company's
    // name. They go on the existing company_event feed so the admin timeline
    // shows them, with the firm named in `reason`.
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'PARTNER_DELEGATION_GRANTED';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'PARTNER_DELEGATION_REVOKED';
    `)
  },

  async down() {
    // Deliberately a no-op, for the reason m-20260821-company-event-api-key
    // gives: Postgres cannot drop an enum value in place, so reversing this
    // means deleting every event row that uses it — the only record of who
    // allowed a firm to file for a company. Two unused enum values cost
    // nothing; a hole in that history cannot be recovered.
  },
}
