'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Divider } from '@dmr.is/ui/components/island-is/Divider'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  type CompanyDto,
  type ReportListItemDto,
} from '../../gen/fetch/types.gen'
import { formatNationalId } from '../../lib/utils'
import * as styles from './CompanyExpandedRow.css'

type Props = {
  company: CompanyDto
  approvedReports: ReportListItemDto[]
}

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('is-IS')
}

type FieldRow = { label: string; value: React.ReactNode }

const FieldGrid = ({ fields }: { fields: FieldRow[] }) => (
  <div className={styles.grid}>
    {fields.map(({ label, value }, index) => (
      <Box
        key={label}
        background={Math.floor(index / 2) % 2 === 0 ? 'white' : 'blue100'}
        padding={1}
        className={styles.item}
      >
        <Box display="flex">
          <div className={styles.label}>
            <Text variant="small" fontWeight="semiBold">
              {label}
            </Text>
          </div>
          <Text variant="small">{value ?? '–'}</Text>
        </Box>
      </Box>
    ))}
  </div>
)

const STATUS_MAP: Record<
  string,
  { label: string; variant: 'mint' | 'red' | 'blue' | 'purple' | 'dark' }
> = {
  APPROVED: { label: 'Samþykkt', variant: 'mint' },
  DENIED: { label: 'Hafnað', variant: 'red' },
  IN_REVIEW: { label: 'Í vinnslu', variant: 'blue' },
  SUBMITTED: { label: 'Innsent', variant: 'purple' },
  SUPERSEDED: { label: 'Úrelt', variant: 'dark' },
}

const ReportStatusTag = ({ status }: { status: string }) => {
  const { label = status, variant = 'blue' } = STATUS_MAP[status] ?? {}
  return (
    <Tag variant={variant} outlined disabled>
      {label}
    </Tag>
  )
}

export const CompanyExpandedRow = ({ company, approvedReports }: Props) => {
  const equalityReports = approvedReports.filter((r) => r.type === 'EQUALITY')
  const salaryReports = approvedReports.filter((r) => r.type === 'SALARY')
  const contactReport = equalityReports[0] ?? salaryReports[0]

  const companyFields: FieldRow[] = [
    { label: 'Kennitala', value: formatNationalId(company.nationalId) },
    {
      label: 'Meðalfjöldi starfsmanna',
      value: company.averageEmployeeCountFromRsk,
    },
    {
      label: 'Launagreining skylda',
      value:
        company.salaryReportRequired || company.salaryReportRequiredOverride
          ? 'Já'
          : 'Nei',
    },
    ...(contactReport
      ? [
          { label: 'Tengiliður', value: contactReport.companyAdminName ?? '–' },
          { label: 'Netfang', value: contactReport.companyAdminEmail ?? '–' },
        ]
      : []),
  ]

  return (
    <Box background="blue100" padding={2}>
      <FieldGrid fields={companyFields} />

      {(equalityReports.length > 0 || salaryReports.length > 0) && (
        <>
          <Box paddingY={2}>
            <Divider />
          </Box>
          <Stack space={2}>
            <Text variant="eyebrow">Skjöl</Text>
            {equalityReports.map((r) => (
              <Box
                key={r.id}
                background="white"
                borderRadius="standard"
                padding={2}
                display="flex"
                justifyContent="spaceBetween"
                alignItems="center"
              >
                <Stack space={1}>
                  <Text variant="small" fontWeight="semiBold">
                    Jafnréttisáætlun
                  </Text>
                  <Text variant="small" color="dark300">
                    Gildir til: {formatDate(r.validUntil)}
                  </Text>
                </Stack>
                <ReportStatusTag status={r.status} />
              </Box>
            ))}
            {salaryReports.map((r) => (
              <Box
                key={r.id}
                background="white"
                borderRadius="standard"
                padding={2}
                display="flex"
                justifyContent="spaceBetween"
                alignItems="center"
              >
                <Stack space={1}>
                  <Text variant="small" fontWeight="semiBold">
                    Launagreining
                  </Text>
                  <Text variant="small" color="dark300">
                    Gildir til: {formatDate(r.validUntil)}
                  </Text>
                </Stack>
                <ReportStatusTag status={r.status} />
              </Box>
            ))}
          </Stack>
        </>
      )}
    </Box>
  )
}
