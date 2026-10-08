import { Inject, Injectable } from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { getBrowser } from './lib/browser'
import { IPdfRenderService } from './pdf-render.service.interface'

const LOGGING_CONTEXT = 'PdfRenderService'

@Injectable()
export class PdfRenderService implements IPdfRenderService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  async renderHtml(html: string, styles: string): Promise<Buffer> {
    const browser = await getBrowser()
    try {
      const page = await browser.newPage()

      /*
       * ⚠️ Both of the following harden the renderer against the one piece of
       * applicant-supplied markup these documents carry: the equality report's
       * `content` (`equality-report-template.ts`), which is rich text the
       * company wrote and is interpolated as markup rather than escaped.
       *
       * That template sanitises it, and that is the primary defence. These two
       * are the second layer, and they are nearly free because — as the
       * `waitUntil` note below already argues — these documents are
       * self-contained: the chart is inline SVG, the styles are injected from
       * `styles`, and nothing here needs script or the network. So there is
       * no functionality to trade away by removing both.
       *
       * It matters because this page is not a sandbox. `getBrowser` launches
       * Chromium with `--no-sandbox`, inside the API container, on the
       * container's network — so anything that executes here executes next to
       * internal services and the instance metadata endpoint. Without this, a
       * `<script>` or an `onerror=` in a submitted plan runs there, and an
       * `<img src="http://…">` reaches them even with scripting off, since
       * `waitUntil: 'load'` waits for subresources to be fetched.
       */
      await page.setJavaScriptEnabled(false)

      await page.setRequestInterception(true)
      page.on('request', (request) => {
        const url = request.url()
        // `data:` covers inline images; `about:` is the blank document
        // `setContent` writes into. Everything else is a fetch this renderer
        // has no reason to make.
        if (url.startsWith('data:') || url.startsWith('about:')) {
          request.continue()
        } else {
          this.logger.warn(
            'Blocked an outbound request from the PDF renderer',
            {
              context: LOGGING_CONTEXT,
              url,
            },
          )
          request.abort()
        }
      })

      /*
       * ⚠️ `load`, NOT `networkidle0`.
       *
       * These documents are self-contained: the chart is inline SVG, the styles
       * are injected below, and there is no image, font or script fetched from
       * anywhere. So there is no network to go idle, and `networkidle0` waits for
       * a 500ms silent window that some Chromium builds never report for such a
       * page — it then fails the whole render with `Navigation timeout of 30000
       * ms exceeded`. Verified locally: `networkidle0` and `networkidle2` both
       * time out against `/Applications/Chromium.app`, while `load`,
       * `domcontentloaded` and the default all finish in ~1.5s and produce a
       * BYTE-IDENTICAL PDF. Waiting for network idle buys this renderer nothing.
       *
       * The stake is higher than a failed download: `notifyCompanyApproved`
       * renders inside the reviewer's approve request and swallows failures, so a
       * hang here costs 30s per document and ends with the company never being
       * told its report was approved.
       *
       * The other PDF services in this repo (`legal-gazette-api`,
       * `official-journal`) still pass `networkidle0`. They work in the deployed
       * container, so its `/usr/bin/chromium-browser` does settle — but the same
       * latent hang is one Chromium bump away for them. Not changed here.
       */
      await page.setContent(html, { waitUntil: 'load' })
      await page.addStyleTag({ content: styles })

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
      })

      return Buffer.from(pdfBuffer)
    } catch (error) {
      this.logger.warn('Failed to render PDF', {
        context: LOGGING_CONTEXT,
        error,
      })
      throw error
    } finally {
      await browser.close()
    }
  }
}
