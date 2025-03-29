import {
  DEFAULT_CASE_SORT_BY,
  DEFAULT_CASE_SORT_DIRECTION,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from '@dmr.is/constants'
import { CaseStatusEnum } from '@dmr.is/official-journal/models'
import { GetInstitutionsResponse } from '@dmr.is/official-journal/modules/institution'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { ResultWrapper } from '@dmr.is/types'

import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

import { GetCategoriesResponse } from '../../../../../libs/official-journal/modules/category/src/lib/dto/get-categories-responses.dto'
import { GetMainCategoriesResponse } from '../../../../../libs/official-journal/modules/category/src/lib/dto/get-main-categories-response.dto'
import { AdvertsToRss } from '../../util/AdvertsToRss'
import { DefaultSearchParams } from './dto/default-search-params.dto'
import { GetAdvertResponse } from './dto/get-advert-response.dto'
import { GetAdvertSignatureQuery } from './dto/get-advert-signature-query.dto'
import { GetAdvertSignatureResponse } from './dto/get-advert-signature-response.dto'
import { GetAdvertsQueryParams } from './dto/get-adverts-query.dto'
import {
  GetAdvertsResponse,
  GetSimilarAdvertsResponse,
} from './dto/get-adverts-responses.dto'
import { IJournalService } from './journal.service.interface'

@Controller({
  version: '1',
})
export class JournalController {
  constructor(
    @Inject(IJournalService) private readonly journalService: IJournalService,
  ) {}

  @Get('/adverts/:id')
  @ApiOperation({ operationId: 'getAdvertById' })
  @ApiResponse({ status: 200, type: GetAdvertResponse })
  async advert(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetAdvertResponse> {
    return ResultWrapper.unwrap(await this.journalService.getAdvert(id))
  }

  @Get('/adverts/similar/:id')
  @ApiOperation({ operationId: 'getSimilarAdvertsById' })
  @ApiResponse({ status: 200, type: GetSimilarAdvertsResponse })
  async similarAdverts(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetSimilarAdvertsResponse> {
    return ResultWrapper.unwrap(await this.journalService.getSimilarAdverts(id))
  }

  @Get('/adverts')
  @ApiOperation({ operationId: 'getAdverts' })
  @ApiResponse({ status: 200, type: GetAdvertsResponse })
  async adverts(
    @Query() params?: GetAdvertsQueryParams,
  ): Promise<GetAdvertsResponse> {
    return ResultWrapper.unwrap(await this.journalService.getAdverts(params))
  }

  @Get('/maincategories')
  @ApiOperation({ operationId: 'getMainCategories' })
  @ApiResponse({ status: 200, type: GetMainCategoriesResponse })
  async mainCategories(
    @Query()
    params?: DefaultSearchParams,
  ): Promise<GetMainCategoriesResponse> {
    return ResultWrapper.unwrap(
      await this.journalService.getMainCategories(params),
    )
  }

  @Get('/categories')
  @ApiOperation({ operationId: 'getCategories' })
  @ApiResponse({ status: 200, type: GetCategoriesResponse })
  async categories(
    @Query()
    params?: DefaultSearchParams,
  ): Promise<GetCategoriesResponse> {
    return ResultWrapper.unwrap(await this.journalService.getCategories(params))
  }

  @Get('/institutions')
  @ApiOperation({ operationId: 'getInstitutions' })
  @ApiResponse({ status: 200, type: GetInstitutionsResponse })
  async institutions(
    @Query()
    params?: DefaultSearchParams,
  ): Promise<GetInstitutionsResponse> {
    return ResultWrapper.unwrap(
      await this.journalService.getInstitutions(params),
    )
  }

  @Get('/signatures')
  @ApiOperation({ operationId: 'getSignatures' })
  @ApiResponse({ status: 200, type: GetAdvertSignatureResponse })
  async signatures(
    @Query() params?: GetAdvertSignatureQuery,
  ): Promise<GetAdvertSignatureResponse> {
    return ResultWrapper.unwrap(await this.journalService.getSignatures(params))
  }

  @Get('/cases')
  @ApiOperation({ operationId: 'getCasesInProgress' })
  @ApiResponse({ status: 200, type: GetCasesInProgressReponse })
  async getCasesInProgress(
    @Query()
    params?: DefaultSearchParams,
  ): Promise<GetCasesInProgressReponse> {
    const statuses = [
      CaseStatusEnum.Submitted,
      CaseStatusEnum.InProgress,
      CaseStatusEnum.InReview,
      CaseStatusEnum.ReadyForPublishing,
    ]

    const casesResponse = ResultWrapper.unwrap(
      await this.caseService.getCases({
        sortBy: DEFAULT_CASE_SORT_BY,
        direction: DEFAULT_CASE_SORT_DIRECTION,
        page: params?.page ?? DEFAULT_PAGE_NUMBER,
        pageSize: params?.pageSize ?? DEFAULT_PAGE_SIZE,
        status: statuses,
      }),
    )

    return {
      cases: casesResponse.cases.map((c) => ({
        id: c.id,
        title: c.advertType.title + ' ' + c.advertTitle,
        status: c.status.title,
        involvedParty: c.involvedParty.title,
        fastTrack: c.fastTrack,
        createdAt: c.createdAt,
        requestedPublicationDate: c.requestedPublicationDate,
      })),
      paging: casesResponse.paging,
    }
  }

  @Get('/rss/:id')
  @ApiOperation({ operationId: 'getRssFeed' })
  @ApiResponse({ status: 200 })
  async getRssFeed(@Param() param?: { id: string }) {
    const adverts = ResultWrapper.unwrap(
      await this.journalService.getAdverts({
        department: param?.id.toLowerCase(),
        pageSize: 100,
      }),
    )
    return AdvertsToRss(adverts.adverts, param?.id?.toLowerCase())
  }
}
