import { CompanyReminderTierEnum } from '../company/models/company-event.model'
import { ReportTypeEnum } from '../report/models/report.enums'
import {
  buildApprovedLetter,
  buildDeadlineReminderLetter,
  buildDeniedLetter,
  buildSubmittedLetter,
} from './notice-letter.template'

const DATE = new Date('2026-10-08T10:00:00.000Z')
const COMPANY = 'Fyrirtæki <ehf.>'

describe('notice letters', () => {
  it('a receipt names the report kind, the company and the date it arrived', () => {
    const letter = buildSubmittedLetter(
      { type: ReportTypeEnum.EQUALITY },
      COMPANY,
      DATE,
    )

    expect(letter.subject).toBe('Jafnréttisáætlun móttekin')
    expect(letter.html).toContain('<!DOCTYPE html>')
    expect(letter.html).toContain('Fyrirtæki &lt;ehf.&gt;')
    expect(letter.html).not.toContain(COMPANY)
    expect(letter.html).toContain(
      'Jafnréttisstofu barst jafnréttisáætlun fyrirtækisins 08.10.2026.',
    )
  })

  it('an approval carries the email’s text and lists its enclosures instead of attachments', () => {
    const letter = buildApprovedLetter(
      { type: ReportTypeEnum.SALARY, validUntil: new Date('2029-10-08') },
      COMPANY,
      DATE,
      ['jafnlaunaúttekt', 'úrbótaáætlun'],
    )

    expect(letter.subject).toBe('Skýrslugjöf samþykkt')
    expect(letter.html).toContain('Samþykktin gildir til 08.10.2029.')
    expect(letter.html).toContain('Fylgiskjöl: jafnlaunaúttekt, úrbótaáætlun.')
    expect(letter.html).not.toContain('viðhengi')
  })

  it('an approval with nothing enclosed has no enclosure line', () => {
    const letter = buildApprovedLetter(
      { type: ReportTypeEnum.EQUALITY, validUntil: null },
      COMPANY,
      DATE,
      [],
    )

    expect(letter.html).not.toContain('Fylgiskjöl')
  })

  it('a denial quotes the reviewer’s reason, escaped', () => {
    const letter = buildDeniedLetter(
      { type: ReportTypeEnum.SALARY },
      COMPANY,
      DATE,
      'Vantar <script>gögn</script>\nog fleira',
    )

    expect(letter.subject).toBe('Skýrslugjöf hafnað')
    expect(letter.html).toContain(
      'Vantar &lt;script&gt;gögn&lt;/script&gt;<br/>og fleira',
    )
    expect(letter.html).not.toContain('<script>')
  })

  it('a deadline reminder carries the email’s text, dated the day it is sent', () => {
    const letter = buildDeadlineReminderLetter(
      {
        companyName: COMPANY,
        reportType: ReportTypeEnum.SALARY,
        tier: CompanyReminderTierEnum.TWO_WEEKS,
        dueDate: new Date('2026-10-20T00:00:00.000Z'),
      },
      DATE,
    )

    expect(letter.subject).toBe(
      'Áminning: skilafrestur jafnlaunaskýrslu — skiladagur 20.10.2026',
    )
    expect(letter.html).toContain('<p class="letter__date">08.10.2026</p>')
    expect(letter.html).toContain('Skilafrestur er innan tveggja vikna.')
    expect(letter.html).not.toContain(COMPANY)
  })
})
