import { ApiDto } from '@dmr.is/decorators'

import { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'

export class SalaryAnalysisRequestDto {
  @ApiDto(ParsedReportDto, {
    description: 'Parsed workbook payload from an excel import endpoint.',
  })
  parsed!: ParsedReportDto
}
