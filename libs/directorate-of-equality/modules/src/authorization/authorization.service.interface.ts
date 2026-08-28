import { ReportResourceContext } from '../report/types/report-resource-context'
import { UserModel } from '../user/models/user.model'

export interface IAuthorizationService {
  resolveReportResourceContext(
    reportId: string,
    nationalId: string,
  ): Promise<ReportResourceContext>

  resolveAdminUser(nationalId: string): Promise<UserModel>
}

export const IAuthorizationService = Symbol('IAuthorizationService')
