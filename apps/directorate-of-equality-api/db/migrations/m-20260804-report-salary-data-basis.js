'use strict'

/**
 * `report.salary_data_basis` + `report.salary_data_period` — what period the
 * submitted salary data describes. The submittee must declare one of:
 *
 *   MONTH   the figures come from one specific payroll month; the month itself
 *           is carried in `salary_data_period`.
 *   AVERAGE the figures are a twelve-month average; no single month applies, so
 *           `salary_data_period` stays NULL.
 *
 * Both columns are nullable at the DB level even though the flag is mandatory
 * for a submitted salary report:
 *
 *   - `report` also holds EQUALITY rows, which carry no salary data at all;
 *   - a SALARY row starts life as a DRAFT that is filled in field by field, so
 *     the basis (and, for MONTH, the month) arrive at some point during
 *     drafting, not at insert.
 *
 * Requiredness is therefore enforced at submit time by the service layer (all
 * three submit paths: application portal, admin web, draft submit). Existing
 * reports predate the field and stay NULL.
 *
 * The two CHECK constraints capture the invariants that hold at every point in
 * a draft's life (so they never block an in-progress PATCH):
 *   - AVERAGE never carries a month;
 *   - a stored month is always normalised to the 1st, since the value has
 *     month precision.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'salary_data_basis_enum') THEN
          CREATE TYPE salary_data_basis_enum AS ENUM ('MONTH', 'AVERAGE');
        END IF;
      END $$;

      ALTER TABLE report
        ADD COLUMN IF NOT EXISTS salary_data_basis salary_data_basis_enum,
        ADD COLUMN IF NOT EXISTS salary_data_period DATE;

      COMMENT ON COLUMN report.salary_data_basis IS 'Salary-only. Whether the submitted salary data describes one specific payroll month (MONTH) or a twelve-month average (AVERAGE). NULL on equality reports, on drafts that have not declared it yet, and on reports submitted before the field existed. Required at submit for SALARY.';
      COMMENT ON COLUMN report.salary_data_period IS 'Salary-only. The payroll month the data is based on, normalised to the 1st of that month. Set when salary_data_basis = MONTH, NULL for AVERAGE.';

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_salary_data_period_average_null;
      ALTER TABLE report
        ADD CONSTRAINT report_salary_data_period_average_null
        CHECK (salary_data_basis IS DISTINCT FROM 'AVERAGE' OR salary_data_period IS NULL);

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_salary_data_period_first_of_month;
      ALTER TABLE report
        ADD CONSTRAINT report_salary_data_period_first_of_month
        CHECK (salary_data_period IS NULL OR date_part('day', salary_data_period) = 1);

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_salary_data_period_first_of_month;
      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_salary_data_period_average_null;

      ALTER TABLE report
        DROP COLUMN IF EXISTS salary_data_period,
        DROP COLUMN IF EXISTS salary_data_basis;

      DROP TYPE IF EXISTS salary_data_basis_enum;

      COMMIT;
    `)
  },
}
