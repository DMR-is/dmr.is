import { BadRequestException } from '@nestjs/common'

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'
import { computeStepScore } from '../../report-excel/workbook.schema'
import { PartnerEmployeeDto } from '../dto/partner-salary-payload.dto'
import { ScoringCriterionDto } from '../dto/scoring-criterion.dto'
import { ScoringRoleDto } from '../dto/scoring-model.dto'

type ScoringModelShape = {
  criteria: ScoringCriterionDto[]
  roles: ScoringRoleDto[]
}

/**
 * Turns a stored scoring model plus a payroll extract into the
 * `ParsedReportDto` the submission pipeline already takes.
 *
 * This is the seam, and the reason nothing downstream changes: validation,
 * scoring, outlier detection, storage, the per-report snapshot and every admin
 * read keep receiving exactly what they receive today. What the partner surface
 * stops doing is asking a vendor to transmit the criteria tree and the role
 * matrix — which are the company's, unchanged since last year, and which the
 * vendor does not hold.
 *
 * Two translations happen here, and both exist because the pipeline addresses
 * by **title** while a stored model addresses by **id**:
 *
 * - Step scores are derived, never carried. `computeStepScore` is the same
 *   function the workbook parser uses, so a report filed through this channel
 *   sits on the same stig scale as one filed through any other. A vendor
 *   sending its own scores could not be validated against anything.
 * - Ids become titles. A model with two sub-criteria of the same title under
 *   different criteria is legal — titles are unconstrained — and the pipeline
 *   keys on `(criterionTitle, subTitle)`, so the expansion refuses a model that
 *   would collapse two distinct rows onto one key rather than emitting a
 *   payload that scores wrong.
 */
export const expandToParsedPayload = (
  model: ScoringModelShape,
  employees: PartnerEmployeeDto[],
): ParsedReportDto => {
  const subById = new Map<
    string,
    { criterionTitle: string; subTitle: string; personal: boolean }
  >()
  const stepById = new Map<string, { subCriterionId: string; order: number }>()
  const seenPairs = new Set<string>()

  for (const criterion of model.criteria) {
    for (const sub of criterion.subCriteria) {
      const pair = `${criterion.title}\0${sub.title}`
      if (seenPairs.has(pair)) {
        throw new BadRequestException(
          `Starfsmatið hefur tvö undirviðmið sem heita „${criterion.title} / ${sub.title}“; heitin verða að vera einkvæm til að hægt sé að skila skýrslunni`,
        )
      }
      seenPairs.add(pair)

      subById.set(sub.id, {
        criterionTitle: criterion.title,
        subTitle: sub.title,
        personal: criterion.type === ReportCriterionTypeEnum.PERSONAL,
      })

      for (const step of sub.steps) {
        stepById.set(step.id, {
          subCriterionId: sub.id,
          order: step.stepOrder,
        })
      }
    }
  }

  const rolesById = new Map(model.roles.map((role) => [role.id, role]))

  const criteria = model.criteria.map((criterion) => ({
    type: criterion.type,
    title: criterion.title,
    description: criterion.description,
    weight: criterion.weight,
    subCriteria: criterion.subCriteria.map((sub) => ({
      title: sub.title,
      description: sub.description,
      weight: sub.weight,
      steps: sub.steps.map((step) => ({
        order: step.stepOrder,
        description: step.description,
        // Derived from the scale's own length, so the top step is worth the
        // sub-criterion's full weight whether the scale has two steps or eight.
        score: computeStepScore(step.stepOrder, sub.steps.length, sub.weight),
      })),
    })),
  }))

  const roles = model.roles.map((role) => ({
    title: role.title,
    stepAssignments: role.stepAssignments.map((assignment) => {
      const sub = subById.get(assignment.subCriterionId)
      const step = stepById.get(assignment.stepId)

      if (!sub || !step) {
        throw new BadRequestException(
          `Starfið „${role.title}“ vísar í úthlutun sem er ekki lengur til í starfsmatinu`,
        )
      }

      return {
        criterionTitle: sub.criterionTitle,
        subTitle: sub.subTitle,
        stepOrder: step.order,
      }
    }),
  }))

  const expandedEmployees = employees.map((employee) => {
    const role = rolesById.get(employee.roleId)

    if (!role) {
      throw new BadRequestException(
        `Starfsmaður #${employee.ordinal} vísar í starf sem er ekki í þessu starfsmati`,
      )
    }

    const personalStepAssignments = employee.personalSteps.map((assignment) => {
      const sub = subById.get(assignment.subCriterionId)
      const step = stepById.get(assignment.stepId)

      if (!sub) {
        throw new BadRequestException(
          `Starfsmaður #${employee.ordinal} vísar í undirviðmið sem er ekki í þessu starfsmati`,
        )
      }

      if (!sub.personal) {
        throw new BadRequestException(
          `Starfsmaður #${employee.ordinal}: „${sub.criterionTitle} / ${sub.subTitle}“ er starfsbundið viðmið og er metið á starf, ekki starfsmann`,
        )
      }

      if (!step || step.subCriterionId !== assignment.subCriterionId) {
        throw new BadRequestException(
          `Starfsmaður #${employee.ordinal}: þrepið tilheyrir ekki undirviðmiðinu „${sub.criterionTitle} / ${sub.subTitle}“`,
        )
      }

      return {
        criterionTitle: sub.criterionTitle,
        subTitle: sub.subTitle,
        stepOrder: step.order,
      }
    })

    return {
      ordinal: employee.ordinal,
      identifier: employee.identifier,
      // The pipeline resolves an employee's job by title; the id is what the
      // caller sent, and it has just been proved to name a job in this model.
      roleTitle: role.title,
      gender: employee.gender,
      field: employee.field ?? null,
      department: employee.department ?? null,
      startDate: employee.startDate,
      paidHours: employee.paidHours,
      baseSalary: employee.baseSalary,
      additionalFixedOvertime: employee.additionalFixedOvertime ?? null,
      additionalFixedCarAllowance: employee.additionalFixedCarAllowance ?? null,
      additionalFixedOther: employee.additionalFixedOther ?? null,
      bonusOccasionalOvertime: employee.bonusOccasionalOvertime ?? null,
      bonusOccasionalCarAllowance:
        employee.bonusOccasionalCarAllowance ?? null,
      bonusOther: employee.bonusOther ?? null,
      personalStepAssignments,
    }
  })

  // `satisfies`, not `as unknown as`. The assertion discarded the one
  // compile-time guarantee this function exists to provide — that what it emits
  // really is the payload the pipeline takes — so a field renamed downstream
  // would have gone unnoticed until runtime. It type-checks clean as it stands.
  return {
    criteria,
    roles,
    employees: expandedEmployees,
  } satisfies ParsedReportDto
}
