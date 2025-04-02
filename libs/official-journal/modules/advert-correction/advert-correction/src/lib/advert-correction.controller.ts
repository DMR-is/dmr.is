import { Body, Controller, Inject, Param, Post } from '@nestjs/common'
import { IAdvertCorrectionService } from './advert-correction.service.interface'
import { ResultWrapper } from '@dmr.is/types'
import { ApiOperation, ApiNoContentResponse } from '@nestjs/swagger'
import { AddCaseAdvertCorrection } from './dto/advert-correction.dto'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
@Controller({
  path: 'advert-correction',
  version: '1',
})
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
