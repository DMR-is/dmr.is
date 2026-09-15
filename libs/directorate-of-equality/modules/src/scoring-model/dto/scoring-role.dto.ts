import { ArrayMaxSize } from 'class-validator'

import {
  ApiDtoArray,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { MAX_TOTAL_SUB_CRITERIA } from '../../report-excel/workbook.schema'

export class CreateScoringRoleDto {
  @ApiString({
    minLength: 1,
    description:
      'The job title (starfsheiti) as the employer knows it. This is what an employee’s `roleTitle` maps onto when a report is filed.',
    example: 'Sérfræðingur',
  })
  title!: string
}

/**
 * PATCH semantics, and `ApiOptionalString` rather than
 * `ApiString({ required: false })` — the latter relaxes only the published
 * document while class-validator still demands the field, so an omitted
 * `title` answered 400. The sibling DTO carries a comment about this exact
 * mistake; this one made it anyway.
 */
export class UpdateScoringRoleDto {
  @ApiOptionalString({ minLength: 1 })
  title?: string
}

export class SetScoringRoleStepAssignmentDto {
  @ApiUUId({
    description:
      'A job-based sub-criterion in this model. Personal sub-criteria are scored per employee and are refused here.',
  })
  subCriterionId!: string

  @ApiUUId({
    description:
      'Which þrep on that sub-criterion’s own scale this job sits at. Must belong to the sub-criterion named beside it.',
  })
  stepId!: string
}

/**
 * A job's assignments are written whole, for the same reason a scale is.
 *
 * The rule is one assignment per job per sub-criterion — a uniqueness the table
 * itself holds — and completeness is measured across every job-based
 * sub-criterion at once. Writing them one at a time means a caller cannot move
 * a job from one þrep to another without first deleting, and every partial
 * write risks colliding with the constraint. Taking the set whole makes the
 * uniqueness structural: the array is the job's assignments, entire.
 */
export class SetScoringRoleStepAssignmentsDto {
  // One assignment per job-based sub-criterion, so the model-wide sub-criterion
  // ceiling is the natural bound. Without it this array was unbounded in the
  // same way the þrep array was.
  @ArrayMaxSize(MAX_TOTAL_SUB_CRITERIA)
  @ApiDtoArray(SetScoringRoleStepAssignmentDto, {
    description: [
      'This job’s complete set of step assignments. Replaces whatever it had.',
      '',
      'A model is only fit to file when every job carries an assignment for every job-based sub-criterion, so a short set is accepted and reported rather than refused — the same way an incomplete model is everywhere else. What *is* refused is an incoherent one: a step that belongs to a different sub-criterion, a sub-criterion outside this model, a personal sub-criterion, or the same sub-criterion twice.',
    ].join('\n'),
    example: [
      {
        subCriterionId: '6ad46057-912c-471d-b66a-bc70da17080d',
        stepId: '0c3f2b18-4d7a-4a51-9f3e-5b6c8d2e1a09',
      },
    ],
  })
  assignments!: SetScoringRoleStepAssignmentDto[]
}
