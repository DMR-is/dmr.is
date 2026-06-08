import { CompanySizeEnum } from '../../company/models/company.enums'
import { ReportDetailDto } from '../../report/dto/report-detail.dto'
import {
  GenderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../../report/models/report.enums'
import { ReportEmployeeOutlierDto } from '../../report-employee/dto/report-employee-outlier.dto'
import { SalaryByGenderAndScoreDto } from '../../report-statistics/dto/salary-by-gender-and-score.dto'
import {
  buildSalaryReportHtml,
  SalaryReportPdfData,
} from './salary-report-template'

function makeData(
  overrides: Partial<SalaryReportPdfData> = {},
): SalaryReportPdfData {
  const report = {
    id: 'r1',
    type: ReportTypeEnum.SALARY,
    status: ReportStatusEnum.APPROVED,
    companyAdminName: 'Jónína J. Jónsdóttir',
    companyAdminEmail: 'jonina@mycompany.is',
    companyAdminGender: GenderEnum.FEMALE,
    contactName: 'Jón J. Jónsson',
    contactEmail: 'jon@mycompany.is',
    contactPhone: '+354 888-8888',
    averageEmployeeMaleCount: 25,
    averageEmployeeFemaleCount: 20,
    averageEmployeeNeutralCount: 3,
    correctionDeadline: new Date(2026, 4, 21),
    company: {
      name: 'Testing-hugbúnaður ehf.',
      nationalId: '000000-0000',
      address: 'Hafnarstræti 300',
      city: 'Reykjavík',
      postcode: '101',
      employeeCountCategory: CompanySizeEnum.LARGE,
      isatCategory: '62010 Hugbúnaðargerð',
    },
    subsidiaries: [],
  } as unknown as ReportDetailDto

  const statistics: SalaryByGenderAndScoreDto = {
    dataPoints: [
      { score: 200, adjustedSalary: 600000, gender: GenderEnum.MALE },
      { score: 500, adjustedSalary: 900000, gender: GenderEnum.FEMALE },
    ],
    regressionLine: { slope: 1000, intercept: 400000 },
    scoreBuckets: [],
    totals: {
      maleAverageSalary: 1065400,
      femaleAverageSalary: 983100,
      overallAverageSalary: 1024250,
      maleMedianSalary: 1000000,
      femaleMedianSalary: 950000,
      overallMedianSalary: 975000,
      wageGapPercent: 6.33,
      maleCount: 1,
      femaleCount: 1,
    },
  }

  return { report, statistics, outliers: [], ...overrides }
}

describe('buildSalaryReportHtml', () => {
  it('renders all overview sections', () => {
    const html = buildSalaryReportHtml(makeData())

    expect(html).toContain('Jafnlaunaúttekt')
    expect(html).toContain('Testing-hugbúnaður ehf.')
    expect(html).toContain('000000-0000')
    expect(html).toContain('Æðsti stjórnandi')
    expect(html).toContain('Tengiliður')
    expect(html).toContain('Meðalfjöldi starfsmanna á ársgrundvelli')
    expect(html).toContain('Dótturfyrirtæki')
    expect(html).toContain('Launagreining')
    expect(html).toContain('Úrbótaáætlun')
    expect(html).toContain('Frestur til úrbóta')
  })

  it('renders the salary stat cards with is-IS formatting and signed gap', () => {
    const html = buildSalaryReportHtml(makeData())

    expect(html).toContain('1.065.400')
    expect(html).toContain('983.100')
    expect(html).toContain('+6,3%')
    expect(html).toContain('21.05.2026')
    expect(html).toContain('<svg')
  })

  it('shows empty notes when there are no subsidiaries or outliers', () => {
    const html = buildSalaryReportHtml(makeData())

    expect(html).toContain('Engin dótturfyrirtæki skráð.')
    expect(html).toContain('Engin frávik skráð.')
  })

  it('renders outlier rows when present', () => {
    const outliers = [
      {
        employeeOrdinal: 3,
        roleTitle: 'Sérfræðingur',
        gender: GenderEnum.MALE,
        differencePercent: 19.7,
      },
    ] as unknown as ReportEmployeeOutlierDto[]

    const html = buildSalaryReportHtml(makeData({ outliers }))

    expect(html).toContain('Starfsmaður 3')
    expect(html).toContain('Sérfræðingur')
    expect(html).toContain('+19,7%')
    expect(html).not.toContain('Engin frávik skráð.')
  })
})
