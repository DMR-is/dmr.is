import { ParsedReportDto } from './dto/parsed-report.dto'

export interface IReportExcelService {
  generateBlankTemplate(): Promise<Buffer>
  importWorkbook(fileBuffer: Buffer): Promise<ParsedReportDto>
}

export const IReportExcelService = Symbol('IReportExcelService')
