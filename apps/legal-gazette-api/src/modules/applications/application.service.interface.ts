import { DMRUser } from '@dmr.is/auth/dmrUser'
import { PersonDto } from '@dmr.is/clients/national-registry'
import { PagingQuery } from '@dmr.is/shared/dto'

import {
  AddDivisionEndingForApplicationDto,
  AddDivisionMeetingForApplicationDto,
  ApplicationDetailedDto,
  ApplicationDto,
  GetApplicationsDto,
  IslandIsSubmitCommonApplicationDto,
  UpdateApplicationDto,
} from '../../models/application.model'

export interface IApplicationService {
  getMyApplications(
    query: PagingQuery,
    user: DMRUser,
  ): Promise<GetApplicationsDto>

  createApplication(categoryId: string, user: DMRUser): Promise<ApplicationDto>

  submitIslandIsApplication(
    body: IslandIsSubmitCommonApplicationDto,
    submittee: PersonDto,
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

  addDivisionMeetingAdvertToApplication(
    applicationId: string,
    body: AddDivisionMeetingForApplicationDto,
    submittee: PersonDto,
  ): Promise<void>

  addDivisionEndingAdvertToApplication(
    applicationId: string,
    body: AddDivisionEndingForApplicationDto,
    submittee: PersonDto,
  ): Promise<void>
}

export const IApplicationService = Symbol('IApplicationService')
