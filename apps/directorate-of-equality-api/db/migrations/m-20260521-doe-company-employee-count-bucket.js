'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- company.employee_count_category / company_report mirror
    --
    -- RSK does not give us an exact headcount; companies report into one of
    -- three regulatory buckets (0–24, 25–49, 50+). Replace the integer
    -- average_employee_count_from_rsk column on both company and
    -- company_report (snapshot) with an enum representing the bucket.
    --
    -- The salary-report-required DB trigger previously read the integer
    -- column. It is updated to flag LARGE companies instead.
    -- ============================================================

    CREATE TYPE company_size_enum AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

    ALTER TABLE company
      DROP COLUMN average_employee_count_from_rsk;
    ALTER TABLE company
      ADD COLUMN employee_count_category company_size_enum NOT NULL DEFAULT 'SMALL';

    ALTER TABLE company_report
      DROP COLUMN average_employee_count_from_rsk;
    ALTER TABLE company_report
      ADD COLUMN employee_count_category company_size_enum NOT NULL DEFAULT 'SMALL';

    CREATE OR REPLACE FUNCTION company_sync_salary_report_required()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.salary_report_required_override IS DISTINCT FROM TRUE THEN
        NEW.salary_report_required := (NEW.employee_count_category = 'LARGE');
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

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
        NEW.salary_report_required := (NEW.average_employee_count_from_rsk >= 50);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    ALTER TABLE company_report
      DROP COLUMN employee_count_category;
    ALTER TABLE company_report
      ADD COLUMN average_employee_count_from_rsk INTEGER NOT NULL DEFAULT 0;

    ALTER TABLE company
      DROP COLUMN employee_count_category;
    ALTER TABLE company
      ADD COLUMN average_employee_count_from_rsk INTEGER NOT NULL DEFAULT 0;

    DROP TYPE company_size_enum;

    COMMIT;
    `)
  },
}
