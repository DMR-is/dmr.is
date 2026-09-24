import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Divider } from '@dmr.is/ui/components/island-is/Divider'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  type CompanyDto,
  CompanyObligationStatusEnum,
  CompanyStatusEnum,
} from '../../gen/fetch/types.gen'
import {
  COMPANY_SIZE_LABEL,
  formatDateIS,
  formatNationalId,
  OBLIGATION_LABEL,
  OBLIGATION_TAG_VARIANT,
} from '../../lib/format'
import { companyText as t } from '../../lib/text'
import { InfoItems } from '../InfoItems'

type ObligationProps = {
  title: string
  status: CompanyObligationStatusEnum
  dueAt?: string | null
  overdue: boolean
}

/**
 * One reporting obligation: its state, and when the next one is due. The due
 * date is left out when the report is not owed at all — the register seeds due
 * dates for every company, so showing one beside "Ekki skylt" would contradict
 * the tag next to it.
 */
const Obligation = ({ title, status, dueAt, overdue }: ObligationProps) => (
  <Box border="standard" borderRadius="large" padding={3} height="full">
    <Stack space={1}>
      <Inline space={2} justifyContent="spaceBetween" alignY="center">
        <Text variant="h5">{title}</Text>
        <Tag variant={OBLIGATION_TAG_VARIANT[status]} outlined disabled>
          {OBLIGATION_LABEL[status]}
        </Tag>
      </Inline>
      {status !== CompanyObligationStatusEnum.NOT_REQUIRED && dueAt && (
        <Text variant="small" color={overdue ? 'red600' : 'dark400'}>
          {t.nextDue}: {formatDateIS(dueAt)}
          {overdue && ` · ${t.overdue}`}
        </Text>
      )}
    </Stack>
  </Box>
)

export const CompanyPanel = ({ company }: { company: CompanyDto }) => (
  <Stack space={3}>
    <Text variant="h3" as="h2">
      {t.heading}
    </Text>

    <InfoItems
      items={[
        { label: t.name, children: company.name },
        {
          label: t.nationalId,
          children: formatNationalId(company.nationalId),
        },
        {
          label: t.registerStatus,
          children:
            company.status === CompanyStatusEnum.ACTIVE
              ? t.statusActive
              : t.statusInactive,
        },
        { label: t.address, children: company.address },
        { label: t.email, children: company.email },
        {
          label: t.employeeCount,
          children: COMPANY_SIZE_LABEL[company.employeeCountCategory],
        },
        { label: t.legalForm, children: company.legalFormName },
        {
          label: t.isat,
          children: company.isatCategory
            ? `${company.isatCategory.codeDotted} — ${company.isatCategory.description}`
            : null,
          wide: true,
        },
      ]}
    />

    <Divider />

    <Text variant="h4" as="h3">
      {t.obligationsHeading}
    </Text>
    <GridRow rowGap={2}>
      <GridColumn span={['12/12', '6/12']}>
        <Obligation
          title={t.equalityReport}
          status={company.equalityObligationStatus}
          dueAt={company.nextEqualityReportDueAt}
          overdue={company.equalityReportOverdue}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <Obligation
          title={t.salaryReport}
          status={company.salaryObligationStatus}
          dueAt={company.nextSalaryReportDueAt}
          overdue={company.salaryReportOverdue}
        />
      </GridColumn>
    </GridRow>

    <Text variant="small" color="dark400">
      {t.correctionHint}
    </Text>
  </Stack>
)
