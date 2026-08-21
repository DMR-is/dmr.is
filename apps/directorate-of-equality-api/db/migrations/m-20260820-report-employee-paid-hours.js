'use strict'

/**
 * Override for the destructive guard below. Set it to `true` only when you have
 * decided that wiping every report in the target database is what you want.
 *
 *   DOE_ALLOW_DESTRUCTIVE_MIGRATION=true yarn nx run directorate-of-equality-api:migrate
 */
const OVERRIDE_ENV = 'DOE_ALLOW_DESTRUCTIVE_MIGRATION'

/**
 * Refuses to run when `report` has rows, unless explicitly overridden.
 *
 * ⚠️ **Why this exists.** Both directions of this migration `TRUNCATE report
 * CASCADE`, and nothing about the deployment restricts where that happens:
 * `Dockerfile` runs `sequelize-cli db:migrate` in the container's start command,
 * and `sequelize.config.js` has a `production` block. So the only thing standing
 * between this statement and a populated database was a comment asserting
 * "nothing is on production" — true when written, and not enforced by anything.
 *
 * The guard also settles the narrower worry that this wipes EQUALITY reports as
 * collateral: it cannot now run anywhere that has reports to lose, so scoping
 * the delete to `type = 'SALARY'` would buy nothing. That scoping is not free
 * either — no FK in the report graph declares `ON DELETE CASCADE`, so it would
 * mean hand-ordering deletes across ~14 tables, including two traps
 * (`report_event.related_report_id` pointing at a deleted report from a
 * surviving one, and the nullable `report_employee_role.report_id`). A provably
 * complete `TRUNCATE ... CASCADE` behind a guard beats a hand-ordered delete
 * that might miss a table.
 */
async function assertSafeToWipe(queryInterface, direction) {
  const [row] = await queryInterface.sequelize.query(
    'SELECT count(*)::int AS count FROM report',
    { type: queryInterface.sequelize.QueryTypes.SELECT },
  )
  const count = row ? row.count : 0

  if (count === 0) return
  if (process.env[OVERRIDE_ENV] === 'true') {
    // eslint-disable-next-line no-console
    console.warn(
      `[${direction}] ${OVERRIDE_ENV}=true — wiping ${count} report(s) on purpose.`,
    )
    return
  }

  throw new Error(
    [
      `Refusing to run: "report" has ${count} row(s) and this migration (${direction}) truncates`,
      'every report, of every type, along with report_*, company_report and public_report.',
      '',
      'paid_hours is NOT NULL with no default and was never collected, so there is no honest',
      'value to backfill — which is why the reversal empties rather than invents.',
      '',
      `If losing those rows is genuinely intended, re-run with ${OVERRIDE_ENV}=true.`,
    ].join('\n'),
  )
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await assertSafeToWipe(queryInterface, 'up')
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- report_employee: greiddar stundir replaces starfshlutfall
    --
    -- Pay is now evaluated on REGLULEGT TÍMAKAUP, per the regulation:
    -- "reglulegum launum, reiknuðum niður á tímakaup".
    --
    --   Regluleg laun      = grunnlaun + viðbótarlaun + aukagreiðslur
    --   Reglulegt tímakaup = regluleg laun / greiddar stundir
    --
    -- work_ratio goes rather than joining it: dividing by BOTH a
    -- full-time-equivalent ratio and actual hours would double-count the
    -- part-time correction. Hours normalise for working time directly, and
    -- more precisely than an FTE proxy, so the ratio is superseded — not
    -- additional. Column E of the Launagögn sheet changed meaning in step,
    -- so there is no source for a work ratio any more either.
    --
    -- ⚠️ DEV-ONLY, DESTRUCTIVE, AND SO IS down(). paid_hours is NOT NULL with
    -- no default, so no pre-existing report_employee row can satisfy it and
    -- there is no honest value to backfill — the number was never collected.
    -- Nothing is on production. Wiping buys a single code path: no v1/v2
    -- branching, and no report that mixes an FTE-monthly figure with an
    -- hourly one.
    --
    -- TRUNCATE ... CASCADE walks the whole FK graph, so nothing can be
    -- missed — no FK in the report graph declares ON DELETE CASCADE, which
    -- would otherwise make a hand-ordered delete of 16 tables the only
    -- alternative. Blast radius: report_*, company_report, public_report.
    -- company, config and users are untouched. Seeders regenerate the
    -- equality reports that also go.
    -- ============================================================

    TRUNCATE TABLE report CASCADE;

    -- Safe to ADD NOT NULL and DROP in one statement *because* the TRUNCATE
    -- above leaves report_employee empty: neither operation can violate
    -- anything, and no rewrite of existing rows is required.
    ALTER TABLE report_employee
      ADD COLUMN paid_hours DECIMAL(6, 2) NOT NULL,
      ADD CONSTRAINT report_employee_paid_hours_chk CHECK (paid_hours > 0),
      DROP COLUMN work_ratio;

    COMMENT ON COLUMN report_employee.paid_hours IS
      'Greiddar stundir í mánuðinum, yfirvinnustundir meðtaldar. Undir salary_data_basis=AVERAGE er þetta meðaltal síðustu 12 mánaða. Nefnari reglulegs tímakaups.';

    -- ============================================================
    -- report_result: base_snapshot + full_snapshot collapse to one
    --
    -- The two variants were coherent under the old FTE divisor — both
    -- normalised to "100% starf", one on base pay and one on total pay. Under
    -- an HOURS divisor only the total-pay numerator matches: base_salary /
    -- paid_hours would divide base pay alone by a denominator that includes
    -- the very overtime hours which generated the additional and bonus pay.
    -- That is not redundant, it is arithmetically incoherent, so the "base"
    -- variant is dropped rather than re-based.
    --
    -- Renamed rather than reusing base_snapshot: keeping that name would
    -- preserve the lie that a base-pay-only figure is still in there.
    -- ============================================================

    ALTER TABLE report_result
      DROP COLUMN base_snapshot,
      DROP COLUMN full_snapshot,
      ADD COLUMN salary_snapshot JSONB NOT NULL;

    COMMENT ON COLUMN report_result.salary_snapshot IS
      'Frosin samantekt á reglulegu tímakaupi við innsendingu (heildartölur + stigabil).';

    COMMIT;
    `)
  },

  async down(queryInterface) {
    await assertSafeToWipe(queryInterface, 'down')
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- Symmetrically destructive, and deliberately so. work_ratio was NOT NULL
    -- with no default, and a starfshlutfall cannot be derived from paid hours
    -- (173 hours could be full-time at one employer and 80% at another). The
    -- alternatives were both worse: fabricate 1.0 for every row, or leave the
    -- column nullable and diverge from the schema this reverts to. So the
    -- reversal empties the table instead of inventing data.
    TRUNCATE TABLE report CASCADE;

    ALTER TABLE report_employee
      DROP CONSTRAINT report_employee_paid_hours_chk,
      DROP COLUMN paid_hours,
      ADD COLUMN work_ratio DECIMAL(5, 4) NOT NULL;

    ALTER TABLE report_result
      DROP COLUMN salary_snapshot,
      ADD COLUMN base_snapshot JSONB NOT NULL,
      ADD COLUMN full_snapshot JSONB NOT NULL;

    COMMIT;
    `)
  },
}
