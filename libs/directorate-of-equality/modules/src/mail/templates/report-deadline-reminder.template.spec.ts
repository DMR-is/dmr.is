import { CompanyReminderTierEnum } from '../../company/models/company-event.model'
import { ReportTypeEnum } from '../../report/models/report.enums'
import {
  buildReportDeadlineReminderHtml,
  buildReportDeadlineReminderSubject,
  buildReportDeadlineReminderText,
} from './report-deadline-reminder.template'

describe('report deadline reminder wording', () => {
  it.each([
    [ReportTypeEnum.EQUALITY, 'jafnréttisáætlunar', 'áætluninni'],
    [ReportTypeEnum.SALARY, 'jafnlaunaskýrslu', 'skýrslunni'],
  ])('uses the correct name and case for %s', (reportType, label, noun) => {
    const input = {
      companyName: 'Prufufyrirtæki',
      reportType,
      tier: CompanyReminderTierEnum.TWO_WEEKS,
      dueDate: new Date('2026-10-01T00:00:00Z'),
    }

    expect(buildReportDeadlineReminderSubject(input)).toContain(
      `skilafrestur ${label} —`,
    )
    for (const body of [
      buildReportDeadlineReminderHtml(input),
      buildReportDeadlineReminderText(input),
    ]) {
      expect(body).toContain(`Skiladagur ${label} fyrir`)
      expect(body).toContain(
        `Vinsamlegast tryggðu að ${noun} verði skilað tímanlega.`,
      )
    }
  })
})
