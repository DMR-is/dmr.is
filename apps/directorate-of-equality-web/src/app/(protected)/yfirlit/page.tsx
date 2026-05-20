import { Suspense } from 'react'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SearchDashboardLoading } from '@dmr.is/ui/components/SearchDashboard/SearchDashboardLoading'

import { ReportsContainer } from '../../../containers/reports/ReportsContainer'
import { overviewText } from '../../../lib/text'

export default function MalPage() {
  return (
    <Box height="full">
      <Hero
        title={overviewText.heroTitle}
        description={overviewText.heroDescription}
        image={{ src: '/assets/banner-image.svg', alt: overviewText.imageAlt }}
        breadcrumbs={{
          items: [
            { title: overviewText.breadcrumbHome, href: '/' },
            { title: overviewText.breadcrumbOverview },
          ],
        }}
        variant="default"
        reverse
        imageSpan={'3/12'}
        withOffset={false}
      />
      <Box background="blue100" paddingY={5} height="full">
        <Suspense fallback={<SearchDashboardLoading />}>
          <ReportsContainer />
        </Suspense>
      </Box>
    </Box>
  )
}
