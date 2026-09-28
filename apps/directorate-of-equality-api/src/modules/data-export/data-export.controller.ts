import {
  Controller,
  Get,
  Header,
  Inject,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { GetCompaniesQueryDto } from '@dmr.is/doe-modules/company'
import {
  DataExportFileDto,
  IDataExportService,
} from '@dmr.is/doe-modules/data-export'
import { UserModel } from '@dmr.is/doe-modules/user'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentAdminUser } from '../../core/decorators/current-admin-user.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { contentDisposition } from '../../core/http/content-disposition'

/**
 * "Gagnaútdráttur" — the admin data export.
 *
 * The route takes the SAME query DTO as the company list, so a filter the
 * admin built on screen is handed straight through. The response is a file:
 * this is a `@Get` rather than a `@Post`
 * so the browser can fetch them with a plain link and the filter stays in the
 * URL, which is what makes an export reproducible by pasting it to a colleague.
 */
@Controller({
  path: 'export',
  version: '1',
})
@ApiTags('Data export')
@ApiBearerAuth()
// DoE staff only, like every other admin surface. `DeclaredAccessGuard`
// default-denies any route whose chain does not name both a verified token and
// an identity guard, so this pair IS the access policy — dropping either makes
// the route 403 for everyone rather than merely less guarded.
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class DataExportController {
  constructor(
    @Inject(IDataExportService)
    private readonly dataExportService: IDataExportService,
  ) {}

  @Get('companies')
  @Header('Cache-Control', 'private, no-store')
  @DoeResponse({
    operationId: 'exportCompanies',
    successDescription:
      'The company register matching the filter, as a spreadsheet.',
    produces:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  async exportCompanies(
    @Query() query: GetCompaniesQueryDto,
    @Query('filterSummary') filterSummary: string | string[] | undefined,
    @CurrentAdminUser() adminUser: UserModel,
  ): Promise<StreamableFile> {
    const file = await this.dataExportService.exportCompanies(
      query,
      normaliseSummary(filterSummary),
      adminUser.id,
    )

    return toStreamableFile(file)
  }
}

/**
 * `?filterSummary=` repeated is an array, given once is a string, absent is
 * undefined — Express decides which, so all three have to be handled or a
 * single-filter export throws on `.map`.
 */
const normaliseSummary = (value: string | string[] | undefined): string[] => {
  if (value === undefined) return []
  return (Array.isArray(value) ? value : [value]).filter(
    (line) => line.trim().length > 0,
  )
}

/**
 * `attachment`, unlike the report PDFs, which are served `inline` to render in
 * the viewer. A spreadsheet has nothing to render into — the browser would
 * either download it anyway or hand it to a plugin.
 */
const toStreamableFile = (file: DataExportFileDto): StreamableFile =>
  new StreamableFile(file.content, {
    type: file.contentType,
    disposition: contentDisposition('attachment', file.fileName),
  })
