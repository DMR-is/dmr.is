import {
  actionPlanMissingSql,
  companyHasLegacyReportsSql,
  companyReportStatusCaseSql,
  equalityObligationStatusCaseSql,
  equalityReportMissingSql,
  equalityReportOverdueSql,
  equalityRequiredSql,
  notLegallyObligedSql,
  salaryObligationStatusCaseSql,
  salaryReportMissingSql,
  salaryReportOverdueSql,
  salaryRequiredSql,
} from './report-status'

/**
 * These functions emit raw SQL, so a typo in a table or column name is not a
 * compile error — it is a 500 on every company list request. The assertions pin
 * the identifiers, plus the handful of judgement calls that are easy to "tidy"
 * into the wrong thing.
 *
 * ⚠️ Each predicate is asserted on its own rather than by slicing the composed
 * `CASE` string. The previous version located a branch by the position of the
 * status name it yields, which silently changed meaning the moment the branches
 * were reordered — the salary slice began including the action-plan branch, and
 * its assertions kept passing while testing the wrong text.
 */
describe('obligation predicates', () => {
  describe('equalityRequiredSql', () => {
    it('owes at 25+, and never for SMALL or UNKNOWN on size alone', () => {
      expect(equalityRequiredSql).toContain("IN ('MEDIUM', 'LARGE')")
      expect(equalityRequiredSql).not.toContain("'SMALL'")
      expect(equalityRequiredSql).not.toContain("'UNKNOWN'")
    })

    it('also owes whenever a salary report is owed', () => {
      // A launagreining presupposes the plan, so an admin override on the
      // salary side pulls the equality obligation in with it.
      expect(equalityRequiredSql).toContain(salaryRequiredSql)
    })
  })

  describe('salaryRequiredSql', () => {
    it('reads the trigger-maintained flag or the admin override', () => {
      expect(salaryRequiredSql).toContain(
        '"CompanyModel"."salary_report_required" = true',
      )
      expect(salaryRequiredSql).toContain(
        '"CompanyModel"."salary_report_required_override" = true',
      )
    })

    it('does not restate the size rule the DB trigger owns', () => {
      // `company_sync_salary_report_required` derives the flag from
      // employee_count_category = 'LARGE'. Duplicating that here is how the two
      // come to disagree after a bucket is added or moved.
      expect(salaryRequiredSql).not.toContain('employee_count_category')
    })
  })

  describe('notLegallyObligedSql', () => {
    it('is SMALL with no salary obligation', () => {
      expect(notLegallyObligedSql).toContain("= 'SMALL'")
      expect(notLegallyObligedSql).toContain(`NOT ${salaryRequiredSql}`)
    })

    it('does NOT sweep up UNKNOWN', () => {
      // ⚠️ This drives a default-on hide in the admin list. UNKNOWN means the
      // size was never established — an auto-provisioned company waiting to be
      // classified — and hiding those removes the very queue an admin has to
      // work through, with nothing else surfacing it. An open question is not a
      // settled "owes nothing".
      expect(notLegallyObligedSql).not.toContain('UNKNOWN')
    })

    it('respects the salary override, so a 0-24 special case stays visible', () => {
      // Some companies under 25 are required to report by arrangement, recorded
      // as salary_report_required_override. Keying this on size alone would
      // hide exactly the special cases the Directorate tracks by hand.
      expect(notLegallyObligedSql).toContain('salary_report_required_override')
    })
  })

  describe('equalityReportMissingSql', () => {
    const sql = equalityReportMissingSql()

    it('is gated on the obligation', () => {
      expect(sql).toContain(equalityRequiredSql)
    })

    it('treats an unexpired legacy certification as coverage', () => {
      expect(sql).toContain('lr.equality_valid_until >= CURRENT_DATE')
      expect(sql).toContain('FROM "legacy_report" lr')
      expect(sql).toContain('lr.company_id = "CompanyModel"."id"')
    })

    it('judges the legacy side on its own date alone', () => {
      // `validity` describes the *salary* certification. 120 register rows hold
      // a live equality plan beside a lapsed one, so filtering on it here would
      // mark them as missing a plan they hold.
      expect(sql).not.toMatch(/lr\."?validity"?/)
      expect(sql).not.toMatch(/lr\."?legacy_status"?/)
    })

    it('compares legacy dates against CURRENT_DATE, not NOW()', () => {
      // DATEONLY: a certificate stated valid until today is valid through
      // today, and `> NOW()` would expire it at midnight.
      expect(sql).not.toMatch(/lr\.\w+_valid_until\s*>\s*NOW\(\)/)
    })

    it('still accepts an APPROVED, in-force report as the other way to be covered', () => {
      expect(sql).toContain("r.status = 'APPROVED'")
      expect(sql).toContain('r.valid_until > NOW()')
    })
  })

  describe('actionPlanMissingSql', () => {
    const sql = actionPlanMissingSql()

    it('is exactly a postponed salary report', () => {
      expect(sql).toContain("r.type = 'SALARY'")
      expect(sql).toContain("r.status = 'POSTPONED'")
    })

    it('carries no obligation gate of its own', () => {
      // A postponed report exists only because the company filed one, so the
      // obligation is already evidenced. Gating it would additionally hide the
      // outstanding úrbótaáætlun of a company whose size was corrected
      // downwards after filing.
      expect(sql).not.toContain('employee_count_category')
      expect(sql).not.toContain('salary_report_required')
    })
  })

  describe('salaryReportMissingSql', () => {
    const sql = salaryReportMissingSql()

    it('is gated on the obligation', () => {
      expect(sql).toContain(salaryRequiredSql)
    })

    it('excludes a postponed report, so it cannot overlap the action plan', () => {
      // ⚠️ The whole point. A POSTPONED report is not APPROVED, so it is not
      // covered — without this exclusion both predicates describe it, and a
      // company that HAS filed a launagreining is told it is missing one.
      expect(sql).toContain(`NOT ${actionPlanMissingSql()}`)
    })

    it('does not count a surrendered certificate as coverage', () => {
      // 20 register rows are marked Útrunnið while carrying a *future* date,
      // the certificate having been given up early. The date alone would read
      // them as covered, and nothing else would catch it: the same cell seeds
      // next_salary_report_due_at, so they are not overdue either.
      // Normalised on both sides — `validity` is free text the load copies from
      // the sheet verbatim, so an exact match would be undone by a re-export
      // that spelled the word with different casing, silently and for all 20 at
      // once, because the load replaces legacy_report wholesale.
      expect(sql).toContain(
        "lower(btrim(lr.validity)) IS DISTINCT FROM lower('Útrunnið')",
      )
    })

    it('never reads legacy_status', () => {
      // Staða is the old workflow's own state (ólokið / Lokið / hætt); a
      // company's standing here is computed, not copied.
      expect(sql).not.toMatch(/lr\."?legacy_status"?/)
    })
  })
})

