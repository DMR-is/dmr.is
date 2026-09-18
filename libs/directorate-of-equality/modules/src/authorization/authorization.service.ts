import { ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ReportModel } from '../report/models/report.model'
import {
  ReportResourceContext,
  ReportRoleEnum,
} from '../report/types/report-resource-context'
import { UserModel } from '../user/models/user.model'
import { IAuthorizationService } from './authorization.service.interface'

const LOGGING_CONTEXT = 'AuthorizationService'

@Injectable()
export class AuthorizationService implements IAuthorizationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async resolveReportResourceContext(
    reportId: string,
    nationalId: string,
  ): Promise<ReportResourceContext> {
    const report = await this.reportModel.findByPkOrThrow(reportId)

    const reviewer = await this.userModel.findOne({
      where: { nationalId, isActive: true },
    })

    if (reviewer) {
      return {
        reportId: report.id,
        reportStatus: report.status,
        actor: { kind: ReportRoleEnum.REVIEWER, userId: reviewer.id },
      }
    }

    if (report.companyNationalId === nationalId) {
      return {
        reportId: report.id,
        reportStatus: report.status,
        actor: { kind: ReportRoleEnum.COMPANY, nationalId },
      }
    }

    this.logger.warn('Current user is not allowed to access this report', {
      context: LOGGING_CONTEXT,
      reportId: report.id,
      nationalId,
      reportCompanyNationalId: report.companyNationalId,
    })

    throw new ForbiddenException(
      'Current user is not allowed to access this report',
    )
  }

  async resolveAdminUser(nationalId: string): Promise<UserModel> {
    const adminUser = await this.userModel.findOne({
      where: { nationalId, isActive: true },
    })

    if (!adminUser) {
      this.logger.warn(
        'Access denied — user not found in doe_user or inactive',
        {
          context: LOGGING_CONTEXT,
          nationalId,
        },
      )
      throw new ForbiddenException('Access restricted to DoE reviewers')
    }

    return adminUser
  }
}
