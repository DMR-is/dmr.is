import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { CompanyReminderTierEnum } from '../company/models/company-event.model'
import { ReportTypeEnum } from '../report/models/report.enums'
import { NoticePdfService } from './notice-pdf.service'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const OUT = process.env.NOTICE_PDF_OUT_DIR

/**
 * Renders the two notices to real PDFs on disk so the Icelandic copy can be read
 * and handed to Jafnréttisstofa. Skipped unless NOTICE_PDF_OUT_DIR is set, so it
 * never launches Chromium in CI.
 */
const maybe = OUT ? describe : describe.skip

maybe('NoticePdfService (manual render)', () => {
  jest.setTimeout(60_000)

  it.each([
    [
      'aminning',
      CompanyReminderTierEnum.OVERDUE_NOTICE,
      ReportTypeEnum.EQUALITY,
    ],
    [
      'undanfari-dagsekta',
      CompanyReminderTierEnum.FINES_PRECURSOR,
      ReportTypeEnum.SALARY,
    ],
  ])('renders %s', async (name, tier, reportType) => {
    const service = new NoticePdfService(mockLogger as never)

    const pdf = await service.render({
      companyName: 'Acme ehf.',
      companyNationalId: '5501234567',
      companyAddress: 'Einhversstaðir 1, 101 Reykjavík',
      reportType,
      tier,
      dueDate: new Date('2026-05-01T00:00:00.000Z'),
      issueDate: new Date('2026-06-15T00:00:00.000Z'),
    })

    expect(pdf.length).toBeGreaterThan(1000)
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')

    writeFileSync(join(OUT as string, `notice-${name}.pdf`), pdf)
  })
})
