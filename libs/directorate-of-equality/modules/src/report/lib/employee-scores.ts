import { BadRequestException } from '@nestjs/common'

import {
  MAX_PAID_HOURS_PER_MONTH,
  MIN_PAID_HOURS_PER_MONTH,
} from '../../constants'
import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import { computeRegularWages } from '../../report-employee/models/report-employee.model'
import {
  ParsedReportDto,
  ParsedRoleDto,
} from '../../report-excel/dto/parsed-report.dto'
import {
  MAX_CRITERIA,
  MAX_EMPLOYEES,
  MAX_PERSONAL_SUB_CRITERIA,
  MAX_ROLES,
  MAX_STEPS,
  MAX_SUB_CRITERIA_PER_CRITERION,
  MAX_TOTAL_SUB_CRITERIA,
  MIN_STEPS,
} from '../../report-excel/workbook.schema'
import {
  employeeLabel,
  PayloadIssueBag,
  PayloadIssueScope,
  roleLabel,
  subCriterionLabel,
} from './parsed-payload-issues'
import { collectParsedPayloadSemantics } from './parsed-payload-semantics'

export const stepKey = (
  criterionTitle: string,
  subTitle: string,
  stepOrder: number,
) => `${criterionTitle}|${subTitle}|${stepOrder}`

/** The same pair without a step — see `knownSubKeys`. */
const subPairKey = (criterionTitle: string, subTitle: string) =>
  `${criterionTitle}|${subTitle}`

/**
 * The single gate every scoring payload passes, whichever channel it arrived
 * on: the island.is portal, an imported workbook, or a partner API submission.
 * Both the analysis preview and the submission call it, so a payload that
 * previews clean cannot be refused at submit for a reason the preview knew.
 *
 * **Every fault is reported at once.** The checks used to throw on the first
 * one, which turned a first-time field mapping into one round trip per
 * mistake; they now accumulate and the whole list comes back as
 * `ApiErrorDto.details`. Continuing past a fault is safe because each check is
 * local — none of them establishes an invariant a later one relies on.
 *
 * Two bounds keep that from becoming an attack surface, and both are load
 * bearing: the capacity ceilings still fail on the first breach
 * (`assertWithinCapacity`), and the list itself is capped (`MAX_ISSUES`). The
 * second is what covers a payload that breaches nothing — 10 000 employees and
 * 100 personal sub-criteria are both legal, and one missing assignment per pair
 * is a million messages.
 *
 * Cross-field semantics — the four mandatory criterion types, weights summing
 * to 100%, complete classifications — come from
 * `collectParsedPayloadSemantics`, which used to run inside the workbook
 * parser and so could not see a hand-built payload at all. See that file for
 * why an incomplete classification is the dangerous one.
 *
 * Pre-flight integrity checks on the parsed payload — surfaces malformed
 * input as a 400 before any DB writes. Catches duplicate titles/employee
 * ordinals, unusable paid hours or regluleg laun (either would make reglulegt
 * tímakaup undefined), sub-criteria whose step count falls outside
 * the allowed MIN_STEPS–MAX_STEPS range, unknown role references in
 * employees, and step assignments that don't resolve to a node in the parsed
 * criteria tree. Also enforces the report capacity ceilings (criteria, roles,
 * employees, per-criterion / total / personal sub-criteria) — see the MAX_*
 * constants in workbook.schema — so oversized payloads are rejected with a
 * clear message on both the import and application submit paths.
 *
 * Returns a `(criterionTitle|subTitle|stepOrder) → step score` map so the
 * caller can compute employee total scores in memory without re-walking
 * the criteria tree.
 */
/**
 * Report-level capacity ceilings, and the one part of payload validation that
 * still **fails on the first fault**.
 *
 * Deliberately not accumulated with everything else. These are generous sanity
 * limits rather than domain rules, so a payload that breaches one will never be
 * accepted whatever else is true of it — and walking it anyway is the whole
 * exposure. The completeness rules are O(employees × sub-criteria), so
 * enumerating the faults of an oversized payload is unbounded work on
 * unbounded input: nothing upstream caps array length (`ApiDtoArray` applies
 * no `ArrayMaxSize`) and the body limit is 8 MB.
 *
 * Runs before anything is walked, so an over-large payload costs three length
 * comparisons.
 */
