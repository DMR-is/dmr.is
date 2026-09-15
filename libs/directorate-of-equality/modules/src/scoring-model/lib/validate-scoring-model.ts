import { BadRequestException } from '@nestjs/common'

import {
  assertWithinCapacity,
  collectParsedPayloadIntegrity,
} from '../../report/lib/employee-scores'
import {
  PayloadIssueBag,
  PayloadIssueScope,
} from '../../report/lib/parsed-payload-issues'
import { collectParsedPayloadSemantics } from '../../report/lib/parsed-payload-semantics'
import { ScoringCriterionDto } from '../dto/scoring-criterion.dto'
import { ScoringRoleDto } from '../dto/scoring-model.dto'
import {
  ScoringModelStatusEnum,
  ScoringModelValidationDto,
  ScoringValidationReasonDto,
  ScoringValidationScopeEnum,
} from '../dto/scoring-validation.dto'
import { expandToParsedPayload } from './expand-to-parsed-payload'

/** Guard against a pathological model producing an unbounded response. */
const MAX_REASONS = 200

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
  private truncated = false

  add(scope: ScoringValidationScopeEnum, message: string): void {
    if (this.reasons.length >= MAX_REASONS) {
      this.truncated = true
      return
    }
    this.reasons.push({ scope, message })
  }

  /**
   * Record that reasons were lost upstream rather than here. The filing gate
   * caps its own list before this bag ever fills, so without this the notice
   * below would only ever fire for faults the hand-written rules produced.
   */
  markTruncated(): void {
    this.truncated = true
  }

  /**
   * The cap used to be silent: a badly broken model returned exactly
   * `MAX_REASONS` reasons and nothing said more existed, so a caller working
   * through the list would fix every one and still be refused. The notice costs
   * one slot and is the difference between a long list and a wrong one.
   */
  all(): ScoringValidationReasonDto[] {
    if (!this.truncated) return this.reasons

    return [
      // Trim only if the notice would push the list past the cap. When
      // truncation was reported from upstream the bag is typically short of
      // `MAX_REASONS`, and slicing unconditionally would discard a real reason
      // to make room for the notice saying reasons were discarded.
      ...(this.reasons.length >= MAX_REASONS
        ? this.reasons.slice(0, MAX_REASONS - 1)
        : this.reasons),
      {
        // `MODEL`, not `CRITERIA`: this reason is about the list, not about any
        // region of the model, and the scope enum documents CRITERIA's meanings
        // exhaustively — a caller filing reasons by scope would have shown this
        // one against the criteria section, where it is false.
        scope: ScoringValidationScopeEnum.MODEL,
        // No count in the wording: truncation can now be reported from the
        // filing gate, which fills before this bag does, so any figure stated
        // here would be the wrong one in that case.
        message:
          'Listinn er styttur — fleiri atriði eru óuppfyllt en hér eru talin. Lagfærðu ofangreint og sæktu starfsmatið aftur til að sjá afganginn.',
      },
    ]
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

/** Scopes the filing gate reports that a model, with no employees, can own. */
const MODEL_LEVEL_SCOPES: ReadonlySet<PayloadIssueScope> = new Set([
  PayloadIssueScope.CRITERIA,
  PayloadIssueScope.SUB_CRITERIA,
  PayloadIssueScope.ROLES,
  PayloadIssueScope.ROLE_CLASSIFICATION,
])

/**
 * Which part of the model a gate message is about.
 *
 * `assertWithinCapacity` throws plain strings with no scope of their own, and
 * the expansion's refusals likewise — so both are classified by what they name.
 * `scope` is documented as the field a caller routes its UI on, so filing a
 * jobs overflow under `CRITERIA` puts it in the wrong panel, which is the only
 * thing that field exists to prevent.
 */
const scopeForMessage = (
  message: string,
): ScoringValidationScopeEnum => {
  if (/\bstörf\b|\bStarfið\b/.test(message)) {
    return /vísar í úthlutun/.test(message)
      ? ScoringValidationScopeEnum.ROLE_ASSIGNMENTS
      : ScoringValidationScopeEnum.ROLES
  }
  if (/undirviðmið/i.test(message)) {
    return ScoringValidationScopeEnum.SUB_CRITERIA
  }
  if (/þrep/i.test(message)) {
    return ScoringValidationScopeEnum.STEPS
  }
  return ScoringValidationScopeEnum.CRITERIA
}

const toValidationScope = (
  scope: PayloadIssueScope,
): ScoringValidationScopeEnum => {
  switch (scope) {
    case PayloadIssueScope.SUB_CRITERIA:
      return ScoringValidationScopeEnum.SUB_CRITERIA
    case PayloadIssueScope.ROLES:
      return ScoringValidationScopeEnum.ROLES
    case PayloadIssueScope.ROLE_CLASSIFICATION:
      return ScoringValidationScopeEnum.ROLE_ASSIGNMENTS
    default:
      return ScoringValidationScopeEnum.CRITERIA
  }
}

/** `BadRequestException` carries either one message or an array of them. */
const messagesOf = (error: BadRequestException): string[] => {
  const response = error.getResponse() as { message?: string | string[] }
  const message = response?.message ?? error.message
  return Array.isArray(message) ? message : [message]
}

/**
 * Makes a model expandable without changing what it says.
 *
 * The expander is strict on purpose — at filing, an assignment that does not
 * resolve must refuse rather than score something approximate. But a validator
 * that cannot expand cannot run the gate at all, and the first version of this
 * reported the expansion failure and returned: one dangling assignment then hid
 * every other reason, against a contract promising "every reason at once". The
 * case is not hypothetical — deleting a criterion leaves the jobs assigned on
 * its sub-criteria dangling, so the most ordinary edit there is silenced the
 * missing-mandatory-type reason it should have produced.
 *
 * So unresolvable assignments are reported and then dropped, and the gate runs
 * over what is left. Dropping only ever removes reasons the gate would give, and
 * each dropped one is stated here first.
 */
const sanitiseForGate = (
  criteria: ScoringCriterionDto[],
  roles: ScoringRoleDto[],
  reasons: ReasonBag,
): { criteria: ScoringCriterionDto[]; roles: ScoringRoleDto[] } => {
  const subIds = new Set<string>()
  const stepIds = new Set<string>()
  const seenPairs = new Set<string>()
  const keptCriteria: ScoringCriterionDto[] = []

  for (const criterion of criteria) {
    const subCriteria = []
    for (const sub of criterion.subCriteria) {
      const pair = `${criterion.title}\0${sub.title}`
      if (seenPairs.has(pair)) {
        // The pipeline keys on this pair and would collapse the two rows, so
        // the expander refuses it. Reported, then held back so everything else
        // about the model can still be judged.
        reasons.add(
          ScoringValidationScopeEnum.SUB_CRITERIA,
          `Tvö undirviðmið heita „${criterion.title} / ${sub.title}“; heitin verða að vera einkvæm`,
        )
        continue
      }
      seenPairs.add(pair)
      subCriteria.push(sub)
      subIds.add(sub.id)
      for (const step of sub.steps) stepIds.add(step.id)
    }
    keptCriteria.push({ ...criterion, subCriteria })
  }

  const keptRoles = roles.map((role) => {
    const stepAssignments = role.stepAssignments.filter((assignment) => {
      const resolves =
        subIds.has(assignment.subCriterionId) && stepIds.has(assignment.stepId)
      if (!resolves) {
        reasons.add(
          ScoringValidationScopeEnum.ROLE_ASSIGNMENTS,
          `Starfið „${role.title}“ vísar í úthlutun sem er ekki lengur til í starfsmatinu`,
        )
      }
      return resolves
    })

    return { ...role, stepAssignments }
  })

  return { criteria: keptCriteria, roles: keptRoles }
}

/**
 * Runs the submission's own gate over the model, expanded with no employees,
 * and folds everything it finds into the reason list.
 *
 * Nothing is deduped against the hand-written rules above, and nothing needs to
 * be: every rule this gate covers was deleted from that set rather than stated
 * twice. A dedupe on message text could not have worked anyway — the two were
 * worded differently on purpose, so the comparison never matched and each
 * double-covered fault was reported twice under two scopes.
 */
const runFilingGate = (
  criteria: ScoringCriterionDto[],
  roles: ScoringRoleDto[],
  reasons: ReasonBag,
): void => {
  const clean = sanitiseForGate(criteria, roles, reasons)

  let parsed
  try {
    parsed = expandToParsedPayload(clean, [])
  } catch (error) {
    if (!(error instanceof BadRequestException)) throw error
    for (const message of messagesOf(error)) {
      reasons.add(scopeForMessage(message), message)
    }
    return
  }

  // Capacity first, then the two halves of the gate — and all three run, since
  // a ceiling breach says nothing about whether the tree is also malformed.
  try {
    assertWithinCapacity(parsed)
  } catch (error) {
    if (!(error instanceof BadRequestException)) throw error
    for (const message of messagesOf(error)) {
      reasons.add(scopeForMessage(message), message)
    }
  }

  const issues = new PayloadIssueBag()
  collectParsedPayloadIntegrity(parsed, issues)
  collectParsedPayloadSemantics(parsed, issues)

  for (const issue of issues.list) {
    if (!MODEL_LEVEL_SCOPES.has(issue.scope)) continue
    reasons.add(toValidationScope(issue.scope), issue.message)
  }

  // The gate has a cap of its own, and when it fills it says so in an issue
  // scoped `REPORT` — which the filter above drops, because `REPORT` is not a
  // scope a model with no employees can own. So a model broken enough to
  // saturate the gate came back with a full list and nothing anywhere saying it
  // had been cut short: the exact failure `ReasonBag`'s notice exists to
  // prevent, reintroduced one layer up. Carry the fact across instead of the
  // sentence, and let `ReasonBag` word it in the model's own vocabulary.
  if (issues.isFull) reasons.markTruncated()
}

export const validateScoringModel = (
  model: ScoringModelShape,
): ScoringModelValidationDto => {
  const reasons = new ReasonBag()
  const { criteria, roles } = model

  const allSubs = criteria.flatMap((c) => c.subCriteria)
  const labels = labelFor(criteria)
  const label = (id: string): string => labels.get(id) ?? id

  // What remains hand-written is only what the filing gate does NOT check.
  //
  // The mandatory criterion types, the personal-criterion cap, the weight
  // total and the role-assignment completeness rules all used to be restated
  // here. They are `collectParsedPayloadSemantics`' rules, `runFilingGate` now
  // runs that too, and its `subCriterionLabel` renders the same
  // `Ábyrgð / Mannaforráð` form these did — so restating them bought nothing
  // and cost a second copy to drift.
  if (allSubs.length === 0) {
    reasons.add(
      ScoringValidationScopeEnum.SUB_CRITERIA,
      'Starfsmatið hefur engin undirviðmið — ekkert er hægt að meta',
    )
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

    // The scale-length bound is NOT restated here: `runFilingGate` reports it
    // from `collectParsedPayloadIntegrity`, which is the rule the filing
    // actually applies. Stating it in both places produced the same fault twice
    // under two scopes, because the two are deliberately worded differently and
    // a dedupe on message text could never match them.

    const orders = sub.steps.map((s) => s.stepOrder).sort((a, b) => a - b)
    const contiguous = orders.every((order, i) => order === i + 1)
    if (!contiguous) {
      reasons.add(
        ScoringValidationScopeEnum.STEPS,
        `Þrep undirviðmiðsins „${label(sub.id)}“ verða að vera samfelld frá 1; fundust ${orders.join(', ')}`,
      )
    }
  }

  // **The backstop, and the reason this validator can no longer be weaker than
  // the filing gate it claims parity with.**
  //
  // The rules above are hand-written because they carry better labels — they
  // name the parent criterion, and they speak about a model rather than a
  // payload. That is worth having, but restating a rule is how the two drifted:
  // the capacity ceilings, duplicate role titles and duplicate criterion titles
  // were all enforced at filing and silent here, so a model could report VALID
  // and then be refused. Running the real gate over the expanded model closes
  // that structurally rather than one rule at a time.
  //
  // Employees are deliberately absent, so the two employee-dependent rules do
  // not fire; anything scoped to them is dropped below.
  runFilingGate(criteria, roles, reasons)

  const all = reasons.all()
  return {
    status: all.length === 0
      ? ScoringModelStatusEnum.VALID
      : ScoringModelStatusEnum.INVALID,
    reasons: all,
  }
}
