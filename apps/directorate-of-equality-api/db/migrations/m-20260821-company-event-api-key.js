'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ALTER TYPE ... ADD VALUE cannot run inside a transaction block:
    // Postgres forbids referencing a newly added value in the same
    // transaction that added it. Hence no BEGIN/COMMIT here, unlike the
    // rest of this directory.
    //
    // Issuing and revoking a machine credential is a company-lifecycle
    // event, so it belongs on the existing company_event feed rather
    // than in a table of its own — the admin timeline then surfaces it
    // for free.
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'API_KEY_ISSUED';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'API_KEY_REVOKED';
    `)
  },

  async down() {
    // Deliberately a no-op.
    //
    // Reversing this means rebuilding company_event_type_enum without the two
    // values, and Postgres cannot drop an enum value in place — so the rebuild
    // has to DELETE every API_KEY_ISSUED and API_KEY_REVOKED row first.
    // company_event is append-only and is the only record that a machine
    // credential was ever issued or revoked for a company. A down/up round trip
    // would destroy exactly the audit trail this migration exists to create.
    //
    // Two leftover values on an enum cost nothing; a hole in the audit history
    // cannot be recovered. m-20260511-add-unassigned-event-type and
    // m-20260629-report-event-system-auto-review made the same call for the same
    // reason.
    //
    // If the type genuinely has to be rebuilt, do it as its own migration with
    // the row-preservation strategy stated explicitly, rather than as a
    // side-effect of rolling this one back.
  },
}