/**
 * The roll-up. Its job is to name the single most pressing problem, so the only
 * thing that can go wrong structurally is the order of the branches — and that
 * is precisely what the enum's declaration order invites someone to "restore".
 */
describe('companyReportStatusCaseSql', () => {
  const sql = companyReportStatusCaseSql()

  it('evaluates the action plan BEFORE the missing salary report', () => {
    // ⚠️ NOT the enum's declaration order, and not arbitrary. A POSTPONED
    // report is not APPROVED, so before the reorder the salary branch always
    // won and MISSING_ACTION_PLAN was unreachable in every ordinary case.
    expect(sql.indexOf('MISSING_EQUALITY_REPORT')).toBeLessThan(
      sql.indexOf('MISSING_ACTION_PLAN'),
    )
    expect(sql.indexOf('MISSING_ACTION_PLAN')).toBeLessThan(
      sql.indexOf('MISSING_SALARY_REPORT'),
    )
  })

  it('is composed of the shared predicates, not its own copies of them', () => {
    // This is what keeps the roll-up, the per-obligation columns and the list
    // filter from drifting: there is one definition of each rule and three
    // consumers of it.
    expect(sql).toContain(equalityReportMissingSql())
    expect(sql).toContain(actionPlanMissingSql())
    expect(sql).toContain(salaryReportMissingSql())
  })

  it('falls through to SATISFACTORY', () => {
    expect(sql).toContain("ELSE 'SATISFACTORY'")
  })
})

/**
 * The per-obligation columns. Same predicates, different shape: each answers
 * one report type completely, including the "owes nothing" case the roll-up has
 * no way to express.
 */
