import {
  Body,
  Controller,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../../decorators/lg-response.decorator'
import {
  AdvertDetailedDto,
  UpdateAdvertDto,
} from '../../../models/advert.model'
import { IAdvertService } from '../../../services/advert/advert.service.interface'

@Controller({
  path: 'adverts/:id',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class AdvertUpdateController {
  constructor(
    @Inject(IAdvertService)
    private readonly advertService: IAdvertService,
  ) {}

  @Post('assign/:userId')
  @ApiParam({ name: 'userId', type: String })
  @LGResponse({ operationId: 'assignAdvertToEmployee' })
  assignAdvertToEmployee(
    @Param('id', new UUIDValidationPipe()) advertId: string,
    @Param('userId', new UUIDValidationPipe()) userId: string,
  ) {
    return this.advertService.assignAdvertToEmployee(advertId, userId)
  }

  @Patch('category/:categoryId')
  @LGResponse({ operationId: 'updateAdvertCategory' })
  @ApiParam({ name: 'categoryId', type: String })
  async updateAdvertCategory(
    @Param('id') advertId: string,
    @Param('categoryId', new UUIDValidationPipe())
    categoryId: string,
  ): Promise<void> {
    await this.advertService.updateAdvert(advertId, { categoryId })
  }

  @Patch()
  @LGResponse({ operationId: 'updateAdvert', type: AdvertDetailedDto })
  updateAdvert(
    @Param('id') advertId: string,
    @Body() advertUpdateDto: UpdateAdvertDto,
  ) {
    return this.advertService.updateAdvert(advertId, advertUpdateDto)
  }

  @Post('status/next')
  @LGResponse({ operationId: 'moveAdvertToNextStatus' })
  async moveAdvertToNextStatus(
    @Param('id', new UUIDValidationPipe()) advertId: string,
    @CurrentUser() currentUser: DMRUser,
  ): Promise<void> {
    return this.advertService.moveAdvertToNextStatus(advertId, currentUser)
  }

  @Post('status/previous')
  @LGResponse({ operationId: 'moveAdvertToPreviousStatus' })
  async moveAdvertToPreviousStatus(
    @Param('id', new UUIDValidationPipe()) advertId: string,
    @CurrentUser() currentUser: DMRUser,
  ): Promise<void> {
    return this.advertService.moveAdvertToPreviousStatus(advertId, currentUser)
  }

  @Post('reject')
  @LGResponse({ operationId: 'rejectAdvert' })
  async rejectAdvert(
    @Param('id', new UUIDValidationPipe()) advertId: string,
    @CurrentUser() currentUser: DMRUser,
  ): Promise<void> {
    return this.advertService.rejectAdvert(advertId, currentUser)
  }
}
