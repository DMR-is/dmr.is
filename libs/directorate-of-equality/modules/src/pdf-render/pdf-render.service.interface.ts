/** What a render produces, for the failure log. */
export type PdfDocumentKind = 'report' | 'letter'

export interface IPdfRenderService {
  /**
   * Renders a self-contained HTML document to an A4 PDF.
   *
   * `styles` is injected as a style tag after the content is set. The page has
   * JavaScript disabled and every request other than `data:` and `about:`
   * blocked, so the HTML must carry everything it needs inline.
   *
   * `documentKind` names the document in the failure log
   * (`Failed to generate <kind> PDF`). It defaults to `report`, the message
   * the report renders have always logged.
   */
  renderHtml(
    html: string,
    styles: string,
    documentKind?: PdfDocumentKind,
  ): Promise<Buffer>
}

export const IPdfRenderService = Symbol('IPdfRenderService')
