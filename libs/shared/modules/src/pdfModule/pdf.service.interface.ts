export interface IPdfService {
  generatePdfFromHtml(html: string, isLegacy?: boolean): Promise<Buffer>
}

export const IPdfService = Symbol('IPdfService')
