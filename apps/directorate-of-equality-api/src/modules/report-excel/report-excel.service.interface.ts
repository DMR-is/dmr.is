import { ImportUploadBoundary } from '../import-upload/import-upload.service.interface'
import { ParsedReportDto } from './dto/parsed-report.dto'

export interface IReportExcelService {
  generateBlankTemplate(): Promise<Buffer>
  importWorkbook(
    fileBuffer: Buffer,
    boundary: ImportUploadBoundary,
  ): Promise<ParsedReportDto>
}

export const IReportExcelService = Symbol('IReportExcelService')
