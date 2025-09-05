import { DMRUser } from '@dmr.is/auth/dmrUser'
import { PagingQuery } from '@dmr.is/shared/dto'

import { CaseDto } from '../case/dto/case.dto'
import {
  AddDivisionEndingForApplicationDto,
  AddDivisionMeetingForApplicationDto,
  ApplicationDetailedDto,
  ApplicationsDto,
  UpdateApplicationDto,
} from './dto/application.dto'
import { IslandIsSubmitCommonApplicationDto } from './dto/island-is-application.dto'

export interface IApplicationService {
  getMyApplications(query: PagingQuery, user: DMRUser): Promise<ApplicationsDto>

  createApplication(categoryId: string, user: DMRUser): Promise<CaseDto>

  submitIslandIsApplication(
    body: IslandIsSubmitCommonApplicationDto,
    user: DMRUser,
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
    user: DMRUser,
  ): Promise<void>

  addDivisionEndingAdvertToApplication(
    applicationId: string,
    body: AddDivisionEndingForApplicationDto,
    user: DMRUser,
  ): Promise<void>
}

export const IApplicationService = Symbol('IApplicationService')
