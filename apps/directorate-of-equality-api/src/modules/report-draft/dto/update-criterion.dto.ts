import {
  ApiOptionalEnum,
  ApiOptionalNumber,
  ApiOptionalString,
} from '@dmr.is/decorators'

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'

/** Patch body for a criterion (PATCH semantics — omitted keys untouched). */
export class UpdateCriterionDto {
  @ApiOptionalString({ minLength: 1 })
  title?: string

  @ApiOptionalNumber()
  weight?: number

  @ApiOptionalString()
  description?: string

  @ApiOptionalEnum(ReportCriterionTypeEnum, {
    enumName: 'ReportCriterionTypeEnum',
  })
  type?: ReportCriterionTypeEnum
}
