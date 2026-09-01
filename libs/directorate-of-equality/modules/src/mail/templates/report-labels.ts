import { ReportTypeEnum } from '../../report/models/report.enums'

/**
 * How a report kind is named to the company in outbound mail.
 *
 * Deliberately NOT the wording the PDF templates use. Those head their
 * documents "Jafnlaunaúttekt" and "Jafnréttisáætlun" — the names of the
 * documents themselves. These are the names of the *submissions* as the
 * Directorate addresses them in correspondence, which is why a salary report is
 * "Skýrslugjöf" here and "Jafnlaunaúttekt" on the page it attaches.
 *
 * Shared by the approved and denied subjects so the two cannot drift: a company
 * that gets one after the other must see the same noun in both.
 */
export const reportKindLabel = (type: ReportTypeEnum): string =>
  type === ReportTypeEnum.SALARY ? 'Skýrslugjöf' : 'Jafnréttisáætlun'
