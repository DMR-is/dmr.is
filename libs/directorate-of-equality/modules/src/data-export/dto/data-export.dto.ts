import { ApiProperty } from '@nestjs/swagger'

import { ApiOptionalEnum } from '@dmr.is/decorators'

/**
 * Which register the admin is keeping out.
 *
 * Deliberately only two. The Directorate's own taxonomy has exactly two things
 * a company files — a jafnréttisáætlun and a skýrslugjöf — and the export is
 * organised around the register those live in (`company`) and the filings
 * themselves (`report`). The retired vottun/staðfesting split and the
 * gildistímabil counter are not modelled here on purpose: they were shapes of
 * the old SharePoint register, and reproducing them would carry a retired
 * taxonomy into a new system that has a better one.
 */
export enum DataExportDatasetEnum {
  COMPANIES = 'companies',
  REPORTS = 'reports',
}

export enum DataExportFormatEnum {
  XLSX = 'xlsx',
  CSV = 'csv',
}

export class DataExportFormatQueryDto {
  @ApiOptionalEnum(DataExportFormatEnum, {
    enumName: 'DataExportFormatEnum',
    description:
      'File format. Defaults to xlsx — the admins open these in Excel; csv is for anything downstream that parses them.',
  })
  format?: DataExportFormatEnum
}

/**
 * One exported file: the bytes plus what to call them.
 *
 * The filename is built server-side rather than by the controller so the
 * dataset, the row count and the date are named once, in the place that knows
 * all three.
 */
export class DataExportFileDto {
  @ApiProperty({ type: String })
  fileName!: string

  @ApiProperty({ type: String })
  contentType!: string

  @ApiProperty({
    type: Number,
    description: 'Data rows, excluding the header.',
  })
  rowCount!: number

  content!: Buffer
}
