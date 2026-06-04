import { Suspense } from 'react'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SearchDashboardLoading } from '@dmr.is/ui/components/SearchDashboard/SearchDashboardLoading'

import { CompaniesContainer } from '../../../containers/companies/CompaniesContainer'
import { NAV_PATHS } from '../../../lib/constants'
import { companiesText, headerText, sharedText } from '../../../lib/text'

export default async function FyrirtaekiPage() {
  return (
    <Box height="full">
      <Hero
        title={companiesText.heading}
        description={companiesText.heroDescription}
        image={{ src: '/assets/banner-image.svg', alt: companiesText.heading }}
        breadcrumbs={{
          items: [
            {
              title: headerText.brand,
              href: NAV_PATHS.frontpage.href,
            },
            { title: sharedText.admin },
          ],
        }}
        variant="default"
        reverse
        imageSpan={'3/12'}
        withOffset={false}
      />
      <Box background="blue100" paddingY={5} style={{ minHeight: '100%' }}>
        <Suspense fallback={<SearchDashboardLoading />}>
          <CompaniesContainer />
        </Suspense>
      </Box>
    </Box>
  )
}
