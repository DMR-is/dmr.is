'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- isat_category reference table + company.isat_category_code
    --
    -- ÍSAT2008 industry classification (Hagstofan). Seeded with the 665 leaf
    -- (5-digit / two-dot) codes only — a company is always classified at its
    -- own leaf. 'code' is the normalized form (e.g. '01110'); 'code_dotted'
    -- (e.g. '01.11.0') is kept for display.
    --
    -- company.isat_category_code is admin-owned statistics data, refreshed by a
    -- manual annual job. It is independent of company_report.isat_category,
    -- which remains a free-text submission snapshot. See db/README.md.
    -- ============================================================

    CREATE TABLE isat_category (
      code TEXT PRIMARY KEY,
      code_dotted TEXT NOT NULL,
      description TEXT NOT NULL,
      description_en TEXT NOT NULL
    );

    ALTER TABLE company
      ADD COLUMN isat_category_code TEXT DEFAULT NULL
        REFERENCES isat_category(code) ON DELETE RESTRICT;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    ALTER TABLE company
      DROP COLUMN isat_category_code;

    DROP TABLE isat_category;

    COMMIT;
    `)
  },
}
