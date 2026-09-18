import { Suspense } from 'react'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SearchDashboardLoading } from '@dmr.is/ui/components/SearchDashboard/SearchDashboardLoading'

import { DataExportContainer } from '../../../containers/data-export/DataExportContainer'
import { NAV_PATHS } from '../../../lib/constants'
import { dataExportText, headerText } from '../../../lib/text'

export default async function GagnautdratturPage() {
  return (
    <Box height="full">
      <Hero
        title={dataExportText.heading}
        description={dataExportText.heroDescription}
        image={{
          src: '/assets/keyra-ut-lista-image.svg',
          alt: dataExportText.imageAlt,
        }}
        breadcrumbs={{
          items: [
            { title: headerText.brand, href: NAV_PATHS.frontpage.href },
            { title: NAV_PATHS.gagnautdrattur.title },
          ],
        }}
        variant="default"
        reverse
        imageSpan={'3/12'}
        withOffset={false}
      />
      <Box background="blue100" paddingY={5} style={{ minHeight: '100%' }}>
        <Suspense fallback={<SearchDashboardLoading />}>
          <DataExportContainer />
        </Suspense>
      </Box>
    </Box>
  )
}
