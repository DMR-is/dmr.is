import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ReportModel } from '../../../modules/report/models/report.model'
import {
  type ReportResourceContext,
  ReportRoleEnum,
} from '../../../modules/report/types/report-resource-context'
import { UserModel } from '../../../modules/user/models/user.model'

const LOGGING_CONTEXT = 'ReportResourceGuard'

@Injectable()
export class ReportResourceGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user as DMRUser
    const reportId = request.params.reportId as string

    const report = await this.reportModel.findByPkOrThrow(reportId)
    const actor = await this.resolveActor(report, user)

    request.reportResourceContext = {
      reportId: report.id,
      reportStatus: report.status,
      actor,
    } satisfies ReportResourceContext

    return true
  }

  private async resolveActor(
    report: ReportModel,
    user: DMRUser,
  ): Promise<ReportResourceContext['actor']> {
    const reviewer = await this.userModel.findOne({
      where: {
        nationalId: user.nationalId,
        isActive: true,
      },
    })

    if (reviewer) {
      return {
        kind: ReportRoleEnum.REVIEWER,
        userId: reviewer.id,
      }
    }

    if (report.companyNationalId === user.nationalId) {
      return {
        kind: ReportRoleEnum.COMPANY,
        nationalId: user.nationalId,
      }
    }

    this.logger.warn('Current user is not allowed to access this report', {
      context: LOGGING_CONTEXT,
      reportId: report.id,
      nationalId: user.nationalId,
      reportCompanyNationalId: report.companyNationalId,
    })

    throw new ForbiddenException(
      'Current user is not allowed to access this report',
    )
  }
}
