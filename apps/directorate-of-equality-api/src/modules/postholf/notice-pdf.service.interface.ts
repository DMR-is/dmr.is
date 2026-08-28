import { NoticeInput } from './templates/notice.template'

export interface INoticePdfService {
  /**
   * Renders one notice to a PDF buffer.
   *
   * Takes a plain params object rather than a report id: these notices fire
   * precisely *because* no report was filed, so there is nothing in
   * `report-pdf.service.ts` to reuse beyond the browser launcher.
   */
  render(input: NoticeInput): Promise<Buffer>
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const INoticePdfService = Symbol('INoticePdfService')
