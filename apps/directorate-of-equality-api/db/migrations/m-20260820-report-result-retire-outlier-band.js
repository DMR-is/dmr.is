'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- Retire the fixed +/- band.
    --
    -- Compliance used to be decided per employee: fit a gender-blind line
    -- through (starfsmatsstig, timakaup), then flag anyone further than half
    -- the statutory threshold (1,95%) from it. That rule is gone. It is now
    -- decided company-wide, by the Oaxaca-Blinder unexplained term (oskyrt /
    -- leidrettur launamunur) against the full 3,9% -- and the employees an
    -- urbotaaaetlun must account for are the LAGMARKSMENGI: the fewest
    -- underpaid members of the disadvantaged gender whose correction brings
    -- oskyrt under the benchmark.
    --
    -- Why the column goes rather than staying as a diagnostic: it held three
    -- things, and none survive.
    --   1. method / thresholdPercent / allowedDifferencePercent -- band
    --      scaffolding, meaningless once the band is not the rule.
    --   2. regressions {overall, male, female, neutral} -- four LEVEL-space
    --      fits. Read by nothing: no API path, no web component. The chart
    --      computes its own line live in build-chart.ts.
    --   3. employees[] -- the only live part, and every field of it is carried
    --      better by wage_gap_decomposition_snapshot.employees, which adds the
    --      contribution attribution and the lagmarksmengi flag.
    -- Keeping it would leave two persisted answers to "who is flagged?" in one
    -- row, which is how a reviewer ends up quoting the one that is not the rule.
    --
    -- No data migration: report_employee_outlier is a thin
    -- (report_employee_id, group_id) join, so membership already lives in its
    -- own table. Only the numbers a UI renders alongside it move source.
    -- ============================================================

    ALTER TABLE report_result
      DROP COLUMN outlier_analysis_snapshot;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- Restores the column, NOT its contents: the band no longer exists in code,
    -- so nothing can repopulate it. Rolling back past this point means rolling
    -- back the code too. Nullable on the way back for exactly that reason --
    -- the original was NOT NULL, and any surviving row would have no value to
    -- put there.
    ALTER TABLE report_result
      ADD COLUMN outlier_analysis_snapshot JSONB;

    COMMIT;
    `)
  },
}
