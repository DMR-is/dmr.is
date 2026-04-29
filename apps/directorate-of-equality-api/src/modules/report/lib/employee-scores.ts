import { BadRequestException } from '@nestjs/common'

import {
  ParsedReportDto,
  ParsedRoleDto,
} from '../../report-excel/dto/parsed-report.dto'

export const stepKey = (
  criterionTitle: string,
  subTitle: string,
  stepOrder: number,
) => `${criterionTitle}|${subTitle}|${stepOrder}`

/**
 * Pre-flight integrity checks on the parsed payload — surfaces malformed
 * input as a 400 before any DB writes. Catches duplicate titles, unknown
 * role references in employees, and step assignments that don't resolve to
 * a node in the parsed criteria tree.
 *
 * Returns a `(criterionTitle|subTitle|stepOrder) → step score` map so the
 * caller can compute employee total scores in memory without re-walking
 * the criteria tree.
 */
export function assertParsedPayloadIntegrity(
  parsed: ParsedReportDto,
): Map<string, number> {
  const roleTitles = new Set<string>()
  for (const role of parsed.roles) {
    if (roleTitles.has(role.title)) {
      throw new BadRequestException(
        `Duplicate role title in parsed payload: "${role.title}"`,
      )
    }
    roleTitles.add(role.title)
  }

  const stepScoreByKey = new Map<string, number>()
  const criterionTitles = new Set<string>()
  for (const criterion of parsed.criteria) {
    if (criterionTitles.has(criterion.title)) {
      throw new BadRequestException(
        `Duplicate criterion title in parsed payload: "${criterion.title}"`,
      )
    }
    criterionTitles.add(criterion.title)

    const subTitlesInCriterion = new Set<string>()
    for (const sub of criterion.subCriteria) {
      if (subTitlesInCriterion.has(sub.title)) {
        throw new BadRequestException(
          `Duplicate sub-criterion title under "${criterion.title}": "${sub.title}"`,
        )
      }
      subTitlesInCriterion.add(sub.title)

      const stepOrders = new Set<number>()
      for (const step of sub.steps) {
        if (stepOrders.has(step.order)) {
          throw new BadRequestException(
            `Duplicate step order under "${criterion.title} / ${sub.title}": ${step.order}`,
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

  for (const role of parsed.roles) {
    for (const assignment of role.stepAssignments) {
      const key = stepKey(
        assignment.criterionTitle,
        assignment.subTitle,
        assignment.stepOrder,
      )
      if (!stepScoreByKey.has(key)) {
        throw new BadRequestException(
          `Role "${role.title}" references unknown step ${key}`,
        )
      }
    }
  }

  for (const employee of parsed.employees) {
    if (!roleTitles.has(employee.roleTitle)) {
      throw new BadRequestException(
        `Employee ordinal ${employee.ordinal} references unknown role "${employee.roleTitle}"`,
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
          `Employee ordinal ${employee.ordinal} references unknown step ${key}`,
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
