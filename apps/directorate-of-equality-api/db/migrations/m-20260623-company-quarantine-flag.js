'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- company.quarantined
    --
    -- Admin-only "halt" switch for a company. When true, the company
    -- receives NO outbound activity from this system: scheduled jobs
    -- (eventual crons), emails / notifications, and any other
    -- automated touchpoint must skip a quarantined company.
    --
    -- Purely manual — there is no computed signal that decides
    -- quarantine. An admin sets it for a specific, agreed-upon case
    -- (typically after discussion with the company). The "when" +
    -- reason are captured on the company_event audit row.
    -- ============================================================

    ALTER TABLE company
      ADD COLUMN quarantined BOOLEAN NOT NULL DEFAULT false;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    ALTER TABLE company
      DROP COLUMN quarantined;

    COMMIT;
    `)
  },
}
