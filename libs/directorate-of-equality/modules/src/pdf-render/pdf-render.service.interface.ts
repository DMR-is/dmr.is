export interface IPdfRenderService {
  /**
   * Renders a self-contained HTML document to an A4 PDF.
   *
   * `styles` is injected as a style tag after the content is set. The page has
   * JavaScript disabled and every request other than `data:` and `about:`
   * blocked, so the HTML must carry everything it needs inline.
   */
  renderHtml(html: string, styles: string): Promise<Buffer>
}

export const IPdfRenderService = Symbol('IPdfRenderService')
