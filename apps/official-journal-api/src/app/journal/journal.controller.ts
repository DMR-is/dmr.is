import { Response } from 'express'

import {
  Controller,
  Get,
  Header,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

import {
  DEFAULT_CASE_SORT_BY,
  DEFAULT_CASE_SORT_DIRECTION,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ICaseService, IJournalService } from '@dmr.is/modules'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import {
  CaseStatusEnum,
  DefaultSearchParams,
  GetAdvertResponse,
  GetAdvertSignatureQuery,
  GetAdvertSignatureResponse,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
  GetCasesInProgressReponse,
  GetCategoriesResponse,
  GetDepartmentResponse,
  GetDepartmentsQueryParams,
  GetDepartmentsResponse,
  GetInstitutionsResponse,
  GetMainCategoriesResponse,
  GetSimilarAdvertsResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { AdvertsToRss } from '../../util/AdvertsToRss'

@Controller({
  version: '1',
})
export class JournalController {
  constructor(
    @Inject(IJournalService) private readonly journalService: IJournalService,
    @Inject(ICaseService) private readonly caseService: ICaseService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
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

  @Get('/departments/:id')
  @ApiOperation({ operationId: 'getDepartmentById' })
  @ApiResponse({ status: 200, type: GetDepartmentResponse })
  async department(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetDepartmentResponse> {
    return ResultWrapper.unwrap(await this.journalService.getDepartment(id))
  }

  @Get('/departments')
  @ApiOperation({ operationId: 'getDepartments' })
  @ApiResponse({ status: 200, type: GetDepartmentsResponse })
  async departments(
    @Query()
    params?: GetDepartmentsQueryParams,
  ): Promise<GetDepartmentsResponse> {
    return ResultWrapper.unwrap(
      await this.journalService.getDepartments(params),
    )
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
  @ApiResponse({
    status: 200,
    content: {
      'application/rss+xml': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  @Header('Content-Type', 'text/rss+xml')
  async getRssFeed(@Param('id') id: string) {
    const adverts = ResultWrapper.unwrap(
      await this.journalService.getAdverts({
        department: id?.toLowerCase(),
        pageSize: 100,
      }),
    )
    return AdvertsToRss(adverts.adverts, id?.toLowerCase())
  }

  @Get('/pdf/:id')
  @ApiOperation({ operationId: 'getPDFFromAdvert' })
  @ApiResponse({
    status: 301,
    headers: {
      Location: {
        schema: {
          type: 'string',
          format: 'uri',
        },
      },
    },
  })
  @ApiResponse({ status: 404, type: NotFoundException })
  @ApiResponse({ status: 500, type: InternalServerErrorException })
  async getPDFFromAdvert(@Param('id') id: string, @Res() res: Response) {
    if (!id) {
      throw new Error('Missing id')
    }
    const adverts = ResultWrapper.unwrap(
      await this.journalService.getAdvert(id.toLowerCase()),
    )
    if (!adverts) {
      return res.status(404)
    }
    const url = adverts.advert.document.pdfUrl
    if (!url) {
      return res.status(404)
    }
    //redirect to the pdf url
    return res.redirect(301, url)
  }
}
