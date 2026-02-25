import { type DMRUser } from '@dmr.is/auth/dmrUser'

import {
  CreateDivisionEndingDto,
  CreateDivisionMeetingDto,
  GetMinDateResponseDto,
} from '../../../models/application.model'

export interface IRecallApplicationService {
  submitRecallApplication(applicationId: string, user: DMRUser): Promise<void>

  addDivisionMeeting(
    applicationId: string,
    body: CreateDivisionMeetingDto,
    submittee: DMRUser,
  ): Promise<void>

  addDivisionEnding(
    applicationId: string,
    body: CreateDivisionEndingDto,
    submittee: DMRUser,
  ): Promise<void>

  getMinDateForDivisionMeeting(
    applicationId: string,
  ): Promise<GetMinDateResponseDto>

  getMinDateForDivisionEnding(
    applicationId: string,
  ): Promise<GetMinDateResponseDto>
}

export const IRecallApplicationService = Symbol('IRecallApplicationService')
