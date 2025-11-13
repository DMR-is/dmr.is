import { Response } from 'express'

import {
  Controller,
  Get,
  Header,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiExcludeEndpoint, ApiOperation, ApiResponse } from '@nestjs/swagger'

import {
  DEFAULT_CASE_SORT_BY,
  DEFAULT_CASE_SORT_DIRECTION,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdminGuard,
  ICaseService,
  IJournalService,
  ReindexRunnerService,
} from '@dmr.is/modules'
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
  GetLeanAdvertsResponse,
  GetMainCategoriesResponse,
  GetSimilarAdvertsResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { AdvertsToRss } from '../../util/AdvertsToRss'

import { Client } from '@opensearch-project/opensearch'

@Controller({
  version: '1',
})
export class JournalController {
  constructor(
    @Inject(IJournalService) private readonly journalService: IJournalService,
    @Inject(ICaseService) private readonly caseService: ICaseService,
    @Inject(ReindexRunnerService) private readonly runner: ReindexRunnerService,
    private readonly openSearch: Client,
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

  @Get('/adverts-lean')
  @ApiOperation({ operationId: 'getAdvertsLean' })
  @ApiResponse({ status: 200, type: GetLeanAdvertsResponse })
  async advertsLean(
    @Query() params?: GetAdvertsQueryParams,
  ): Promise<GetLeanAdvertsResponse> {
    return ResultWrapper.unwrap(
      await this.journalService.getAdvertsLean(params),
    )
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
  @Header('Content-Type', 'application/rss+xml')
  async getRssFeed(@Param('id') id: string) {
    const adverts = ResultWrapper.unwrap(
      await this.journalService.getAdvertsLean({
        department: id?.toLowerCase(),
        pageSize: 100,
      }),
    )
    return AdvertsToRss(adverts.adverts, id?.toLowerCase())
  }

  @Get('/legacy-pdf/:id?')
  @ApiExcludeEndpoint()
  @ApiOperation({ operationId: 'getLegacyPdfPath' })
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
  async getLegacyPdfPath(
    @Query() query: Record<string, string>,
    @Res() res: Response,
    @Param('id') paramId?: string,
  ) {
    // Need to normalize the query parameters to lowercase
    // because the legacy URL parameters were not case-sensitive.
    const normalizedQuery = Object.fromEntries(
      Object.entries(query).map(([key, value]) => [key.toLowerCase(), value]),
    )
    const recordId = normalizedQuery['recordid']
    const documentId = normalizedQuery['documentid']

    const queryId = recordId || documentId

    const id = paramId || queryId

    const pdfRes = await this.journalService.handleLegacyPdfUrl(id)
    const url = pdfRes.unwrap().url

    if (!url) {
      throw new NotFoundException('PDF not found')
    }

    return res.redirect(301, url)
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

  @UseGuards(AdminGuard)
  @Post('reindex-adverts')
  async reindex(@Query('max') max?: string) {
    return this.runner.start(max ? Number(max) : undefined)
  }

  @UseGuards(AdminGuard)
  @Get('reindex-adverts/status')
  status() {
    return this.runner.getStatus()
  }

  @Get('search-adverts')
  async search(@Query() qp: GetAdvertsQueryParams) {
    const INDEX_ALIAS = process.env.ADVERTS_SEARCH_ALIAS ?? 'ojoi_test'
    const q = qp.search?.trim() ?? ''
    const fromValue = qp.pageSize
      ? (qp.page ?? 0) * qp.pageSize
      : qp.page
        ? qp.page * 20
        : 0
    const from = Math.max(0, fromValue)
    const size = Math.min(Math.max(1, qp.pageSize ?? 20), 100)

    // Build filters
    const filters: any[] = []
    if (qp.department)
      filters.push({ term: { 'department.slug': qp.department } })
    if (qp.year) {
      filters.push({ term: { 'publicationNumber.year': qp.year } })
    }
    if (qp.type) {
      filters.push({ term: { 'type.slug': qp.type } })
    }
    if (qp.category) {
      filters.push({ term: { 'categories.slug': qp.category } })
    }
    if (qp.involvedParty) {
      filters.push({ term: { 'involvedParty.slug': qp.involvedParty } })
    }
    if (qp.dateFrom || qp.dateTo) {
      filters.push({
        range: { publicationDate: { gte: qp.dateFrom, lte: qp.dateTo } },
      })
    }

    // Detect "number/year"
    const m = q.match(/^\s*(\d+)\s*\/\s*(\d{4})\s*$/)
    const should: any[] = []
    if (m) {
      const number = String(parseInt(m[1], 10))
      const year = m[2]
      const full = `${number}/${year}`

      // Strong boosts on exact fields
      should.push({
        term: { 'publicationNumber.full': { value: full, boost: 400 } },
      })
      should.push({
        term: { 'publicationNumber.number': { value: number, boost: 45 } },
      })
      should.push({
        term: { 'publicationNumber.year': { value: year, boost: 30 } },
      })

      // Weaker boosts if the pair appears in bodyText as adjacent tokens
      should.push({
        match_phrase: { bodyText: { query: `${number} ${year}`, boost: 50 } },
      })
    }

    // Direct lookup by 11‑digit internal case number
    const isInternalCase = /^\d{11}$/.test(qp.search ?? '')
    if (isInternalCase) {
      should.push({
        term: { caseNumber: { value: qp.search, boost: 400 } },
      })
    }

    // Query
    const body: any = {
      from,
      size,
      query: {
        bool: {
          must: qp.search
            ? [
                {
                  multi_match: {
                    query: qp.search,
                    type: 'best_fields',
                    fields: [
                      'title^3',
                      'title.stemmed',
                      'title.compound',
                      'department.title.stemmed^0.2',
                      'bodyText',
                      'caseNumber',
                    ],
                  },
                },
              ]
            : [{ match_all: {} }],
          filter: filters,
          should,
          minimum_should_match: 0,
        },
      },

      // Don’t send back these fields.
      _source: { excludes: ['bodyText', 'caseNumber'] },
    }

    const res: any = await this.openSearch.search({ index: INDEX_ALIAS, body })
    const hits = (res.body ?? res).hits
    return {
      total: hits.total?.value ?? 0,
      from,
      size,
      items: hits.hits.map((h: any) => ({
        id: h._id,
        score: h._score,
        ...h._source,
        highlight: h.highlight,
      })),
    }
  }
}
