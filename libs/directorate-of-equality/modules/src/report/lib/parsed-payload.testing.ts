import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import {
  ParsedCriterionDto,
  ParsedReportDto,
} from '../../report-excel/dto/parsed-report.dto'
import { MANDATORY_JOB_BASED_CRITERIA } from '../../report-excel/workbook.schema'

/**
 * Test-only. Pads a payload up to semantic validity **without moving a single
 * score.**
 *
 * The fixtures in this repo were built to the structural gate, which accepted
 * one criterion and an unclassified role. They are not valid salary reports —
 * that is the point of `assertParsedPayloadValid` — but their numbers are
 * load-bearing: expected outlier sets and wage-gap figures are derived from the
 * scores they produce.
 *
 * So the padding is inert by construction. Added criteria carry one
 * sub-criterion whose steps all score **0**, and every role is assigned to one
 * of those steps, so `computeEmployeeScores` — a plain sum of assigned step
 * scores — returns exactly what it returned before. Rewriting the weights is
 * free: no scoring path reads a weight.
 *
 * It will not complete assignments on criteria the fixture brought itself.
 * Choosing a step there means choosing a score, which is the fixture's business
 * and not this helper's.
 */
export const padToSemanticValidity = (
  parsed: ParsedReportDto,
): ParsedReportDto => {
  const present = new Set(parsed.criteria.map((c) => c.type))
  const missing = MANDATORY_JOB_BASED_CRITERIA.filter((t) => !present.has(t))

  const filler: ParsedCriterionDto[] = missing.map((type) => ({
    type,
    title: `${type} (padding)`,
    description: 'Score-neutral padding — see padToSemanticValidity',
    weight: 0,
    subCriteria: [
      {
        title: `${type} sub`,
        description: 'Score-neutral padding',
        weight: 0,
        steps: [
          { order: 1, description: 'neutral', score: 0 },
          { order: 2, description: 'neutral', score: 0 },
        ],
      },
    ],
  }))

  const criteria = [...parsed.criteria, ...filler]

  // The whole 100% goes to the first criterion and the first sub-criterion,
  // zero everywhere else. Arbitrary and legal: the rules ask that each list
  // total 100, not how it is distributed.
  const weighted = criteria.map((criterion, index) => ({
    ...criterion,
    weight: index === 0 ? 100 : 0,
    subCriteria: criterion.subCriteria.map((sub, subIndex) => ({
      ...sub,
      weight: index === 0 && subIndex === 0 ? 100 : 0,
    })),
  }))

  const fillerAssignments = filler.map((criterion) => ({
    criterionTitle: criterion.title,
    subTitle: criterion.subCriteria[0].title,
    stepOrder: 1,
  }))

  return {
    ...parsed,
    criteria: weighted,
    roles: parsed.roles.map((role) => ({
      ...role,
      stepAssignments: [...role.stepAssignments, ...fillerAssignments],
    })),
  }
}

/**
 * Test-only. A PERSONAL criterion carrying `steps`, for a fixture that needs
 * per-employee score variation.
 *
 * Which is the only way to get it: a role owns the job-based criteria and an
 * employee owns only the personal ones, so two people in one role differ
 * exactly and only in their einstaklingsbundið scoring. Fixtures that used to
 * vary score by assigning employees individually onto a job-based
 * sub-criterion are expressing something the domain does not allow.
 */
export const personalCriterion = (
  steps: readonly { order: number; description: string; score: number }[],
  title = 'Einstaklingsbundid',
  subTitle = 'Frammistada',
): ParsedCriterionDto => ({
  type: ReportCriterionTypeEnum.PERSONAL,
  title,
  description: 'Personal criterion',
  weight: 0,
  subCriteria: [
    {
      title: subTitle,
      description: 'Personal sub-criterion',
      weight: 0,
      steps: [...steps],
    },
  ],
})
