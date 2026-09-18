import type { Response } from 'express'

import {
  Controller,
  Get,
  Inject,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { GetCompaniesQueryDto } from '@dmr.is/doe-modules/company'
import {
  DataExportFileDto,
  DataExportFormatEnum,
  IDataExportService,
} from '@dmr.is/doe-modules/data-export'
import { GetReportsQueryDto } from '@dmr.is/doe-modules/report'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { contentDisposition } from '../../core/http/content-disposition'

/**
 * "Keyra út lista" — the admin data export.
 *
 * Both routes take the SAME query DTO as the list endpoint they mirror, so a
 * filter the admin built on screen is handed straight through. Whatever
 * `?format=` says, the response is a file: these are `@Get` rather than `@Post`
 * so the browser can fetch them with a plain link and the filter stays in the
 * URL, which is what makes an export reproducible by pasting it to a colleague.
 */
@Controller({
  path: 'export',
  version: '1',
})
@ApiTags('Data export')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class DataExportController {
  constructor(
    @Inject(IDataExportService)
    private readonly dataExportService: IDataExportService,
  ) {}

  @Get('companies')
  @DoeResponse({
    operationId: 'exportCompanies',
    successDescription:
      'The company register matching the filter, as a spreadsheet.',
    produces:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  async exportCompanies(
    @Query() query: GetCompaniesQueryDto,
    @Query('format') format: DataExportFormatEnum,
    @Query('filterSummary') filterSummary: string | string[] | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.dataExportService.exportCompanies(
      query,
      normaliseFormat(format),
      normaliseSummary(filterSummary),
    )

    return toStreamableFile(file, res)
  }

  @Get('reports')
  @DoeResponse({
    operationId: 'exportReports',
    successDescription: 'The reports matching the filter, as a spreadsheet.',
    produces:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  async exportReports(
    @Query() query: GetReportsQueryDto,
    @Query('format') format: DataExportFormatEnum,
    @Query('filterSummary') filterSummary: string | string[] | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.dataExportService.exportReports(
      query,
      normaliseFormat(format),
      normaliseSummary(filterSummary),
    )

    return toStreamableFile(file, res)
  }
}

/** Anything but an explicit `csv` is xlsx — the format the admins open. */
const normaliseFormat = (format: DataExportFormatEnum): DataExportFormatEnum =>
  format === DataExportFormatEnum.CSV
    ? DataExportFormatEnum.CSV
    : DataExportFormatEnum.XLSX

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
 *
 * The row count rides along as a header so the caller can tell an empty export
 * from a failed one without opening the file.
 */
const toStreamableFile = (
  file: DataExportFileDto,
  res: Response,
): StreamableFile => {
  res.setHeader('X-Export-Row-Count', String(file.rowCount))

  return new StreamableFile(file.content, {
    type: file.contentType,
    disposition: contentDisposition('attachment', file.fileName),
  })
}
