import { BadRequestException } from '@nestjs/common'

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
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

export const stepKey = (
  criterionTitle: string,
  subTitle: string,
  stepOrder: number,
) => `${criterionTitle}|${subTitle}|${stepOrder}`

/**
 * Pre-flight integrity checks on the parsed payload — surfaces malformed
 * input as a 400 before any DB writes. Catches duplicate titles/employee
 * ordinals, invalid work ratios, sub-criteria whose step count falls outside
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
export function assertParsedPayloadIntegrity(
  parsed: ParsedReportDto,
): Map<string, number> {
  // Report-level capacity ceilings. Generous sanity limits, not domain rules —
  // they reject nonsensical / adversarial payloads with a clear error rather
  // than letting them through (or silently truncating during parse).
  if (parsed.criteria.length > MAX_CRITERIA) {
    throw new BadRequestException(
      `Að hámarki ${MAX_CRITERIA} viðmið eru leyfð; fjöldi var ${parsed.criteria.length}`,
    )
  }
  if (parsed.roles.length > MAX_ROLES) {
    throw new BadRequestException(
      `Að hámarki ${MAX_ROLES} störf eru leyfð; fjöldi var ${parsed.roles.length}`,
    )
  }
  if (parsed.employees.length > MAX_EMPLOYEES) {
    throw new BadRequestException(
      `Að hámarki ${MAX_EMPLOYEES} starfsmenn eru leyfðir; fjöldi var ${parsed.employees.length}`,
    )
  }

  const roleTitles = new Set<string>()
  for (const role of parsed.roles) {
    if (roleTitles.has(role.title)) {
      throw new BadRequestException(
        `Tvítekið heiti starfs í innsendum gögnum: „${role.title}“`,
      )
    }
    roleTitles.add(role.title)
  }

  const stepScoreByKey = new Map<string, number>()
  const criterionTitles = new Set<string>()
  let totalSubCriteria = 0
  let personalSubCriteria = 0
  for (const criterion of parsed.criteria) {
    if (criterionTitles.has(criterion.title)) {
      throw new BadRequestException(
        `Tvítekið heiti viðmiðs í innsendum gögnum: „${criterion.title}“`,
      )
    }
    criterionTitles.add(criterion.title)

    if (criterion.subCriteria.length > MAX_SUB_CRITERIA_PER_CRITERION) {
      throw new BadRequestException(
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
        throw new BadRequestException(
          `Tvítekið heiti undirviðmiðs undir „${criterion.title}“: „${sub.title}“`,
        )
      }
      subTitlesInCriterion.add(sub.title)

      if (sub.steps.length < MIN_STEPS || sub.steps.length > MAX_STEPS) {
        throw new BadRequestException(
          `Undirviðmið „${criterion.title} / ${sub.title}“ er með ${sub.steps.length} þrep; leyfilegt bil er ${MIN_STEPS}–${MAX_STEPS}`,
        )
      }

      const stepOrders = new Set<number>()
      for (const step of sub.steps) {
        if (stepOrders.has(step.order)) {
          throw new BadRequestException(
            `Tvítekið þrepanúmer undir „${criterion.title} / ${sub.title}“: ${step.order}`,
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
    throw new BadRequestException(
      `Að hámarki ${MAX_TOTAL_SUB_CRITERIA} undirviðmið eru leyfð samtals; fjöldi var ${totalSubCriteria}`,
    )
  }
  if (personalSubCriteria > MAX_PERSONAL_SUB_CRITERIA) {
    throw new BadRequestException(
      `Að hámarki ${MAX_PERSONAL_SUB_CRITERIA} persónubundin undirviðmið eru leyfð; fjöldi var ${personalSubCriteria}`,
    )
  }

  for (const role of parsed.roles) {
    for (const assignment of role.stepAssignments) {
      const key = stepKey(
        assignment.criterionTitle,
        assignment.subTitle,
        assignment.stepOrder,
      )
      if (!stepScoreByKey.has(key)) {
        throw new BadRequestException(
          `Starf „${role.title}“ vísar í óþekkt þrep ${key}`,
        )
      }
    }
  }

  const employeeOrdinals = new Set<number>()
  for (const employee of parsed.employees) {
    if (employeeOrdinals.has(employee.ordinal)) {
      throw new BadRequestException(
        `Tvítekið raðnúmer starfsmanns í innsendum gögnum: ${employee.ordinal}`,
      )
    }
    employeeOrdinals.add(employee.ordinal)

    if (!Number.isFinite(employee.workRatio) || employee.workRatio <= 0) {
      throw new BadRequestException(
        `Starfsmaður með raðnúmer ${employee.ordinal} er með ógilt starfshlutfall ${employee.workRatio}; gildið verður að vera stærra en 0`,
      )
    }

    if (!roleTitles.has(employee.roleTitle)) {
      throw new BadRequestException(
        `Starfsmaður með raðnúmer ${employee.ordinal} vísar í óþekkt starf „${employee.roleTitle}“`,
      )
    }
    for (const assignment of employee.personalStepAssignments) {
      const key = stepKey(
        assignment.criterionTitle,
        assignment.subTitle,
        assignment.stepOrder,
      )
      if (!stepScoreByKey.has(key)) {
        throw new BadRequestException(
          `Starfsmaður með raðnúmer ${employee.ordinal} vísar í óþekkt þrep ${key}`,
        )
      }
    }
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
