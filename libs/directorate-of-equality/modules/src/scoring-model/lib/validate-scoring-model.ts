import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import {
  MANDATORY_JOB_BASED_CRITERIA,
  MAX_PERSONAL_CRITERIA,
  MAX_STEPS,
  MIN_STEPS,
} from '../../report-excel/workbook.schema'
import { ScoringCriterionDto } from '../dto/scoring-criterion.dto'
import { ScoringRoleDto } from '../dto/scoring-model.dto'
import {
  ScoringModelStatusEnum,
  ScoringModelValidationDto,
  ScoringValidationReasonDto,
  ScoringValidationScopeEnum,
} from '../dto/scoring-validation.dto'

/**
 * Weights are stored as DECIMAL(6,4) and summed in floating point, so an exact
 * `=== 100` would reject models that are correct to every digit anyone typed.
 * Same tolerance the submission validator uses.
 */
const WEIGHT_EPSILON = 0.01

/** Guard against a pathological model producing an unbounded response. */
const MAX_REASONS = 200

const approximately = (actual: number, expected: number): boolean =>
  Math.abs(actual - expected) <= WEIGHT_EPSILON

const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0)

/**
 * Sub-criterion titles are not unique — nothing stops "Menntun" appearing under
 * two criteria, and a model built from the catalog will often have repeats. So
 * a reason names the parent too, in the same `Ábyrgð / Mannaforráð` form the
 * submission validator uses.
 */
const labelFor = (
  criteria: readonly ScoringCriterionDto[],
): Map<string, string> => {
  const labels = new Map<string, string>()
  for (const criterion of criteria) {
    for (const sub of criterion.subCriteria) {
      labels.set(sub.id, `${criterion.title} / ${sub.title}`)
    }
  }
  return labels
}

type ScoringModelShape = {
  criteria: ScoringCriterionDto[]
  roles: ScoringRoleDto[]
}

class ReasonBag {
  private readonly reasons: ScoringValidationReasonDto[] = []

  add(scope: ScoringValidationScopeEnum, message: string): void {
    if (this.reasons.length >= MAX_REASONS) return
    this.reasons.push({ scope, message })
  }

  all(): ScoringValidationReasonDto[] {
    return this.reasons
  }
}

/**
 * Is this scoring model fit to file a salary report against?
 *
 * Covers the rules that can be decided from the model alone. Two of the
 * submission's rules cannot be checked here because they need the filing's
 * employees — the minimum population, and every employee carrying exactly one
 * assignment per personal sub-criterion. So `VALID` means "this model is
 * complete", never "the next filing will succeed".
 */
export const validateScoringModel = (
  model: ScoringModelShape,
): ScoringModelValidationDto => {
  const reasons = new ReasonBag()
  const { criteria, roles } = model

  const presentTypes = new Set(criteria.map((c) => c.type))
  for (const required of MANDATORY_JOB_BASED_CRITERIA) {
    if (!presentTypes.has(required)) {
      reasons.add(
        ScoringValidationScopeEnum.CRITERIA,
        `Skyldubundið starfsbundið viðmið „${required}“ vantar — hvert starfsmat verður að innihalda öll fjögur`,
      )
    }
  }

  const personalCount = criteria.filter(
    (c) => c.type === ReportCriterionTypeEnum.PERSONAL,
  ).length
  if (personalCount > MAX_PERSONAL_CRITERIA) {
    reasons.add(
      ScoringValidationScopeEnum.CRITERIA,
      `Að hámarki ${MAX_PERSONAL_CRITERIA} einstaklingsbundið viðmið er leyft; fjöldi var ${personalCount}`,
    )
  }

  const allSubs = criteria.flatMap((c) => c.subCriteria)
  const labels = labelFor(criteria)
  const label = (id: string): string => labels.get(id) ?? id

  if (allSubs.length === 0) {
    reasons.add(
      ScoringValidationScopeEnum.SUB_CRITERIA,
      'Starfsmatið hefur engin undirviðmið — ekkert er hægt að meta',
    )
  } else {
    const total = sum(allSubs.map((s) => s.weight))
    if (!approximately(total, 100)) {
      reasons.add(
        ScoringValidationScopeEnum.SUB_CRITERIA,
        `Vægi undirviðmiða leggst saman í ${total}%, á að vera 100%`,
      )
    }
  }

  // A step's score is (stepOrder / numSteps) x weight x SCORE_FACTOR, so the
  // orders have to be 1..n with no gaps. With orders 1, 2 and 5 the scale has
  // three steps and the last one scores 5/3 of its own maximum.
  for (const sub of allSubs) {
    if (sub.steps.length === 0) {
      reasons.add(
        ScoringValidationScopeEnum.STEPS,
        `Undirviðmiðið „${label(sub.id)}“ hefur engin þrep`,
      )
      continue
    }

    // The same bounds `assertParsedPayloadIntegrity` enforces on every filing
    // path. Without this a scale of one step, or of twelve, reads VALID here
    // and is refused at submit — the precise failure this validation exists to
    // prevent.
    if (sub.steps.length < MIN_STEPS || sub.steps.length > MAX_STEPS) {
      reasons.add(
        ScoringValidationScopeEnum.STEPS,
        `Undirviðmiðið „${label(sub.id)}“ hefur ${sub.steps.length} þrep; leyfilegt bil er ${MIN_STEPS}–${MAX_STEPS}`,
      )
    }

    const orders = sub.steps.map((s) => s.stepOrder).sort((a, b) => a - b)
    const contiguous = orders.every((order, i) => order === i + 1)
    if (!contiguous) {
      reasons.add(
        ScoringValidationScopeEnum.STEPS,
        `Þrep undirviðmiðsins „${label(sub.id)}“ verða að vera samfelld frá 1; fundust ${orders.join(', ')}`,
      )
    }
  }

  // A role owns the job-based criteria: exactly one assignment per role per
  // job-based sub-criterion. Personal sub-criteria belong to the employee and a
  // role must not be assigned on them.
  const jobBasedSubIds = new Set(
    criteria
      .filter((c) => c.type !== ReportCriterionTypeEnum.PERSONAL)
      .flatMap((c) => c.subCriteria)
      .map((s) => s.id),
  )
  const personalSubIds = new Set(
    criteria
      .filter((c) => c.type === ReportCriterionTypeEnum.PERSONAL)
      .flatMap((c) => c.subCriteria)
      .map((s) => s.id),
  )

  for (const role of roles) {
    const assigned = new Set(
      role.stepAssignments.map((a) => a.subCriterionId),
    )

    for (const subId of jobBasedSubIds) {
      if (!assigned.has(subId)) {
        reasons.add(
          ScoringValidationScopeEnum.ROLE_ASSIGNMENTS,
          `Starfið „${role.title}“: vantar úthlutun fyrir „${label(subId)}“`,
        )
      }
    }

    for (const assignment of role.stepAssignments) {
      if (personalSubIds.has(assignment.subCriterionId)) {
        reasons.add(
          ScoringValidationScopeEnum.ROLE_ASSIGNMENTS,
          `Starfið „${role.title}“: „${label(assignment.subCriterionId)}“ er einstaklingsbundið viðmið og er metið á starfsmann, ekki starf`,
        )
      }
    }
  }

  if (roles.length === 0 && allSubs.length > 0) {
    reasons.add(
      ScoringValidationScopeEnum.ROLES,
      'Starfsmatið hefur engin störf — ekkert er hægt að meta á starf',
    )
  }

  const all = reasons.all()
  return {
    status: all.length === 0
      ? ScoringModelStatusEnum.VALID
      : ScoringModelStatusEnum.INVALID,
    reasons: all,
  }
}