function assertWithinCapacity(parsed: ParsedReportDto): void {
  if (parsed.criteria.length > MAX_CRITERIA) {
    throw new BadRequestException([
      `Að hámarki ${MAX_CRITERIA} viðmið eru leyfð; fjöldi var ${parsed.criteria.length}`,
    ])
  }
  if (parsed.roles.length > MAX_ROLES) {
    throw new BadRequestException([
      `Að hámarki ${MAX_ROLES} störf eru leyfð; fjöldi var ${parsed.roles.length}`,
    ])
  }
  if (parsed.employees.length > MAX_EMPLOYEES) {
    throw new BadRequestException([
      `Að hámarki ${MAX_EMPLOYEES} starfsmenn eru leyfðir; fjöldi var ${parsed.employees.length}`,
    ])
  }
}

function collectParsedPayloadIntegrity(
  parsed: ParsedReportDto,
  issues: PayloadIssueBag,
): Map<string, number> {
  const roleTitles = new Set<string>()
  for (const role of parsed.roles) {
    if (roleTitles.has(role.title)) {
      issues.add(
        PayloadIssueScope.ROLES,
        `Tvítekið heiti starfs í innsendum gögnum: „${role.title}“`,
      )
    }
    roleTitles.add(role.title)
  }

  const stepScoreByKey = new Map<string, number>()
  // Which (criterion, sub-criterion) pairs exist at all, as opposed to which
  // (criterion, sub, step) triples do. The distinction is what keeps one
  // mistake to one message: a pair that does not exist is reported by
  // `collectParsedPayloadSemantics` as an unknown sub-criterion, so the step
  // checks below stay quiet about it and speak only for a bad step ORDER on a
  // pair that is real.
  const knownSubKeys = new Set<string>()
  const criterionTitles = new Set<string>()
  let totalSubCriteria = 0
  let personalSubCriteria = 0
  for (const criterion of parsed.criteria) {
    if (criterionTitles.has(criterion.title)) {
      issues.add(
        PayloadIssueScope.CRITERIA,
        `Tvítekið heiti viðmiðs í innsendum gögnum: „${criterion.title}“`,
      )
    }
    criterionTitles.add(criterion.title)

    if (criterion.subCriteria.length > MAX_SUB_CRITERIA_PER_CRITERION) {
      issues.add(
        PayloadIssueScope.SUB_CRITERIA,
        `Viðmið „${criterion.title}“ er með ${criterion.subCriteria.length} undirviðmið; að hámarki ${MAX_SUB_CRITERIA_PER_CRITERION} eru leyfð á hvert viðmið`,
      )
    }
    totalSubCriteria += criterion.subCriteria.length
    if (criterion.type === ReportCriterionTypeEnum.PERSONAL) {
      personalSubCriteria += criterion.subCriteria.length
    }

    const subTitlesInCriterion = new Set<string>()
    for (const sub of criterion.subCriteria) {
      if (subTitlesInCriterion.has(sub.title)) {
        issues.add(
          PayloadIssueScope.SUB_CRITERIA,
          `Tvítekið heiti undirviðmiðs undir „${criterion.title}“: „${sub.title}“`,
        )
      }
      subTitlesInCriterion.add(sub.title)

      if (sub.steps.length < MIN_STEPS || sub.steps.length > MAX_STEPS) {
        issues.add(
          PayloadIssueScope.SUB_CRITERIA,
          `Undirviðmið „${subCriterionLabel(
            criterion.title,
            sub.title,
          )}“ er með ${
            sub.steps.length
          } þrep; leyfilegt bil er ${MIN_STEPS}–${MAX_STEPS}`,
        )
      }

      knownSubKeys.add(subPairKey(criterion.title, sub.title))

      const stepOrders = new Set<number>()
      for (const step of sub.steps) {
        if (stepOrders.has(step.order)) {
          issues.add(
            PayloadIssueScope.SUB_CRITERIA,
            `Tvítekið þrepanúmer undir „${subCriterionLabel(
              criterion.title,
              sub.title,
            )}“: ${step.order}`,
          )
        }
        stepOrders.add(step.order)
        stepScoreByKey.set(
          stepKey(criterion.title, sub.title, step.order),
          step.score,
        )
      }
    }
  }

  if (totalSubCriteria > MAX_TOTAL_SUB_CRITERIA) {
    issues.add(
      PayloadIssueScope.SUB_CRITERIA,
      `Að hámarki ${MAX_TOTAL_SUB_CRITERIA} undirviðmið eru leyfð samtals; fjöldi var ${totalSubCriteria}`,
    )
  }
  if (personalSubCriteria > MAX_PERSONAL_SUB_CRITERIA) {
    issues.add(
      PayloadIssueScope.SUB_CRITERIA,
      `Að hámarki ${MAX_PERSONAL_SUB_CRITERIA} persónubundin undirviðmið eru leyfð; fjöldi var ${personalSubCriteria}`,
    )
  }

  // Assignments that name a step the criteria tree does not contain. The
  // completeness question — every required assignment PRESENT — is the
  // semantic collection below; this is the other direction.
  for (const role of parsed.roles) {
    for (const assignment of role.stepAssignments) {
      if (
        !knownSubKeys.has(
          subPairKey(assignment.criterionTitle, assignment.subTitle),
        )
      ) {
        continue
      }

      const key = stepKey(
        assignment.criterionTitle,
        assignment.subTitle,
        assignment.stepOrder,
      )
      if (!stepScoreByKey.has(key)) {
        issues.add(
          PayloadIssueScope.ROLE_CLASSIFICATION,
          `${roleLabel(role.title)}: vísar í óþekkt þrep ${
            assignment.stepOrder
          } undir „${subCriterionLabel(
            assignment.criterionTitle,
            assignment.subTitle,
          )}“`,
        )
      }
    }
  }

  const employeeOrdinals = new Set<number>()
  for (const employee of parsed.employees) {
    if (employeeOrdinals.has(employee.ordinal)) {
      issues.add(
        PayloadIssueScope.EMPLOYEES,
        `Tvítekið raðnúmer starfsmanns í innsendum gögnum: ${employee.ordinal}`,
        { ordinal: employee.ordinal },
      )
    }
    employeeOrdinals.add(employee.ordinal)

    // Two guards where there was one, because reglulegt tímakaup has two ways
    // to be undefined: no denominator, or nothing in the numerator. Both would
    // otherwise reach the regression as NaN / Infinity and silently poison every
    // downstream statistic rather than failing here.
    if (
      !Number.isFinite(employee.paidHours) ||
      employee.paidHours < MIN_PAID_HOURS_PER_MONTH ||
      employee.paidHours > MAX_PAID_HOURS_PER_MONTH
    ) {
      issues.add(
        PayloadIssueScope.EMPLOYEES,
        `${employeeLabel(employee.ordinal)}: ógildar greiddar stundir ${
          employee.paidHours
        }; gildið verður að vera á bilinu ${MIN_PAID_HOURS_PER_MONTH}–${MAX_PAID_HOURS_PER_MONTH}`,
        { ordinal: employee.ordinal },
      )
    }

    if (computeRegularWages(employee) <= 0) {
      issues.add(
        PayloadIssueScope.EMPLOYEES,
        `${employeeLabel(
          employee.ordinal,
        )}: engin regluleg laun; grunnlaun, viðbótarlaun og aukagreiðslur mega ekki vera 0 samanlagt`,
        { ordinal: employee.ordinal },
      )
    }

    if (!roleTitles.has(employee.roleTitle)) {
      issues.add(
        PayloadIssueScope.EMPLOYEES,
        `${employeeLabel(employee.ordinal)}: vísar í óþekkt starf „${
          employee.roleTitle
        }“`,
        { ordinal: employee.ordinal },
      )
    }

    for (const assignment of employee.personalStepAssignments) {
      if (
        !knownSubKeys.has(
          subPairKey(assignment.criterionTitle, assignment.subTitle),
        )
      ) {
        continue
      }

      const key = stepKey(
        assignment.criterionTitle,
        assignment.subTitle,
        assignment.stepOrder,
      )
      if (!stepScoreByKey.has(key)) {
        issues.add(
          PayloadIssueScope.EMPLOYEE_CLASSIFICATION,
          `${employeeLabel(employee.ordinal)}: vísar í óþekkt þrep ${
            assignment.stepOrder
          } undir „${subCriterionLabel(
            assignment.criterionTitle,
            assignment.subTitle,
          )}“`,
          { ordinal: employee.ordinal },
        )
      }
    }
  }

  return stepScoreByKey
}

