import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { ApplicationTypeEnum } from '@dmr.is/legal-gazette-schemas'

import {
  ApplicationDetailedDto,
  ApplicationDto,
} from '../../models/application.model'
import { GetMyApplicationsQueryDto } from '../../modules/applications/dto/application.dto'
import {
  GetApplicationsDto,
  GetHTMLPreview,
  IslandIsSubmitApplicationDto,
  UpdateApplicationDto,
} from '../../modules/applications/dto/application-extra.dto'

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
