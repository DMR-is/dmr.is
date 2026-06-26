'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Divider } from '@dmr.is/ui/components/island-is/Divider'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { type CompanyDto, ReportStatusEnum } from '../../gen/fetch/types.gen'
import { companiesText, sharedText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { COMPANY_SIZE_LABEL, formatNationalId } from '../../lib/utils'
import * as styles from './CompanyExpandedRow.css'

type Props = {
  company: CompanyDto
}

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('is-IS')
}

type FieldRow = { label: string; value: React.ReactNode }

const FieldGrid = ({ fields }: { fields: FieldRow[] }) => (
  <div className={styles.grid}>
    {fields.map(({ label, value }) => (
      <Box key={label} padding={1} className={styles.item}>
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

const DueDate = ({
  iso,
  overdue,
}: {
  iso: string | null | undefined
  overdue: boolean
}) => {
  if (!iso) return <>–</>
  return (
    <Inline space={1} alignY="center">
      <Text variant="small" color={overdue ? 'red600' : undefined}>
        {formatDate(iso)}
      </Text>
      {overdue && (
        <Tag variant="red" outlined disabled>
          {companiesText.overdueTag}
        </Tag>
      )}
    </Inline>
  )
}

const ReportStatusTag = ({ status }: { status: string }) => {
  const { label = status, variant = 'blue' } = STATUS_MAP[status] ?? {}
  return (
    <Tag variant={variant} outlined disabled>
      {label}
    </Tag>
  )
}

export const CompanyExpandedRow = ({ company }: Props) => {
  const trpc = useTRPC()
  const { data, isLoading } = useQuery(
    trpc.reports.list.queryOptions(
      {
        q: company.nationalId,
        status: [ReportStatusEnum.APPROVED],
        pageSize: 100,
      },
      { staleTime: 30_000 },
    ),
  )

  const approvedReports = data?.reports ?? []
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
    {
      label: companiesText.expandedRow.equalityDueAt,
      value: (
        <DueDate
          iso={company.nextEqualityReportDueAt}
          overdue={company.equalityReportOverdue}
        />
      ),
    },
    {
      label: companiesText.expandedRow.salaryDueAt,
      value: (
        <DueDate
          iso={company.nextSalaryReportDueAt}
          overdue={company.salaryReportOverdue}
        />
      ),
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

      <Box paddingY={2}>
        <Divider />
      </Box>

      {isLoading ? (
        <SkeletonLoader repeat={2} height={56} space={2} />
      ) : equalityReports.length > 0 || salaryReports.length > 0 ? (
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
      ) : null}
    </Box>
  )
}