/**
 * Structural integrity only, as its own answer — the shape report creation
 * needs once a boundary has already accepted the payload.
 *
 * Prefer `assertParsedPayloadValid` at any point where a payload ENTERS the
 * system: this one cannot tell a complete report from an unscoreable fragment.
 */
export function assertParsedPayloadIntegrity(
  parsed: ParsedReportDto,
): Map<string, number> {
  assertWithinCapacity(parsed)

  const issues = new PayloadIssueBag()
  const stepScoreByKey = collectParsedPayloadIntegrity(parsed, issues)

  if (issues.hasIssues) {
    throw new BadRequestException(issues.messages)
  }

  return stepScoreByKey
}

/**
 * Total score per employee = sum of step scores assigned to them, dedup'd
 * across role and personal assignments (one stepKey contributes once even
 * if both the role and the employee personally reference it). Mirrors the
 * Set-based dedup used by `report-statistics.computeEmployeeWorkScore`.
 */
export function computeEmployeeScores(
  parsed: ParsedReportDto,
  stepScoreByKey: Map<string, number>,
): number[] {
  const rolesByTitle = new Map<string, ParsedRoleDto>()
  for (const role of parsed.roles) {
    rolesByTitle.set(role.title, role)
  }

  return parsed.employees.map((employee) => {
    const role = rolesByTitle.get(employee.roleTitle)
    const stepKeys = new Set<string>()
    if (role) {
      for (const a of role.stepAssignments) {
        stepKeys.add(stepKey(a.criterionTitle, a.subTitle, a.stepOrder))
      }
    }
    for (const a of employee.personalStepAssignments) {
      stepKeys.add(stepKey(a.criterionTitle, a.subTitle, a.stepOrder))
    }
    let total = 0
    for (const key of stepKeys) {
      total += stepScoreByKey.get(key) ?? 0
    }
    return total
  })
}

/**
 * The whole of payload validation: structure **and** cross-field semantics, in
 * one bag, answered as one 400.
 *
 * This is what a channel boundary should call. `assertParsedPayloadIntegrity`
 * alone accepts a payload that is structurally sound and still not a salary
 * report — three of the four mandatory criterion types missing, weights summing
 * to 40%, half the roles unclassified — because those are the rules that used
 * to live inside the workbook parser and so only ever ran on a spreadsheet.
 *
 * Note what the unknown-role and unknown-step checks do NOT cover: they ask
 * whether an assignment points at something real, never whether the required
 * ones are all present. The missing half is the dangerous half — see
 * `parsed-payload-semantics.ts`.
 */
export function assertParsedPayloadValid(
  parsed: ParsedReportDto,
): Map<string, number> {
  assertWithinCapacity(parsed)

  const issues = new PayloadIssueBag()
  const stepScoreByKey = collectParsedPayloadIntegrity(parsed, issues)
  collectParsedPayloadSemantics(parsed, issues)

  if (issues.hasIssues) {
    throw new BadRequestException(issues.messages)
  }

  return stepScoreByKey
}
