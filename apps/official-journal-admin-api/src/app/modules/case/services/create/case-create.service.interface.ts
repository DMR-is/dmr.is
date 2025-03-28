import { Transaction } from 'sequelize'
import { ResultWrapper } from '@dmr.is/types'
import { PostApplicationBody } from '@dmr.is/official-journal/modules/application'
import { UserDto } from '@dmr.is/official-journal/modules/user'
import { CaseChannel } from '../../dto/case-channel.dto'
import { CreateCaseChannelBody } from '../../dto/create-case-channel-body.dto'
import { CreateCaseDto, CreateCaseResponseDto } from '../../dto/create-case.dto'

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
