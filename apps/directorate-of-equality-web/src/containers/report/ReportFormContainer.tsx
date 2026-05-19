import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Breadcrumbs } from '@dmr.is/ui/components/island-is/Breadcrumbs'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import type { ReportDetailDto } from '../../gen/fetch'
import { formatDateIS } from '../../lib/constants'
import { reportText } from '../../lib/text'
import { ReportTabsContainer } from './ReportTabsContainer'

type ReportFormContainerProps = {
  report: ReportDetailDto
}

export function ReportFormContainer({ report }: ReportFormContainerProps) {
  const title = (
    <>
      <Text variant="h2">{reportText.heroTitle}</Text>
      <Text marginBottom={4}>{reportText.heroDescription}</Text>
    </>
  )

  return (
    <Box
      background="white"
      paddingX={[4, 8, 14]}
      paddingY={[4, 6, 8]}
      borderRadius="large"
    >
      <Stack space={[2]}>
        <Breadcrumbs
          items={[
            { title: reportText.breadcrumbHome, href: '/' },
            { title: reportText.breadcrumbOverview, href: '/yfirlit' },
            { title: reportText.heroTitle, href: `/yfirlit/${report.id}` },
          ]}
        />
        {title}
        <Stack space={1}>
          <Text variant="eyebrow" color="purple400">
            {formatDateIS(report.createdAt)}
          </Text>
          <Text variant="h3" marginBottom={4}>
            {report.company.name}
          </Text>
        </Stack>
      </Stack>
      <ReportTabsContainer report={report} />
    </Box>
  )
}
