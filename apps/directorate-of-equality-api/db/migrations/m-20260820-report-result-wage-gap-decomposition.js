'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- report_result: the Oaxaca-Blinder decomposition snapshot
    --
    -- Frozen at submit alongside the other result snapshots. Carries the two
    -- displayed figures — óleiðréttur (raw) and óskýrður / leiðréttur (the
    -- Oaxaca unexplained term, the figure the 3,9% benchmark tests) — plus the
    -- pooled fit, the per-employee attribution and the lágmarksmengi derived
    -- from it.
    --
    -- Why frozen rather than computed on read: this is the headline regulatory
    -- number. Recomputing it on every read would let an already-published figure
    -- drift the next time the engine changes, with nothing recording that it
    -- moved. report_result is write-once-at-submit by design.
    --
    -- NOT NULL is safe and correct. The shape is ALWAYS produced, even when the
    -- figures cannot be: a single-gender company gets a snapshot with
    -- oskyrtAvailable: false, a populated blockers array and real counts.
    -- "Not computable" is a valid state of a valid report, not an absent value —
    -- so a null column would be indistinguishable from "never analysed".
    -- (No default: the preceding paid-hours migration truncates report, so the
    -- table is empty when this runs.)
    -- ============================================================

    ALTER TABLE report_result
      ADD COLUMN wage_gap_decomposition_snapshot JSONB NOT NULL;

    COMMENT ON COLUMN report_result.wage_gap_decomposition_snapshot IS
      'Frosin Oaxaca-Blinder sundurliðun á log(reglulegu tímakaupi): óleiðréttur og óskýrður (leiðréttur) launamunur, sameiginlegt viðmið, framlag hvers starfsmanns og lágmarksmengi úrbóta.';

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    ALTER TABLE report_result
      DROP COLUMN wage_gap_decomposition_snapshot;

    COMMIT;
    `)
  },
}
