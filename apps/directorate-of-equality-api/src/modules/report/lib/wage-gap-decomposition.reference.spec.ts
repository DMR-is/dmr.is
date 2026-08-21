/**
 * Reference-dataset regression test.
 *
 * The synthetic cases in `wage-gap-decomposition.spec.ts` prove the *identities*
 * hold. This file proves something the identities cannot: that the whole
 * pipeline reproduces figures an **independent implementation** arrived at over
 * real-shaped data. The reference numbers come from `gap_drivers.py` in
 * `.plans/doe/analysis/`, a standard-library Python implementation written from
 * the same specification but sharing no code with this one. Agreement between
 * the two is evidence the method is right, not merely that the code is
 * self-consistent.
 *
 * ## About the fixture
 *
 * 120 employees (66 karlar / 54 konur), derived from the simulated dataset that
 * accompanied the stakeholders' analyst's exploratory script, reduced to the four
 * fields this module reads.
 *
 * ⚠️ It is **old simulated data on a different data model** (separate vaktaálag
 * columns, no aukagreiðslur, two genders, three `Hæfni 1–5` covariates rather than
 * one summed starfsmatsstig). It validates *algebra*, and none of its constants
 * should be treated as product decisions. `score` here is the SUM of the three
 * Hæfni columns, matching DOE's single summed starfsmatsstig — fitting the three
 * separately gives materially different answers (7,98% / 30 correctable rather
 * than 7,82% / 31), which is exactly the sort of near-miss that reads as a code
 * bug.
 */
import * as fs from 'fs'
import * as path from 'path'

import { GenderEnum } from '../models/report.model'
import {
  computeWageGapDecomposition,
  gapPercentFromLog,
} from './wage-gap-decomposition'

type ReferenceRow = {
  ordinal: number
  gender: 'MALE' | 'FEMALE'
  score: number
  hourlyWage: number
}

const cohort = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '__fixtures__/reference-cohort.json'),
    'utf8',
  ),
) as ReferenceRow[]

const snapshot = computeWageGapDecomposition({
  employees: cohort.map((r) => ({
    ordinal: r.ordinal,
    gender: r.gender === 'MALE' ? GenderEnum.MALE : GenderEnum.FEMALE,
    score: r.score,
    hourlyWage: r.hourlyWage,
  })),
  benchmarkPercent: 3.9,
})

describe('wage-gap-decomposition against the reference cohort', () => {
  it('reads the expected cohort split', () => {
    expect(snapshot.counts).toEqual({ male: 66, female: 54, excluded: 0 })
  })

  it('reproduces óskýrt (leiðréttur launamunur) to 2dp', () => {
    expect(snapshot.oskyrtPercent).toBeCloseTo(7.82, 2)
    expect(snapshot.oskyrtDirection).toBe('FEMALE')
    expect(snapshot.disadvantagedGender).toBe('FEMALE')
  })

  /**
   * Both bases are asserted deliberately: they differ in OPPOSITE directions
   * across the two available datasets (arithmetic 2,67% vs geometric 2,51% on the
   * 56/44 set; 7,48% vs 8,61% here), so a single-dataset test could pass with the
   * wrong one wired in. Arithmetic is the displayed figure — it has to be
   * reproducible in a spreadsheet and comparable to Hagstofa's national number.
   */
  it('reproduces óleiðréttur on both bases', () => {
    expect(snapshot.rawGapPercent).toBeCloseTo(7.48, 2)
    expect(snapshot.rawGapPercentGeometric).toBeCloseTo(8.61, 2)
  })

  it('reproduces the correctable population and the lágmarksmengi', () => {
    expect(snapshot.correctableCount).toBe(31)
    expect(snapshot.minimumSetSize).toBe(5)
  })

  /**
   * ⚠️ Was `3.69` while `oskyrtLogAfterMinimumSet` was computed as
   * `|óskýrt| − Σ|framlag|`. It is now `3.70`: the figure comes from actually
   * refitting with the set's lifts applied, rather than subtracting
   * contributions from a fit held fixed. The pooled slope is estimated from the
   * wages being changed, so lifting anyone moves the line.
   *
   * The set is still 5 members and the figure moved by only 0,01pp, which is
   * precisely why the old approximation looked harmless *here*: 120 rows give a
   * large `SSx`, and the omitted term scales as `1/SSx`. It is not small at the
   * cohort sizes that actually file these reports — see `selectMinimumSet`.
   *
   * This assertion is also the reproducibility contract: raise each set member
   * to the `expectedHourlyWage` the snapshot publishes, re-run the engine, and
   * this is the number you get.
   */
  it('lands under the benchmark after correcting the lágmarksmengi', () => {
    const after = gapPercentFromLog(snapshot.oskyrtLogAfterMinimumSet).percent
    if (after === null) throw new Error('expected a computed percent')

    expect(after).toBeCloseTo(3.7, 2)
    expect(after).toBeLessThan(3.9)
    expect(snapshot.minimumSetClosesGap).toBe(true)
  })

  /**
   * The retired ±1,95% band would have flagged nearly everyone here, which is why
   * decision #13 replaced it with contribution ranking: 5 targeted corrections
   * against a triple-digit flag list.
   */
  it('needs far fewer corrections than the retired fixed band would have flagged', () => {
    expect(snapshot.minimumSetSize).toBeLessThan(snapshot.correctableCount / 5)
  })

  it('still satisfies the identities on real-shaped data', () => {
    expect(
      Math.abs(
        (snapshot.twofold.explained ?? 0) +
          (snapshot.twofold.unexplained ?? 0) -
          (snapshot.rawGapLog ?? 0),
      ),
    ).toBeLessThan(1e-9)

    const contributionSum = snapshot.employees.reduce(
      (total, e) => total + e.contributionLog,
      0,
    )
    expect(Math.abs(contributionSum - (snapshot.oskyrtLog ?? 0))).toBeLessThan(
      1e-9,
    )
  })
})
