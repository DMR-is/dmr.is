import { UserRoleEnum } from '@dmr.is/constants'
import {
  UseGuards,
  Controller,
  Post,
  Body,
  Delete,
  Param,
  Inject,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'
import { TokenJwtAuthGuard } from '@dmr.is/shared/guards/token-auth.guard'
import { RoleGuard } from '@dmr.is/official-journal/modules/user'
import { Roles } from '@dmr.is/decorators'
import { CaseChannel } from '@dmr.is/official-journal/dto/case-channel/case-channel.dto'
import { ResultWrapper } from '@dmr.is/types'
import { CreateCaseChannelBody } from './dto/case-channel.dto'
import { ICaseChannelService } from './case-channel.service.interface'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.Admin)
@Controller({
  version: '1',
  path: 'communication-channels',
})
export class CaseChannelController {
  constructor(
    @Inject(ICaseChannelService)
    private readonly caseChannelService: ICaseChannelService,
  ) {}

  @Post(':caseId')
  @ApiOperation({ operationId: 'createCommunicationChannel' })
  @ApiResponse({ status: 200, type: CaseChannel })
  async createCommunicationChannel(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
    @Body() body: CreateCaseChannelBody,
  ) {
    return ResultWrapper.unwrap(
      await this.caseChannelService.createCaseChannel(caseId, body),
    )
  }

  @Delete(':caseId/:channelId')
  @ApiOperation({ operationId: 'deleteCommunicationChannel' })
  @ApiNoContentResponse()
  async deleteCommunicationChannel(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
    @Param('channelId', new UUIDValidationPipe()) channelId: string,
  ) {
    ResultWrapper.unwrap(
      await this.caseChannelService.deleteCaseChannel(caseId, channelId),
    )
  }
}
