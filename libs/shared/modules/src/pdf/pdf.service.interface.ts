export interface IPdfService {
  getCasePdf(caseId: string): Promise<Buffer>
}

export const IPdfService = Symbol('IPdfService')
