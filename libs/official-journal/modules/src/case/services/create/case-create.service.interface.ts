import { Transaction } from 'sequelize'

import {
  Advert,
  CaseChannel,
  CreateCaseChannelBody,
  CreateCaseDto,
  CreateCaseResponseDto,
  PostApplicationBody,
  UserDto,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ICaseCreateService {
  createCaseByApplication(
    body: PostApplicationBody,
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

  createCaseCategory(
    caseId: string,
    categoryId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  createCaseAddition(
    caseId: string,
    title: string,
    content: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
}

export const ICaseCreateService = Symbol('ICaseCreateService')
