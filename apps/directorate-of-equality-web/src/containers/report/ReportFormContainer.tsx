import Link from 'next/link'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Breadcrumbs } from '@dmr.is/ui/components/island-is/Breadcrumbs'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import type { ReportDetailDto } from '../../gen/fetch'
import { formatDateIS, NAV_PATHS } from '../../lib/constants'
import { headerText, reportText, sharedText } from '../../lib/text'
import { ReportTabsContainer } from './ReportTabsContainer'

type ReportFormContainerProps = {
  report: ReportDetailDto
}

export function ReportFormContainer({ report }: ReportFormContainerProps) {
  return (
    <Box
      background="white"
      paddingX={[4, 4, 4, 8, 14]}
      paddingY={[4, 4, 4, 8]}
      borderRadius="large"
    >
      <Stack space={[2]}>
        <Breadcrumbs
          items={[
            {
              title: headerText.brand,
              href: NAV_PATHS.frontpage.href,
            },
            {
              title: sharedText.admin,
              href: NAV_PATHS.heildarlisti.href,
            },
            { title: reportText.heroTitle },
          ]}
        />
        <Stack space={1}>
          <Text variant="eyebrow" color="purple400">
            {formatDateIS(report.createdAt)}
          </Text>
          <Box marginBottom={4}>
            <Link
              href={`${NAV_PATHS.fyrirtaeki.href}/${report.company.companyId}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Text variant="h3">{report.company.name}</Text>
              <Icon
                icon="arrowForward"
                type="outline"
                size="medium"
                color="dark400"
              />
            </Link>
          </Box>
        </Stack>
      </Stack>
      <ReportTabsContainer report={report} />
    </Box>
  )
}
