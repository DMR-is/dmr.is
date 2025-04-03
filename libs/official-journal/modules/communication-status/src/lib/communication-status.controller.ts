import { Controller, Get, Inject } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { GetCommunicationSatusesResponse } from './dto/communication-status.dto'
import { ICommunicationStatusService } from './communication-status.service.interface'
import { ResultWrapper } from '@dmr.is/types'
@Controller({
  path: 'communication-statuses',
  version: '1',
})
export class CommunicationStatusController {
  constructor(
    @Inject(ICommunicationStatusService)
    private readonly communicationStatusService: ICommunicationStatusService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getCommunicationStatuses' })
  @ApiResponse({ type: GetCommunicationSatusesResponse })
  async getCommunicationStatuses(): Promise<GetCommunicationSatusesResponse> {
    return ResultWrapper.unwrap(
      await this.communicationStatusService.getCommunicationStatuses(),
    )
  }
}
