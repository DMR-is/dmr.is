import { GetCompaniesQueryDto } from '../company/dto/get-companies-query.dto'
import { GetReportsQueryDto } from '../report/dto/get-reports.query.dto'
import { DataExportFileDto, DataExportFormatEnum } from './dto/data-export.dto'

/**
 * Builds the files behind "Gagnaútdráttur".
 *
 * Both methods take the SAME query DTO the corresponding list endpoint takes,
 * and resolve it through the same `where` builder — an export whose filter
 * behaved even slightly differently from the screen it was launched from would
 * be wrong in a way nobody could spot from the file.
 *
 * Paging params on the query are ignored: the export is the whole filtered set
 * or it is misleading.
 *
 * `filterSummary` is pre-localised display text for the workbook's own
 * "Um útdráttinn" sheet. It is passed in rather than derived here because the
 * caller is the side that knows the labels an admin actually saw — resolving
 * an ÍSAT code or a region code back to its Icelandic name is the web's job,
 * not this service's.
 */
export interface IDataExportService {
  exportCompanies(
    query: GetCompaniesQueryDto,
    format: DataExportFormatEnum,
    filterSummary: string[],
  ): Promise<DataExportFileDto>

  exportReports(
    query: GetReportsQueryDto,
    format: DataExportFormatEnum,
    filterSummary: string[],
  ): Promise<DataExportFileDto>
}

export const IDataExportService = Symbol('IDataExportService')
