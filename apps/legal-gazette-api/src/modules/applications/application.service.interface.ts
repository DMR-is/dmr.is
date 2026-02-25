import { type DMRUser } from '@dmr.is/auth/dmrUser'
import { ApplicationTypeEnum } from '@dmr.is/legal-gazette-schemas'

import { GetMyApplicationsQueryDto } from '../../core/dto/application.dto'
import {
  ApplicationDetailedDto,
  ApplicationDto,
  GetApplicationsDto,
  GetHTMLPreview,
  IslandIsSubmitApplicationDto,
  UpdateApplicationDto,
} from '../../models/application.model'

export interface IApplicationService {
  getMyApplications(
    query: GetMyApplicationsQueryDto,
    user: DMRUser,
  ): Promise<GetApplicationsDto>

  createApplication(
    type: ApplicationTypeEnum,
    user: DMRUser,
  ): Promise<ApplicationDto>

  submitIslandIsApplication(
    body: IslandIsSubmitApplicationDto,
    submittee: DMRUser,
  ): Promise<void>

  submitApplication(applicationId: string, user: DMRUser): Promise<void>

  getApplicationById(applicationId: string): Promise<ApplicationDetailedDto>

  getApplicationByCaseId(caseId: string): Promise<ApplicationDetailedDto>

  updateApplication(
    applicationId: string,
    body: UpdateApplicationDto,
  ): Promise<ApplicationDetailedDto>

  previewApplication(applicationId: string): Promise<GetHTMLPreview>

  deleteApplication(applicationId: string): Promise<void>
}

export const IApplicationService = Symbol('IApplicationService')
