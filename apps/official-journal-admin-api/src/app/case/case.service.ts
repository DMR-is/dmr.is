import { isBooleanString } from 'class-validator'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_CASES } from '@dmr.is/mocks'
import {
  Case,
  CaseEditorialOverview,
  CaseStatus,
  GetCasesQuery,
  GetCasesReponse,
  GetUsersQueryParams,
  GetUsersResponse,
  PostCasePublishBody,
} from '@dmr.is/shared/dto'
import { generatePaging } from '@dmr.is/utils'

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common'

import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
import { HTMLText } from '@island.is/regulations-tools/types'

import { ICaseService } from './case.service.interface'

@Injectable()
export class CaseService implements ICaseService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('CaseService')
  }
  getCase(id: string): Promise<Case | null> {
    const found = ALL_MOCK_CASES.find((c) => c.id === id)

    if (!found) {
      throw new NotFoundException('Case not found')
    }

    if (found.advert.document.isLegacy) {
      found.advert.document.html = dirtyClean(
        found.advert.document.html as HTMLText,
      )
    }

    return Promise.resolve(found)
  }

  getCases(params?: GetCasesQuery): Promise<GetCasesReponse> {
    if (!params) {
      return Promise.resolve({
        cases: ALL_MOCK_CASES,
        paging: generatePaging(ALL_MOCK_CASES),
      })
    }

    try {
      const { page, pageSize } = params

      const filteredCases = ALL_MOCK_CASES.filter((c) => {
        if (params?.search) {
          // for now search for department and name

          if (
            !c.advert.department.title
              .toLowerCase()
              .includes(params.search.toLowerCase()) &&
            !c.advert.title.toLowerCase().includes(params.search.toLowerCase())
          ) {
            return false
          }
        }

        if (params?.caseNumber && c.caseNumber !== params?.caseNumber) {
          return false
        }

        if (
          params?.dateFrom &&
          new Date(c.createdAt) < new Date(params?.dateFrom)
        ) {
          return false
        }

        if (
          params?.dateTo &&
          new Date(c.createdAt) > new Date(params?.dateTo)
        ) {
          return false
        }

        if (params?.status && c.status !== params?.status) {
          return false
        }

        if (params?.fastTrack && isBooleanString(params.fastTrack)) {
          if (c.fastTrack !== Boolean(params.fastTrack)) {
            return false
          }
        }

        if (params?.employeeId && c.assignedTo?.id !== params?.employeeId) {
          return false
        }

        if (
          params?.department &&
          c.advert.department.slug !== params.department.toLowerCase()
        ) {
          return false
        }

        return true
      })

      const withPaging = generatePaging(filteredCases, page, pageSize)
      const pagedCases = filteredCases.slice(
        withPaging.pageSize * (withPaging.page - 1),
        withPaging.pageSize * withPaging.page,
      )
      pagedCases.forEach((c) => {
        if (c.advert.document.isLegacy) {
          c.advert.document.html = dirtyClean(
            c.advert.document.html as HTMLText,
          )
        }
        return c
      })

      return Promise.resolve({
        cases: pagedCases,
        paging: withPaging,
      })
    } catch (error) {
      throw new InternalServerErrorException('Internal server error.')
    }
  }

  getUsers(
    params?: GetUsersQueryParams | undefined,
  ): Promise<GetUsersResponse> {
    this.logger.info('getUsers', { params })
    throw new Error('Method not implemented.')
  }

  async getEditorialOverview(
    params?: GetCasesQuery,
  ): Promise<CaseEditorialOverview> {
    const submitted: Case[] = []
    const inProgress: Case[] = []
    const inReview: Case[] = []
    const ready: Case[] = []

    if (!params?.status) {
      throw new BadRequestException('Missing status')
    }

    ALL_MOCK_CASES.forEach((c) => {
      if (c.status === CaseStatus.Submitted) {
        submitted.push(c)
      } else if (c.status === CaseStatus.InProgress) {
        inProgress.push(c)
      } else if (c.status === CaseStatus.InReview) {
        inReview.push(c)
      } else if (c.status === CaseStatus.ReadyForPublishing) {
        ready.push(c)
      }
    })

    const { cases, paging } = await this.getCases(params)

    return Promise.resolve({
      data: cases,
      totalItems: {
        submitted: submitted.length,
        inProgress: inProgress.length,
        inReview: inReview.length,
        ready: ready.length,
      },
      paging,
    })
  }

  postCasesPublish(body: PostCasePublishBody): Promise<void> {
    this.logger.info(body)
    throw new NotImplementedException()
  }
}
