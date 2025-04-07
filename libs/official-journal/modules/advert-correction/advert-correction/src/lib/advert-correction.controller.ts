import { UserRoleEnum } from '@dmr.is/constants'
import { Roles } from '@dmr.is/decorators'
import { RoleGuard } from '@dmr.is/official-journal/modules/user'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { TokenJwtAuthGuard } from '@dmr.is/shared/guards/token-auth.guard'
import { ResultWrapper } from '@dmr.is/types'

import {
  Body,
  Controller,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
} from '@nestjs/swagger'

import { AddCaseAdvertCorrection } from './dto/advert-correction.dto'
import { IAdvertCorrectionService } from './advert-correction.service.interface'
@Controller({
  path: 'advert-correction',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.Admin)
export class AdvertCorrectionController {
  constructor(
    @Inject(IAdvertCorrectionService)
    private readonly advertCorrectionService: IAdvertCorrectionService,
  ) {}

  @Post('/case/:caseId/correction')
  @ApiOperation({ operationId: 'postCorrection' })
  @ApiNoContentResponse()
  async postCorrection(
    @Param('caseId', new UUIDValidationPipe()) id: string,
    @Body() body: AddCaseAdvertCorrection,
  ) {
    ResultWrapper.unwrap(
      await this.advertCorrectionService.postCaseCorrection(id, body),
    )
  }
}
