'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Breadcrumbs } from '@dmr.is/ui/components/island-is/Breadcrumbs'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { CompanyTimeline } from '../../components/company/company-timeline/CompanyTimeline'
import { CompanyDto } from '../../gen/fetch'
import { NAV_PATHS } from '../../lib/constants'
import { companiesText, headerText } from '../../lib/text'
import { CompanyTabsContainer } from './CompanyTabsContainer'

const t = companiesText.detailView

type CompanyFormContainerProps = {
  company: CompanyDto
}

export function CompanyFormContainer({ company }: CompanyFormContainerProps) {
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
            { title: headerText.brand, href: NAV_PATHS.frontpage.href },
            {
              title: NAV_PATHS.fyrirtaeki.title,
              href: NAV_PATHS.fyrirtaeki.href,
            },
            { title: company.name },
          ]}
        />
        <Stack space={1}>
          <Text variant="eyebrow" color="purple400">
            {t.heading}
          </Text>
          <Text variant="h3" marginBottom={4}>
            {company.name}
          </Text>
        </Stack>
      </Stack>
      <CompanyTabsContainer company={company} />
      <Box marginTop={6}>
        <CompanyTimeline />
      </Box>
    </Box>
  )
}
