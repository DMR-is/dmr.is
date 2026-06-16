'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Divider } from '@dmr.is/ui/components/island-is/Divider'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  type CompanyDto,
  type ReportListItemDto,
} from '../../gen/fetch/types.gen'
import { companiesText, sharedText } from '../../lib/text'
import { COMPANY_SIZE_LABEL, formatNationalId } from '../../lib/utils'
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
    {fields.map(({ label, value }) => (
      <Box
        key={label}
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
  APPROVED: { label: sharedText.statusLabels.APPROVED, variant: 'mint' },
  DENIED: { label: sharedText.statusLabels.DENIED, variant: 'red' },
  IN_REVIEW: { label: sharedText.statusLabels.IN_REVIEW, variant: 'blue' },
  SUBMITTED: { label: sharedText.statusLabels.SUBMITTED, variant: 'purple' },
  SUPERSEDED: { label: sharedText.statusLabels.SUPERSEDED, variant: 'dark' },
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
    {
      label: sharedText.form.kennitalaLabel,
      value: formatNationalId(company.nationalId),
    },
    {
      label: companiesText.expandedRow.avgEmployees,
      value: COMPANY_SIZE_LABEL[company.employeeCountCategory],
    },
    {
      label: companiesText.expandedRow.salaryRequired,
      value:
        company.salaryReportRequired || company.salaryReportRequiredOverride
          ? 'Já'
          : 'Nei',
    },
    ...(contactReport
      ? [
          {
            label: companiesText.expandedRow.contactPerson,
            value: contactReport.companyAdminName ?? '–',
          },
          {
            label: companiesText.expandedRow.contactEmail,
            value: contactReport.companyAdminEmail ?? '–',
          },
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
            <Text variant="eyebrow">{sharedText.files}</Text>
            {equalityReports.map((r) => (
              <LinkV2
                key={r.id}
                href={`/yfirlit/${r.id}`}
                aria-label={`${companiesText.expandedRow.viewReport}: ${sharedText.typeLabels.EQUALITY}`}
              >
                <Box
                  background="white"
                  borderRadius="standard"
                  padding={2}
                  display="flex"
                  justifyContent="spaceBetween"
                  alignItems="center"
                  className={styles.reportCard}
                >
                  <Stack space={1}>
                    <Text variant="small" fontWeight="semiBold">
                      {sharedText.typeLabels.EQUALITY}
                    </Text>
                    <Text variant="small" color="dark300">
                      {companiesText.expandedRow.validUntilPrefix}{' '}
                      {formatDate(r.validUntil)}
                    </Text>
                  </Stack>
                  <ReportStatusTag status={r.status} />
                </Box>
              </LinkV2>
            ))}
            {salaryReports.map((r) => (
              <LinkV2
                key={r.id}
                href={`/yfirlit/${r.id}`}
                aria-label={`${companiesText.expandedRow.viewReport}: ${sharedText.typeLabels.SALARY}`}
              >
                <Box
                  background="white"
                  borderRadius="standard"
                  padding={2}
                  display="flex"
                  justifyContent="spaceBetween"
                  alignItems="center"
                  className={styles.reportCard}
                >
                  <Stack space={1}>
                    <Text variant="small" fontWeight="semiBold">
                      {sharedText.typeLabels.SALARY}
                    </Text>
                    <Text variant="small" color="dark300">
                      {companiesText.expandedRow.validUntilPrefix}{' '}
                      {formatDate(r.validUntil)}
                    </Text>
                  </Stack>
                  <ReportStatusTag status={r.status} />
                </Box>
              </LinkV2>
            ))}
          </Stack>
        </>
      )}
    </Box>
  )
}
