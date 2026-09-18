'use strict'

/**
 * `legacy_report` — an archive of the Directorate's outgoing SharePoint
 * register, the hand-kept working sheet ("Adda eftirlit Gagnasafn") this system
 * replaces. One row per sheet row, written once by the register load.
 *
 * ## Why this is not `report` + `company_report`
 *
 * At hand-over, 623 of the sheet's 1 759 rows held a certification that was in
 * force. Minting APPROVED `report` rows for them would fabricate submissions
 * that never went through the flow — no employees, no criteria, no result — and
 * everything that derives from `report` would then answer from that fiction:
 * the salary renewal window, the salary report's equality-report reference, the
 * public register.
 *
 * So no `report` row is ever minted from this table. The compliance status is
 * the one thing that does read it: `companyReportStatusCaseSql` treats a
 * `salary_valid_until` / `equality_valid_until` that has not passed as a second
 * way to be covered. Without that, the load's 1 507 companies at 25+ would all
 * read MISSING_EQUALITY_REPORT on day one — the ~540 with a live equality plan
 * included — which states "has not filed here" as if it meant "is out of
 * compliance".
 *
 * ⚠️ `legacy_status` is never consulted. `validity` is, on the salary side
 * only: a row marked `Útrunnið` is a certificate that was surrendered early,
 * and 20 of them still carry a future date, so the date alone would read them
 * as covered. The equality side stays date-only, because `validity` describes
 * the salary certificate and 120 rows hold a live equality plan beside a
 * lapsed one.
 *
 * ## Everything legacy is TEXT
 *
 * `legacy_status`, `validity`, `change_type` and `certification_type` keep the
 * sheet's own Icelandic strings rather than becoming Postgres enums, because
 * this table's contract is *what the list said*: `change_type` is multi-valued
 * (SharePoint joins choices with `;#`), `legacy_status` gained "í vinnslu"
 * between two exports of the same sheet, and an enum would turn the next
 * re-export into a migration. The mapping into our own vocabulary happens on
 * `company` and belongs in exactly one place.
 *
 * ## No unique constraint on `company_id`, and no upsert key
 *
 * One row per sheet row, not per company. Seven kennitölur appear twice in the
 * source — a renamed ministry, a kennitala shared by two police districts, five
 * genuine duplicates — and the load resolves each to a single `company` row.
 * Both sheet rows are still archived, because dropping one would lose the
 * certification it carried.
 *
 * Two rows can therefore be byte-identical, `legacy_modified_at` included, so
 * there is nothing to upsert on. The register load replaces the table wholesale
 * (`DELETE FROM legacy_report`, then insert), which is safe because nothing
 * else ever writes here. `ON DELETE CASCADE` covers the other direction: an
 * archive row is meaningless without its company.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE IF NOT EXISTS legacy_report (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
        national_id TEXT NOT NULL,

        legacy_status TEXT,
        validity TEXT,
        change_type TEXT,
        certification_type TEXT,

        certified_at DATE,
        salary_valid_until DATE,
        equality_valid_until DATE,

        round TEXT,
        case_number TEXT,
        equality_case_number TEXT,
        certifier TEXT,

        male_count INTEGER,
        female_count INTEGER,
        neutral_count INTEGER,
        top_manager_gender TEXT,
        gender_pay_gap TEXT,

        employee_count INTEGER,
        size_category_new TEXT,
        size_category_old TEXT,

        contact_name TEXT,
        income_year TEXT,
        notes TEXT,

        reminder_sent_6_months BOOLEAN,
        reminder_sent_2_weeks BOOLEAN,

        legacy_created_at TIMESTAMPTZ,
        legacy_modified_at TIMESTAMPTZ
      );

      -- The only access path: "show me this company's legacy record".
      CREATE INDEX IF NOT EXISTS legacy_report_company_id_idx
        ON legacy_report (company_id);

      -- ⚠️ Superseded, and deliberately left as it was issued. This migration has
      -- already run wherever the register load has (the load commits the company
      -- rows and the legacy_report rows in one transaction, so one implies the
      -- other), which includes production. Rewriting the string here would
      -- therefore only change what a database created from scratch gets, and
      -- leave every already-migrated one on the old text — a third state.
      -- m-20260902-legacy-report-comment.js re-issues the current comment, so
      -- both kinds of database converge on it.
      COMMENT ON TABLE legacy_report IS 'Archive of the Directorate''s retired SharePoint register (Adda eftirlit Gagnasafn), one row per sheet row. Written once by the company-register load, read only by the company detail view''s legacy tab. Nothing derives from it — compliance status still comes from report/company_report.';

      COMMENT ON COLUMN legacy_report.national_id IS 'Kennitala exactly as the sheet held it, unvalidated. 13 source rows fail checksum validation (legacy institutional 71026x IDs, plus two truncated to 9 digits); company_id is the resolved company.';
      COMMENT ON COLUMN legacy_report.legacy_status IS 'Staða — the legacy workflow state, verbatim: ólokið, Lokið, undanþága, hætt, í vinnslu. Deliberately TEXT, not an enum; see the migration header.';
      COMMENT ON COLUMN legacy_report.validity IS 'Í gildi — "Í gildi" or "Útrunnið", verbatim. Blank means the list never recorded one, which in practice means never certified.';
      COMMENT ON COLUMN legacy_report.change_type IS 'Breyting — what changed since the previous list (Nýtt, Dottið út, Nafn, Stærðarflokkun). Multi-valued, joined with ";#".';
      COMMENT ON COLUMN legacy_report.certification_type IS 'Jafnlaunavottun/staðfesting — "Vottun" (accredited body) or "Staðfesting" (confirmed by the Directorate itself).';
      COMMENT ON COLUMN legacy_report.salary_valid_until IS 'Gildistími vottunar/staðfestingar — the certificate''s stated expiry as the old list recorded it. NOT company.next_salary_report_due_at: that is a live deadline the approval flow advances, and for the 20 rows whose certificate was surrendered early the two never agreed.';
      COMMENT ON COLUMN legacy_report.gender_pay_gap IS 'Kynb. launamunur. TEXT because the few populated rows mix a percentage ("1,6") with what look like ISK amounts ("396"); the archive does not decide which was meant.';
      COMMENT ON COLUMN legacy_report.employee_count IS 'Starfsmannafjöldi — informational only. Frequently at odds with the size buckets beside it (64 rows bucketed 50+ hold fewer than 50). company.employee_count_category is mapped from size_category_new.';
      COMMENT ON COLUMN legacy_report.notes IS 'Breytingar / Áður flokkað — the admins'' free-text notes. Also seeded onto the company timeline as a system company_comment, so an admin meets it without opening this tab.';
      COMMENT ON COLUMN legacy_report.reminder_sent_6_months IS 'Whether the legacy list had already chased the company at the 6-month mark. Not read by the report-deadline-reminder task, which dedupes on company_event; kept as the only record of pre-hand-over reminders.';
      COMMENT ON COLUMN legacy_report.reminder_sent_2_weeks IS 'Whether the legacy list had already chased the company at the 2-week mark. See reminder_sent_6_months.';
      COMMENT ON COLUMN legacy_report.legacy_created_at IS 'SharePoint''s own Created. Distinct from created_at, which records when this archive row was loaded.';
      COMMENT ON COLUMN legacy_report.legacy_modified_at IS 'SharePoint''s own Modified. This is what resolves duplicate kennitölur in the load — the latest edit wins.';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      DROP TABLE IF EXISTS legacy_report;

      COMMIT;
    `)
  },
}
