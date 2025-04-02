import { Transaction } from 'sequelize'
import { CaseChannel } from '@dmr.is/official-journal/dto/case-channel/case-channel.dto'
import { UserDto } from '@dmr.is/official-journal/dto/user/user.dto'
import { PostApplicationBody } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { CreateCaseDto, CreateCaseResponseDto } from '../../dto/create-case.dto'
import { CreateCaseChannelBody } from '../../dto/create-case-channel-body.dto'

export interface ICaseCreateService {
  createCaseByApplication(
    body: PostApplicationBody,
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
