import { Transaction } from 'sequelize'
import {
  CreateCaseChannelBody,
  CreateCaseDto,
  CreateCaseResponseDto,
  PostApplicationBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ICaseCreateService {
  createCaseByApplication(
    body: PostApplicationBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ id: string }>>

  createCase(
    body: CreateCaseDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CreateCaseResponseDto>>

  createCaseChannel(
    caseId: string,
    body: CreateCaseChannelBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

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
