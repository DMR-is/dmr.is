import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import {
  JOB_BASED_TITLE_TO_TYPE,
  MAX_STEPS,
  MIN_STEPS,
} from '../../report-excel/workbook.schema'
import {
  SUB_CRITERION_CATALOG,
  SUB_CRITERION_GENERAL_SCALE,
} from './sub-criterion-catalog.data'

/**
 * The catalog is generated from the workbook, so these assertions guard the
 * generator's output rather than hand-written data: a regenerated file that
 * silently loses entries, drops step wording or picks up a parent title the
 * criterion parser would later reject should fail here, not at import time in
 * production.
 *
 * `scripts/refresh-sub-criterion-catalog.js` is a plain CJS script and cannot
 * import the TS schema, so it keeps its own copy of the parent→type mapping and
 * the sheet geometry. The cross-checks below are what stop those copies drifting
 * from `workbook.schema.ts`.
 */

/**
 * Icelandic Yfirviðmið labels that resolve to PERSONAL. Two distinct labels for
 * one enum type, which is why the portal groups by `parentTitle` rather than by
 * `criterionType`. Pinned here so a new personal section cannot appear
 * unnoticed — the generator throws on any parent it does not know, and this is
 * the other half of that contract.
 */
const PERSONAL_PARENTS = ['Frammistöðumat', 'Einstaklingsbundinn þáttur']

/** Entry count as shipped. A row silently vanishing from the sheet fails here. */
const EXPECTED_ENTRY_COUNT = 53

describe('sub-criterion catalog', () => {
  it('is non-empty and covers both job-based and personal criteria', () => {
    expect(SUB_CRITERION_CATALOG.length).toBeGreaterThan(0)

    const types = new Set(SUB_CRITERION_CATALOG.map((e) => e.criterionType))
    expect(types).toContain(ReportCriterionTypeEnum.COMPETENCE)
    expect(types).toContain(ReportCriterionTypeEnum.RESPONSIBILITY)
    expect(types).toContain(ReportCriterionTypeEnum.STRAIN)
    expect(types).toContain(ReportCriterionTypeEnum.CONDITION)
    expect(types).toContain(ReportCriterionTypeEnum.PERSONAL)
  })

  it('has a title, description and at least one step on every entry', () => {
    for (const entry of SUB_CRITERION_CATALOG) {
      expect(entry.title.length).toBeGreaterThan(0)
      expect(entry.description.length).toBeGreaterThan(0)
      expect(entry.parentTitle.length).toBeGreaterThan(0)
      expect(entry.steps.length).toBeGreaterThan(0)
      expect(entry.steps.every((step) => step.length > 0)).toBe(true)
    }
  })

  it('keeps numSteps in agreement with the step wording it ships', () => {
    for (const entry of SUB_CRITERION_CATALOG) {
      if (entry.numSteps == null) {
        // Employer-authored scale: step 1 only, the rest is theirs to write.
        expect(entry.steps).toHaveLength(1)
        continue
      }
      expect(entry.numSteps).toBe(entry.steps.length)
      expect(entry.numSteps).toBeGreaterThanOrEqual(MIN_STEPS)
      expect(entry.numSteps).toBeLessThanOrEqual(MAX_STEPS)
    }
  })

  it('never repeats a title under the same parent', () => {
    const seen = new Set<string>()
    for (const entry of SUB_CRITERION_CATALOG) {
      const key = `${entry.parentTitle}::${entry.title}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })

  it('ships the generic step scale', () => {
    expect(SUB_CRITERION_GENERAL_SCALE.length).toBeGreaterThan(0)
    expect(SUB_CRITERION_GENERAL_SCALE.every((step) => step.length > 0)).toBe(
      true,
    )
    expect(SUB_CRITERION_GENERAL_SCALE.length).toBeLessThanOrEqual(MAX_STEPS)
  })

  it('types every job-based entry the way the criterion parser will', () => {
    // The generator keeps its own copy of this mapping. If the two disagree, the
    // portal groups an entry under one criterion while a submitted workbook
    // carrying the same Yfirviðmið is parsed as another.
    for (const entry of SUB_CRITERION_CATALOG) {
      const parserType = JOB_BASED_TITLE_TO_TYPE[entry.parentTitle]
      if (parserType) {
        expect(entry.criterionType).toBe(parserType)
      }
    }
  })

  it('files every PERSONAL entry under a known personal parent', () => {
    // The failure this catches: a renamed or newly-added job-based section
    // falling through to PERSONAL. It would group wrongly in the portal and no
    // other assertion here would notice.
    const personalParents = new Set(
      SUB_CRITERION_CATALOG.filter(
        (entry) => entry.criterionType === ReportCriterionTypeEnum.PERSONAL,
      ).map((entry) => entry.parentTitle),
    )

    expect([...personalParents].sort()).toEqual([...PERSONAL_PARENTS].sort())
    for (const parent of personalParents) {
      expect(JOB_BASED_TITLE_TO_TYPE[parent]).toBeUndefined()
    }
  })

  it('covers every parent label the generator knows, and no others', () => {
    const parents = new Set(SUB_CRITERION_CATALOG.map((e) => e.parentTitle))

    expect([...parents].sort()).toEqual(
      [...Object.keys(JOB_BASED_TITLE_TO_TYPE), ...PERSONAL_PARENTS].sort(),
    )
  })

  it('ships the expected number of entries', () => {
    // Deliberately exact. The generator cannot tell "Jafnréttisstofa removed a
    // sub-criterion" from "a column insert made the read skip rows", so the
    // count is pinned and a change to it is reviewed rather than absorbed.
    expect(SUB_CRITERION_CATALOG).toHaveLength(EXPECTED_ENTRY_COUNT)
  })
})
