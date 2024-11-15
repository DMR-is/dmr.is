import { Transaction } from 'sequelize'
import { CreateCaseChannelBody, PostApplicationBody } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ICaseCreateService {
  createCase(
    body: PostApplicationBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

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
