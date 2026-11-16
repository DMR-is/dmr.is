import {
  BadGatewayException,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import {
  isWithholdingTaxError,
  IWithholdingTaxService,
} from '@dmr.is/clients-withholding-tax'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'
import {
  WithholdingTaxCheckDto,
  WithholdingTaxJobCountsDto,
} from './dto/withholding-tax.dto'

/**
 * Skatturinn's WithholdingTaxApi (staðgreiðsla), for checking the integration
 * before anything consumes it. ADMIN-only: the job-count list is the whole
 * 25+ register for a year.
 */
@Controller({
  path: 'withholding-tax',
  version: '1',
})
@ApiTags('Withholding tax')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard, RequireAdminRoleGuard)
export class WithholdingTaxController {
  constructor(
    @Inject(IWithholdingTaxService)
    private readonly withholdingTaxService: IWithholdingTaxService,
  ) {}

  /** A fresh token request. Reads no company data. */
  @Post('check')
  @HttpCode(200)
  @DoeResponse({
    operationId: 'checkWithholdingTax',
    type: WithholdingTaxCheckDto,
  })
  async check(): Promise<WithholdingTaxCheckDto> {
    const checkedAt = new Date()
    try {
      await this.withholdingTaxService.checkConnection()
      return { ok: true, reason: null, checkedAt }
    } catch (error) {
      if (!isWithholdingTaxError(error)) throw error
      const status = error.status ? ` HTTP ${error.status}` : ''
      return {
        ok: false,
        reason: `${error.operation} ${error.reason}${status}`,
        checkedAt,
      }
    }
  }

  @Get('job-counts/:incomeYear')
  @DoeResponse({
    operationId: 'getWithholdingTaxJobCounts',
    type: WithholdingTaxJobCountsDto,
  })
  async getJobCounts(
    @Param('incomeYear', ParseIntPipe) incomeYear: number,
  ): Promise<WithholdingTaxJobCountsDto> {
    try {
      return await this.withholdingTaxService.getJobCounts(incomeYear)
    } catch (error) {
      if (!isWithholdingTaxError(error)) throw error
      // The client has already logged it; its message carries no secret.
      if (error.reason === 'NOT_CONFIGURED') {
        throw new ServiceUnavailableException(error.message)
      }
      throw new BadGatewayException(
        `Skatturinn: ${error.reason}${error.status ? ` (HTTP ${error.status})` : ''}`,
      )
    }
  }
}
