import { DMRUser } from '@dmr.is/auth/dmrUser'
import { ApplicationTypeEnum } from '@dmr.is/legal-gazette/schemas'
import { PagingQuery } from '@dmr.is/shared/dto'

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
    query: PagingQuery,
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

  getApplicationById(
    applicationId: string,
    user: DMRUser,
  ): Promise<ApplicationDetailedDto>

  getApplicationByCaseId(
    caseId: string,
    user: DMRUser,
  ): Promise<ApplicationDetailedDto>

  updateApplication(
    applicationId: string,
    body: UpdateApplicationDto,
    user: DMRUser,
  ): Promise<ApplicationDetailedDto>

  previewApplication(
    applicationId: string,
    user: DMRUser,
  ): Promise<GetHTMLPreview>

  deleteApplication(applicationId: string): Promise<void>
}

export const IApplicationService = Symbol('IApplicationService')
