import { Suspense } from 'react'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SearchDashboardLoading } from '@dmr.is/ui/components/SearchDashboard/SearchDashboardLoading'

import { ReportsContainer } from '../../../containers/reports/ReportsContainer'
import { headerText, overviewText, sharedText } from '../../../lib/text'

export default function MalPage() {
  return (
    <Box height="full">
      <Hero
        title={overviewText.heroTitle}
        description={overviewText.heroDescription}
        image={{ src: '/assets/banner-image.svg', alt: overviewText.imageAlt }}
        breadcrumbs={{
          items: [
            { title: headerText.brand, href: '/' },
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
          <ReportsContainer />
        </Suspense>
      </Box>
    </Box>
  )
}
