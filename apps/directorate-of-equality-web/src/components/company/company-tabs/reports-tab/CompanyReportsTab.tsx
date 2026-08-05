'use client'

import { useRouter } from 'next/navigation'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { ActionCard } from '@dmr.is/ui/components/island-is/ActionCard'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { ReportTypeEnum } from '../../../../gen/fetch'
import {
  NAV_PATHS,
  ReportStatusTranslatedEnum,
} from '../../../../lib/constants'
import {
  companiesText,
  serverErrorText,
  sharedText,
} from '../../../../lib/text'
import { useTRPC } from '../../../../lib/trpc/client/trpc'

const t = companiesText.detailView

type Props = {
  companyId: string
}

export const CompanyReportsTab = ({ companyId }: Props) => {
  const router = useRouter()
  const trpc = useTRPC()

  const { data, isLoading, isError } = useQuery(
    trpc.reports.listForCompany.queryOptions({ companyId, pageSize: 100 }),
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
          message={t.reportsLoadError}
        />
      </Box>
    )
  }

  const reports = [...(data?.reports ?? [])].sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bDate - aDate
  })

  if (reports.length === 0) {
    return (
      <Box marginTop={4}>
        <Text>{t.noReports}</Text>
      </Box>
    )
  }

  return (
    <Box marginTop={4}>
      <Stack space={2}>
        {reports.map((report) => (
          <ActionCard
            key={report.id}
            headingVariant="h4"
            heading={
              report.type === ReportTypeEnum.SALARY
                ? report.includesImprovementPlan
                  ? sharedText.typeLabels.IMPROVEMENT_PLAN
                  : sharedText.typeLabels.SALARY
                : sharedText.typeLabels.EQUALITY
            }
            text={
              report.createdAt
                ? new Date(report.createdAt).toLocaleDateString('is-IS')
                : ''
            }
            tag={{
              label: ReportStatusTranslatedEnum[report.status],
              variant: 'blue',
            }}
            cta={{
              label: companiesText.expandedRow.viewReport,
              buttonType: { variant: 'text' },
              onClick: () =>
                router.push(`${NAV_PATHS.heildarlisti.href}/${report.id}`),
            }}
          />
        ))}
      </Stack>
    </Box>
  )
}
