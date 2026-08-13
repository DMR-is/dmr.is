import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import { MAX_STEPS, MIN_STEPS } from '../../report-excel/workbook.schema'
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
 */
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
    expect(
      SUB_CRITERION_GENERAL_SCALE.every((step) => step.length > 0),
    ).toBe(true)
  })
})
