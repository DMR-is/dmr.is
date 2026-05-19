import { Suspense } from 'react'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SearchDashboardLoading } from '@dmr.is/ui/components/SearchDashboard/SearchDashboardLoading'

import { TabsContainer } from '../../../components/list-page/tabs/TabsContainer'
import { overviewText } from '../../../lib/text'

export default function MalPage() {
  return (
    <>
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
      <Box background="blue100" paddingY={5}>
        <Suspense fallback={<SearchDashboardLoading />}>
          <TabsContainer />
        </Suspense>
      </Box>
    </>
  )
}
