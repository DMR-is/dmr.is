import { Transaction } from 'sequelize'

import {
  Advert,
  Application,
  CaseChannel,
  CreateCaseChannelBody,
  CreateCaseDto,
  CreateCaseResponseDto,
  UserDto,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

import { ApplicationCaller } from '../../../auth/application-party'

export interface ICaseCreateService {
  createCaseByApplication(
    application: Application,
    caller: ApplicationCaller,
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ id: string }>>
  createCaseByAdvert(
    body: Advert,
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ id: string }>>

  createCase(
    currentUser: UserDto,
    body: CreateCaseDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CreateCaseResponseDto>>

  createCaseChannel(
    caseId: string,
    body: CreateCaseChannelBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseChannel>>

  createCaseAddition(
    caseId: string,
    title: string,
    content: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
}

export const ICaseCreateService = Symbol('ICaseCreateService')
