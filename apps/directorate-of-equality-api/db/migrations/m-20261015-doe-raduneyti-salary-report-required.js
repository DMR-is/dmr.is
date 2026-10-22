'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- Every ministry (sector = RADUNEYTI) owes a salary report, whatever its
    -- size. The trigger previously flagged LARGE companies only.
    --
    -- RADUNEYTI is only ever set by hand (updateSector), and the trigger runs
    -- on every UPDATE, so reclassifying a company in or out of RADUNEYTI
    -- re-derives the flag with no application change.
    -- ============================================================

    CREATE OR REPLACE FUNCTION company_sync_salary_report_required()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.salary_report_required_override IS DISTINCT FROM TRUE THEN
        NEW.salary_report_required :=
          (NEW.employee_count_category = 'LARGE' OR NEW.sector = 'RADUNEYTI');
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Backfill: the BEFORE UPDATE trigger re-derives the flag.
    UPDATE company SET sector = sector WHERE sector = 'RADUNEYTI';

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    CREATE OR REPLACE FUNCTION company_sync_salary_report_required()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.salary_report_required_override IS DISTINCT FROM TRUE THEN
        NEW.salary_report_required := (NEW.employee_count_category = 'LARGE');
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    UPDATE company SET sector = sector WHERE sector = 'RADUNEYTI';

    COMMIT;
    `)
  },
}
