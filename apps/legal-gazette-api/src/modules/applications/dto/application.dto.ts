import { ApiOptionalEnum } from '@dmr.is/decorators'
import { ApplicationTypeEnum } from '@dmr.is/legal-gazette-schemas'

import { ApplicationStatusEnum } from '../../../models/application.model'
import { QueryDto } from '../../shared/dto/query.dto'

export class GetMyApplicationsQueryDto extends QueryDto {
  @ApiOptionalEnum(ApplicationTypeEnum, {
    enumName: 'ApplicationTypeEnum',
  })
  type?: ApplicationTypeEnum

  @ApiOptionalEnum(ApplicationStatusEnum, {
    enumName: 'ApplicationStatusEnum',
  })
  status?: ApplicationStatusEnum
}
