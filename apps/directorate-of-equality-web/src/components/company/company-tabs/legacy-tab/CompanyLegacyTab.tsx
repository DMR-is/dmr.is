'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { LegacyReportDto } from '../../../../gen/fetch'
import { companiesText, serverErrorText, sharedText } from '../../../../lib/text'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import { formatIsoDate, formatNationalId } from '../../../../lib/utils'
import { InfoItems } from '../../../report/report-tabs/company-tab/InfoItems'

const t = companiesText.detailView.legacy

type Props = {
  companyId: string
}

/**
 * A cell that is blank in the source sheet. Rendered as an em dash rather than
 * `InfoItems`' own "Óþekkt" fallback: most of these columns were blank on most
 * rows by design, and calling a deliberately empty archive cell "unknown"
 * suggests we lost something we never had.
 */
const value = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === '' ? t.unknown : String(v)

const date = (v: string | null | undefined) => (v ? formatIsoDate(v) : t.unknown)

/**
 * A SharePoint Created/Modified stamp — a real instant, unlike the sheet's day
 * cells, so it goes through `Date` rather than `formatIsoDate`.
 */
const timestamp = (v: Date | string | null | undefined) =>
  v ? new Date(v).toLocaleDateString('is-IS') : t.unknown

const bool = (v: boolean | null | undefined) =>
  v === null || v === undefined
    ? t.unknown
    : v
      ? sharedText.yesLabel
      : sharedText.noLabel

const Section = ({
  heading,
  items,
}: {
  heading: string
  items: { label: string; children: React.ReactNode }[]
}) => (
  <Box marginTop={4}>
    <Text variant="h4" marginBottom={1}>
      {heading}
    </Text>
    <InfoItems items={items} />
  </Box>
)

const LegacyReportCard = ({
  row,
  index,
  total,
}: {
  row: LegacyReportDto
  index: number
  total: number
}) => (
  <Box>
    {/* Only labelled when there is more than one — a single row is just "the"
        legacy record and numbering it invites the reader to look for a second. */}
    {total > 1 && (
      <Text variant="h3">{`${t.rowHeading} ${index + 1} / ${total}`}</Text>
    )}

    <Section
      heading={t.sectionValidity}
      items={[
        { label: t.legacyStatus, children: value(row.legacyStatus) },
        { label: t.validity, children: value(row.validity) },
        { label: t.salaryValidUntil, children: date(row.salaryValidUntil) },
        { label: t.equalityValidUntil, children: date(row.equalityValidUntil) },
        { label: t.changeType, children: value(row.changeType) },
      ]}
    />

    <Section
      heading={t.sectionCertification}
      items={[
        { label: t.certificationType, children: value(row.certificationType) },
        { label: t.certifier, children: value(row.certifier) },
        { label: t.certifiedAt, children: date(row.certifiedAt) },
        { label: t.round, children: value(row.round) },
        { label: t.caseNumber, children: value(row.caseNumber) },
        {
          label: t.equalityCaseNumber,
          children: value(row.equalityCaseNumber),
        },
      ]}
    />

    <Section
      heading={t.sectionEmployees}
      items={[
        { label: t.employeeCount, children: value(row.employeeCount) },
        { label: t.maleCount, children: value(row.maleCount) },
        { label: t.femaleCount, children: value(row.femaleCount) },
        { label: t.neutralCount, children: value(row.neutralCount) },
        { label: t.topManagerGender, children: value(row.topManagerGender) },
        { label: t.genderPayGap, children: value(row.genderPayGap) },
        { label: t.incomeYear, children: value(row.incomeYear) },
      ]}
    />

    <Section
      heading={t.sectionSize}
      items={[
        { label: t.sizeCategoryNew, children: value(row.sizeCategoryNew) },
        { label: t.sizeCategoryOld, children: value(row.sizeCategoryOld) },
      ]}
    />

    <Section
      heading={t.sectionContact}
      items={[
        { label: t.contactName, children: value(row.contactName) },
        {
          label: t.reminderSent6Months,
          children: bool(row.reminderSent6Months),
        },
        { label: t.reminderSent2Weeks, children: bool(row.reminderSent2Weeks) },
        { label: t.notes, children: value(row.notes) },
      ]}
    />

    <Section
      heading={t.sectionSource}
      items={[
        {
          label: t.nationalId,
          children: formatNationalId(row.nationalId),
        },
        { label: t.legacyCreatedAt, children: timestamp(row.legacyCreatedAt) },
        {
          label: t.legacyModifiedAt,
          children: timestamp(row.legacyModifiedAt),
        },
      ]}
    />
  </Box>
)

/**
 * The company's rows from the Directorate's retired SharePoint register, read
 * only. Every archived column is shown, grouped as the sheet grouped them, so
 * an admin can cross-check a company against the old list without leaving the
 * register — which is the whole reason `legacy_report` keeps the sheet verbatim
 * instead of folding it into our own fields.
 *
 * More than one row is normal: the archive holds one row per *sheet* row, and a
 * handful of companies were resolved from two (a renamed ministry, a kennitala
 * two police districts shared). They render newest edit first, matching the
 * order the register load treated as authoritative.
 */
export const CompanyLegacyTab = ({ companyId }: Props) => {
  const trpc = useTRPC()

  const { data, isLoading, isError } = useQuery(
    trpc.company.legacyReports.queryOptions({ id: companyId }),
  )

  if (isLoading) {
    return (
      <Box marginTop={4}>
        <SkeletonLoader repeat={3} height={80} space={2} />
      </Box>
    )
  }

  if (isError) {
    return (
      <Box marginTop={4}>
        <AlertMessage
          type="error"
          title={serverErrorText.title}
          message={t.loadError}
        />
      </Box>
    )
  }

  const rows = data ?? []

  // Kept though `CompanyTabsContainer` now only mounts this tab when
  // `hasLegacyReports` is true: the flag and this fetch are two round trips, so
  // an empty answer is still reachable, and a blank tab body would be worse.
  if (rows.length === 0) {
    return (
      <Box marginTop={4}>
        <Text>{t.empty}</Text>
      </Box>
    )
  }

  return (
    <Box marginTop={4} marginBottom={6}>
      <Text variant="h3" marginBottom={1}>
        {t.heading}
      </Text>
      <Text>{t.intro}</Text>

      <Stack space={4} dividers>
        {rows.map((row, index) => (
          <LegacyReportCard
            key={row.id}
            row={row}
            index={index}
            total={rows.length}
          />
        ))}
      </Stack>
    </Box>
  )
}
