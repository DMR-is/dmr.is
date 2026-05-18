'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- Partial unique index on (provider_type, provider_id).
    -- Enforces one-row-per-tuple for upstream-originated submissions so an
    -- island.is application UUID (or any non-null upstream id) maps to at most
    -- one DoE report. SYSTEM-created rows with null provider_id are excluded
    -- by the WHERE clause and can coexist freely. See db/README.md →
    -- "Provider correlation" for the full contract and the matching
    -- application-layer idempotent-create behaviour in
    -- report-create.service.ts.
    CREATE UNIQUE INDEX report_provider_type_provider_id_unique_idx
      ON report (provider_type, provider_id)
      WHERE provider_id IS NOT NULL;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    DROP INDEX IF EXISTS report_provider_type_provider_id_unique_idx;

    COMMIT;
    `)
  },
}
