import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import {
  INoticeIssuesService,
  NoticeIssueActor,
  NoticeIssuesDto,
  OneSystemsCheckDto,
  RecentDeliveryDto,
  ReconcileDeliveryDto,
} from '@dmr.is/doe-modules/notice-issues'
import { type UserModel } from '@dmr.is/doe-modules/user'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'

type RequestWithAdminUser = { adminUser: UserModel }

const actorOf = (req: RequestWithAdminUser): NoticeIssueActor => ({
  id: req.adminUser.id,
  name: `${req.adminUser.firstName} ${req.adminUser.lastName}`.trim(),
})

/**
 * Notices that did not reach the company, for the admin "Tilkynningar" page.
 *
 * ADMIN-only throughout, reads included: the page is an admin page, and both
 * acts decide whether a company gets a letter in its island.is mailbox, which
 * is not a reviewer action.
 */
@Controller({
  path: 'notice-issues',
  version: '1',
})
@ApiTags('Notice issues')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard, RequireAdminRoleGuard)
export class NoticeIssuesController {
  constructor(
    @Inject(INoticeIssuesService)
    private readonly noticeIssuesService: INoticeIssuesService,
  ) {}

  @Get()
  @DoeResponse({ operationId: 'getNoticeIssues', type: NoticeIssuesDto })
  async getIssues(): Promise<NoticeIssuesDto> {
    return this.noticeIssuesService.getIssues()
  }

  @Get('recent')
  @DoeResponse({
    operationId: 'getRecentMailboxDeliveries',
    type: [RecentDeliveryDto],
  })
  async getRecentDeliveries(): Promise<RecentDeliveryDto[]> {
    return this.noticeIssuesService.getRecentDeliveries()
  }

  /**
   * A fresh Login to One, from the Kerfisstillingar page. Sends nothing
   * else. The API runs it whatever ONESYSTEMS_ENABLED says, so a script can
   * check credentials before the switch goes on; the page offers it only
   * where the flag is on.
   */
  @Post('onesystems/check')
  @HttpCode(200)
  @DoeResponse({ operationId: 'checkOneSystems', type: OneSystemsCheckDto })
  async checkOneSystems(
    @Req() req: RequestWithAdminUser,
  ): Promise<OneSystemsCheckDto> {
    return this.noticeIssuesService.checkOneSystems(actorOf(req))
  }

  @Post('notices/:id/retry')
  @HttpCode(204)
  @DoeResponse({
    operationId: 'retryNotice',
    status: 204,
    include404: true,
    include409: true,
  })
  async retryNotice(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithAdminUser,
  ): Promise<void> {
    await this.noticeIssuesService.retryNotice(id, actorOf(req))
  }

  @Post('deliveries/:id/reconcile')
  @HttpCode(204)
  @DoeResponse({
    operationId: 'reconcileMailboxDelivery',
    status: 204,
    include404: true,
    include409: true,
  })
  async reconcileDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReconcileDeliveryDto,
    @Req() req: RequestWithAdminUser,
  ): Promise<void> {
    await this.noticeIssuesService.reconcileDelivery(id, dto, actorOf(req))
  }
}
