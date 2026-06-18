'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- Outlier groups.
    --
    -- The improvement-plan explanation (reason / action / signature)
    -- moves from the per-outlier row up to a new "outlier group". A
    -- salary report can have multiple groups; each detected outlier
    -- belongs to exactly one group (group_id NOT NULL); the explanation
    -- is written once per group.
    --
    -- Every report with detected outliers always has at least one group.
    -- When a report is submitted with outliers postponed (status =
    -- POSTPONED) a single default group is created covering every detected
    -- outlier, with its explanation columns left NULL; the applicant fills
    -- them in (or replaces the grouping) on resolve. The all-or-none CHECK
    -- that previously lived on report_employee_outlier therefore moves up
    -- to the group: all four explanation columns are NULL (postponed / not
    -- yet filled) or all four are non-empty (explained). The name column is
    -- always NOT NULL.
    -- ============================================================

    CREATE TABLE report_outlier_group (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      report_id UUID NOT NULL REFERENCES report(id),
      name TEXT NOT NULL,
      reason TEXT DEFAULT NULL,
      action TEXT DEFAULT NULL,
      signature_name TEXT DEFAULT NULL,
      signature_role TEXT DEFAULT NULL,

      CONSTRAINT report_outlier_group_explanation_chk CHECK (
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
      )
    );

    CREATE INDEX report_outlier_group_report_id_idx
      ON report_outlier_group (report_id);

    -- ============================================================
    -- report_employee_outlier becomes a thin join.
    --
    --   * gains group_id (NOT NULL — every outlier is always in a group)
    --   * loses the explanation columns (now owned by the group)
    --   * loses the all-or-none CHECK constraint
    --
    -- Dev only: any existing outlier rows carry no group and cannot be
    -- backfilled, so they are discarded before the NOT NULL column is added.
    -- ============================================================

    TRUNCATE TABLE report_employee_outlier;

    ALTER TABLE report_employee_outlier
      ADD COLUMN group_id UUID NOT NULL REFERENCES report_outlier_group(id);

    CREATE INDEX report_employee_outlier_group_id_idx
      ON report_employee_outlier (group_id);

    ALTER TABLE report_employee_outlier
      DROP CONSTRAINT report_employee_outlier_explanation_chk;

    ALTER TABLE report_employee_outlier
      DROP COLUMN reason,
      DROP COLUMN action,
      DROP COLUMN signature_name,
      DROP COLUMN signature_role;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- Restore the per-outlier explanation columns + all-or-none CHECK.
    ALTER TABLE report_employee_outlier
      ADD COLUMN reason TEXT DEFAULT NULL,
      ADD COLUMN action TEXT DEFAULT NULL,
      ADD COLUMN signature_name TEXT DEFAULT NULL,
      ADD COLUMN signature_role TEXT DEFAULT NULL;

    ALTER TABLE report_employee_outlier
      ADD CONSTRAINT report_employee_outlier_explanation_chk CHECK (
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

    DROP INDEX report_employee_outlier_group_id_idx;

    ALTER TABLE report_employee_outlier
      DROP COLUMN group_id;

    DROP TABLE report_outlier_group;

    COMMIT;
    `)
  },
}