describe('obligation status expressions', () => {
  describe('equalityObligationStatusCaseSql', () => {
    const sql = equalityObligationStatusCaseSql()

    it('answers NOT_REQUIRED before anything else', () => {
      expect(sql.indexOf('NOT_REQUIRED')).toBeLessThan(sql.indexOf('MISSING'))
      expect(sql).toContain(`NOT ${equalityRequiredSql}`)
    })

    it('never yields ACTION_PLAN_MISSING', () => {
      // An equality report has no outlier groups and cannot be postponed. The
      // two fields share an enum but not its inhabited range.
      expect(sql).not.toContain('ACTION_PLAN_MISSING')
    })

    it('reuses the shared missing predicate', () => {
      expect(sql).toContain(equalityReportMissingSql())
    })
  })

  describe('salaryObligationStatusCaseSql', () => {
    const sql = salaryObligationStatusCaseSql()

    it('answers NOT_REQUIRED before anything else', () => {
      expect(sql).toContain(`NOT ${salaryRequiredSql}`)
      expect(sql.indexOf('NOT_REQUIRED')).toBeLessThan(
        sql.indexOf('ACTION_PLAN_MISSING'),
      )
    })

    it('tests the action plan before the missing report', () => {
      // Same ordering rule as the roll-up, for the same reason.
      expect(sql.indexOf('ACTION_PLAN_MISSING')).toBeLessThan(
        sql.indexOf("THEN 'MISSING'"),
      )
    })

    it('reuses the shared predicates', () => {
      expect(sql).toContain(actionPlanMissingSql())
      expect(sql).toContain(salaryReportMissingSql())
    })
  })
})

/**
 * The overdue flags. Both were previously a bare date comparison, which is the
 * bug that put "Skiladagur liðinn" beside "Fullnægjandi" on companies below 25.
 */
describe('overdue predicates', () => {
  it('gates the equality flag on the obligation', () => {
    // ⚠️ The register load seeds next_equality_report_due_at from the old
    // sheet for companies of EVERY size — unlike the salary column, which it
    // size-gates on insert and actively clears on upsert. So most companies
    // below 25 carry a past date against a plan they do not owe, and an
    // ungated read marks all of them overdue.
    const sql = equalityReportOverdueSql()
    expect(sql).toContain(equalityRequiredSql)
    expect(sql).toContain(
      '"CompanyModel"."next_equality_report_due_at" < NOW()',
    )
    expect(sql).toContain(
      '"CompanyModel"."next_equality_report_due_at" IS NOT NULL',
    )
  })

  it('gates the salary flag on the obligation', () => {
    const sql = salaryReportOverdueSql()
    expect(sql).toContain(salaryRequiredSql)
    expect(sql).toContain('"CompanyModel"."next_salary_report_due_at" < NOW()')
    expect(sql).toContain(
      '"CompanyModel"."next_salary_report_due_at" IS NOT NULL',
    )
  })

  it('reads each report type against its own column', () => {
    // Crossed columns would be invisible: both are timestamps on the same row,
    // so the query still runs and every assertion about "overdue" still holds —
    // for the wrong deadline.
    expect(equalityReportOverdueSql()).not.toContain(
      'next_salary_report_due_at',
    )
    expect(salaryReportOverdueSql()).not.toContain(
      'next_equality_report_due_at',
    )
  })
})

/**
 * The flag that decides whether the detail view offers the legacy tab at all.
 * Raw SQL again, and the failure is quiet in the other direction: a wrong
 * identifier here 500s the company list, and a *narrowed* predicate hides the
 * tab on companies whose archive rows exist.
 */
describe('companyHasLegacyReportsSql', () => {
  const sql = companyHasLegacyReportsSql()

  it('pins the archive table and the correlation to the outer company', () => {
    expect(sql).toContain('FROM "legacy_report" lr')
    expect(sql).toContain('lr.company_id = "CompanyModel"."id"')
  })

  it('asks only whether a row exists', () => {
    // Existence, not coverage: the tab shows what the old list said, so a
    // lapsed or surrendered certificate must still open it. Any date, validity
    // or status test here would hide history an admin came to read.
    expect(sql).toContain('EXISTS')
    expect(sql).not.toMatch(/valid_until/)
    expect(sql).not.toMatch(/lr\."?validity"?/)
    expect(sql).not.toMatch(/lr\."?legacy_status"?/)
  })
})
