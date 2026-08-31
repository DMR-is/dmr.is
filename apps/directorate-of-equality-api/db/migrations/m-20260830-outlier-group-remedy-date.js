'use strict'

/**
 * `report_outlier_group.remedy_date` — the date the company commits to having
 * this group's úrbætur completed by ("Dagsetning úrbóta").
 *
 * ⚠️ NOT a signature date. `signature_name` / `signature_role` say who stands
 * behind the explanation; this says when the work lands. The distinction
 * matters for the bound: a signature date looks backwards and a remedy date
 * looks forwards, so the service layer accepts only a future date, no further
 * out than the next reporting cycle (three years — see `REPORT_VALIDITY_YEARS`).
 * That bound is deliberately NOT a CHECK constraint: "in the future" is true
 * when the row is written and false forever after, so a DB-level version would
 * reject every later UPDATE of an untouched row.
 *
 * It joins the existing all-or-none explanation block rather than standing
 * apart. An explained group must say when it will be fixed; a postponed one has
 * not been asked yet. So the CHECK grows from four columns to five, on both
 * arms:
 *
 *   - all five NULL          — postponed / not yet filled in
 *   - all five populated     — explained (the four texts non-empty)
 *
 * Backfill: existing explained groups predate the column and would violate the
 * tightened CHECK. `updated_at::date + 3 years` — the row's last write is the
 * closest proxy for when the explanation was entered, and adding the reporting
 * cycle lands the value inside the same future window the service enforces on
 * new writes, rather than importing a date that has already elapsed.
 *
 * ⚠️ The backfilled value is a date the company never named, and the admin UI
 * renders it under "Dagsetning úrbóta" as though it had. That is acceptable
 * only because production holds no explained groups at the time of writing —
 * the table dates from 2026-06-16 and every explained group so far is dev
 * data, so this UPDATE is defensive and touches nothing real. Were it to run
 * against a populated table it would fabricate visible commitments, and the
 * right answer would be to take `remedy_date` out of the all-or-none block
 * instead (an independent nullable, required at the API layer for new writes
 * only) so history stays NULL.
 *
 * ⚠️ Also note `report.correction_deadline`, which is a DIFFERENT date: the
 * deadline the Directorate imposes on the report as a whole ("Frestur til
 * úrbóta"). This one is per group and committed to by the company.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE report_outlier_group
        ADD COLUMN IF NOT EXISTS remedy_date DATE;

      COMMENT ON COLUMN report_outlier_group.remedy_date IS 'Date the company commits to having this group''s improvements completed by (Dagsetning úrbóta). Part of the all-or-none explanation block: NULL while the report is postponed, set once the group is explained. Not a signature date, and distinct from report.correction_deadline (the Directorate-imposed deadline for the whole report).';

      -- Explained groups predate the column; land them inside the same future
      -- window the service enforces rather than at an already-elapsed date.
      -- No-op against production (no explained groups exist); see the header
      -- note before letting this run against a populated table.
      UPDATE report_outlier_group
        SET remedy_date = (updated_at::date + INTERVAL '3 years')::date
        WHERE reason IS NOT NULL
          AND remedy_date IS NULL;

      ALTER TABLE report_outlier_group
        DROP CONSTRAINT IF EXISTS report_outlier_group_explanation_chk;
      ALTER TABLE report_outlier_group
        ADD CONSTRAINT report_outlier_group_explanation_chk CHECK (
          (
            reason IS NULL
            AND action IS NULL
            AND signature_name IS NULL
            AND signature_role IS NULL
            AND remedy_date IS NULL
          ) OR (
            reason IS NOT NULL AND reason <> ''
            AND action IS NOT NULL AND action <> ''
            AND signature_name IS NOT NULL AND signature_name <> ''
            AND signature_role IS NOT NULL AND signature_role <> ''
            AND remedy_date IS NOT NULL
          )
        );

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE report_outlier_group
        DROP CONSTRAINT IF EXISTS report_outlier_group_explanation_chk;
      ALTER TABLE report_outlier_group
        ADD CONSTRAINT report_outlier_group_explanation_chk CHECK (
          (
            reason IS NULL
            AND action IS NULL
            AND signature_name IS NULL
            AND signature_role IS NULL
          ) OR (
            reason IS NOT NULL AND reason <> ''
            AND action IS NOT NULL AND action <> ''
            AND signature_name IS NOT NULL AND signature_name <> ''
            AND signature_role IS NOT NULL AND signature_role <> ''
          )
        );

      ALTER TABLE report_outlier_group
        DROP COLUMN IF EXISTS remedy_date;

      COMMIT;
    `)
  },
}
