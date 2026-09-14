'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- company.next_equality_report_due_at — clear where nothing is owed
    --
    -- The register load (scripts/company-register-to-sql.ts) seeds this column
    -- from the old SharePoint sheet's "Gildistíma jafnréttisáætlunar" for
    -- companies of EVERY size. The salary column beside it is size-gated on
    -- insert and actively cleared on upsert; this one never got the same
    -- treatment. So companies below 25 employees — which owe no equality plan
    -- at all — carry live, often past, due dates.
    --
    -- Two readers acted on that: the admin list showed "Skiladagur liðinn"
    -- beside "Fullnægjandi", and ReportDeadlineReminderTask put those companies
    -- into its reminder bands. Both are now gated on the obligation itself
    -- (equalityRequiredSql), so this migration is not what fixes them.
    --
    -- What it fixes is the column. A stored value that means nothing is a trap
    -- for the next thing to read it raw — an export, a report, an ad-hoc query,
    -- a feature written after everyone has forgotten the seeding asymmetry.
    -- Hence: conservative, not maximal. It clears only what the load can have
    -- written, and only where no obligation exists.
    --
    -- NOT cleared, deliberately:
    --
    --   * UNKNOWN size. equalityRequiredSql treats UNKNOWN as owing nothing, so
    --     those companies already read "Á ekki við" — but "we could not read
    --     the size" is not "the company owes nothing", and the load makes
    --     exactly this carve-out for the salary column. Clearing on UNKNOWN
    --     would destroy a deadline an approval had advanced.
    --
    --   * Any company with an APPROVED or SUPERSEDED equality report. There the
    --     date may have come from advanceCompanyReportDueDate rather than the
    --     load — a company that filed while 50+ and was later reclassified
    --     down. Clearing it is unrecoverable in normal operation: reclassify
    --     back up and the gate re-opens onto a NULL, so the company reads as
    --     never overdue. This guard is also what makes "down" exact, because
    --     under it the load seed is the only possible source of the value.
    -- ============================================================

    UPDATE company c
    SET next_equality_report_due_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE c.next_equality_report_due_at IS NOT NULL
      AND c.employee_count_category = 'SMALL'
      AND c.salary_report_required IS NOT TRUE
      AND c.salary_report_required_override IS NOT TRUE
      AND NOT EXISTS (
        SELECT 1 FROM company_report cr
        JOIN report r ON r.id = cr.report_id
        WHERE cr.company_id = c.id
          AND cr.parent_company_id IS NULL
          AND r.type = 'EQUALITY'
          AND r.status IN ('APPROVED', 'SUPERSEDED')
      );

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- Restore from legacy_report, which holds the same sheet cell verbatim
    -- (the load writes equalityDueAt to both). Under the up's guard the load
    -- seed was the only possible source, so this reconstructs the exact values.
    --
    -- ⚠️ 23:59:59+00 reproduces the load's dayToTimestamp: a due date is the
    -- last moment the certification is still good. Restoring at midnight would
    -- move every date back a day.
    --
    -- ⚠️ MAX(...) GROUP BY because six companies were resolved from two sheet
    -- rows each (1 753 companies, 1 759 legacy rows).
    --
    -- ⚠️ Known imprecision: this cannot distinguish a row the up cleared from a
    -- SMALL company that was already NULL for some other reason, since the up
    -- records nothing. In practice the load's COALESCE means a legacy equality
    -- date implies a company date, so the set is tight. If an exact rollback is
    -- ever needed, change the up to write the cleared (company_id, old_value)
    -- pairs to a scratch table and restore from that instead.

    UPDATE company c
    SET next_equality_report_due_at =
          (lr.equality_valid_until::text || ' 23:59:59+00')::timestamptz,
        updated_at = CURRENT_TIMESTAMP
    FROM (
      SELECT company_id, MAX(equality_valid_until) AS equality_valid_until
      FROM legacy_report
      WHERE equality_valid_until IS NOT NULL
      GROUP BY company_id
    ) lr
    WHERE lr.company_id = c.id
      AND c.next_equality_report_due_at IS NULL
      AND c.employee_count_category = 'SMALL'
      AND c.salary_report_required IS NOT TRUE
      AND c.salary_report_required_override IS NOT TRUE;

    COMMIT;
    `)
  },
}
