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
  })
  scope!: ScoringValidationScopeEnum

  @ApiString()
  message!: string
}

export class ScoringModelValidationDto {
  @ApiEnum(ScoringModelStatusEnum, { enumName: 'ScoringModelStatusEnum' })
  status!: ScoringModelStatusEnum

  /**
   * Every reason the model is not yet fit to file, not just the first. Empty
   * when `status` is `VALID`.
   */
  @ApiDtoArray(ScoringValidationReasonDto)
  reasons!: ScoringValidationReasonDto[]
}
