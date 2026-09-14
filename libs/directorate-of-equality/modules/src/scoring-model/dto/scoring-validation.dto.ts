import { ApiDtoArray, ApiEnum, ApiString } from '@dmr.is/decorators'

/**
 * Whether a scoring model is currently fit to file against.
 *
 * Deliberately not an error. A model is authored over several calls and is
 * incomplete for most of that time — weights do not reach 100 until the last
 * sub-criterion is in. Refusing every write that leaves the model incomplete
 * would make it impossible to build one. So writes succeed, this says where the
 * model stands, and the filing is what refuses.
 */
export enum ScoringModelStatusEnum {
  VALID = 'VALID',
  INVALID = 'INVALID',
}

/**
 * Which region of the model a reason is about, so a caller can attach it to the
 * right part of their own UI rather than parsing the message.
 */
export enum ScoringValidationScopeEnum {
  CRITERIA = 'CRITERIA',
  SUB_CRITERIA = 'SUB_CRITERIA',
  STEPS = 'STEPS',
  ROLES = 'ROLES',
  ROLE_ASSIGNMENTS = 'ROLE_ASSIGNMENTS',
}

export class ScoringValidationReasonDto {
  @ApiEnum(ScoringValidationScopeEnum, {
    enumName: 'ScoringValidationScopeEnum',
    description: [
      'Which part of the model the reason is about, so it can be shown against the right thing rather than parsed out of the message.',
      '',
      '- `CRITERIA` — the criteria themselves: a mandatory job-based type with no criterion, or more than one personal criterion.',
      '- `SUB_CRITERIA` — the sub-criteria as a set: none at all, or weights that do not total 100 across the whole model.',
      '- `STEPS` — one sub-criterion’s scale: no steps, or step orders that are not contiguous from 1.',
      '- `ROLES` — the jobs as a set: currently only that there are none.',
      '- `ROLE_ASSIGNMENTS` — one job’s step assignments: a job-based sub-criterion it is not assigned on, or an assignment onto a personal sub-criterion, which is scored per employee and never per job.',
    ].join('\n'),
    example: 'SUB_CRITERIA',
  })
  scope!: ScoringValidationScopeEnum

  @ApiString({
    description:
      'What is wrong, in Icelandic, phrased for an employer rather than an integrator — safe to show to the person who has to fix it. Naming the offending criterion or job where there is one.',
    example: 'Vægi undirviðmiða leggst saman í 110%, á að vera 100%',
  })
  message!: string
}

export class ScoringModelValidationDto {
  @ApiEnum(ScoringModelStatusEnum, {
    enumName: 'ScoringModelStatusEnum',
    description: [
      'Whether this model is complete enough to file a salary report against.',
      '',
      '**An `INVALID` model is normal and is not an error.** A model is built over many calls and its weights cannot total 100 until the last sub-criterion is in, so every write — create, update and delete alike — succeeds even when it leaves the model incomplete, and answers with the state it left behind. Refusing those writes would make a model impossible to author. The refusal happens at filing instead, against these same rules.',
      '',
      '⚠️ **`VALID` means the model is complete. It does not promise that the next filing will succeed.** Two of the submission’s rules need the filing’s own employees and cannot be decided here: that the report covers enough employees, and that every employee carries exactly one assignment per personal sub-criterion. A filing can still be refused for either.',
    ].join('\n'),
    example: 'INVALID',
  })
  status!: ScoringModelStatusEnum

  /**
   * Every reason at once, not merely the first. The gate that files a report
   * accumulates the same way: a first-time integration should learn about all
   * of its mistakes in one round trip rather than one per attempt.
   */
  @ApiDtoArray(ScoringValidationReasonDto, {
    description:
      'Every reason the model is not yet fit to file — all of them, not just the first, so one call tells a caller everything that is outstanding. Empty when `status` is `VALID`. Ordered by the region of the model they concern, but treat the order as presentational rather than contractual.',
    example: [
      {
        scope: 'CRITERIA',
        message:
          'Skyldubundið starfsbundið viðmið „COMPETENCE“ vantar — hvert starfsmat verður að innihalda öll fjögur',
      },
      {
        scope: 'SUB_CRITERIA',
        message: 'Vægi undirviðmiða leggst saman í 110%, á að vera 100%',
      },
      {
        scope: 'STEPS',
        message: 'Undirviðmiðið „Mannaforráð“ hefur engin þrep',
      },
    ],
  })
  reasons!: ScoringValidationReasonDto[]
}
