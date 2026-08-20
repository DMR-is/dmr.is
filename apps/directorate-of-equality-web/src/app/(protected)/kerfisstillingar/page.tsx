import { Suspense } from 'react'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SearchDashboardLoading } from '@dmr.is/ui/components/SearchDashboard/SearchDashboardLoading'

import { SystemSettingsContainer } from '../../../containers/system-settings/SystemSettingsContainer'
import { requireNavAccess } from '../../../lib/auth/requireNavAccess'
import { NAV_PATHS } from '../../../lib/constants'
import { headerText, systemSettingsText } from '../../../lib/text'

export default async function KerfisstillingarPage() {
  await requireNavAccess(NAV_PATHS.kerfisstillingar)

  return (
    <Box height="full">
      <Hero
        title={systemSettingsText.heroTitle}
        description={systemSettingsText.heroDescription}
        image={{
          src: '/assets/image-with-text-1.svg',
          alt: systemSettingsText.heroImageAlt,
        }}
        breadcrumbs={{
          items: [
            {
              title: headerText.brand,
              href: NAV_PATHS.frontpage.href,
            },
            { title: NAV_PATHS.kerfisstillingar.title },
          ],
        }}
        variant="default"
        reverse
        imageSpan={'3/12'}
        withOffset={false}
      />
      <Box background="blue100" paddingY={5} style={{ minHeight: '100%' }}>
        <Suspense fallback={<SearchDashboardLoading />}>
          <SystemSettingsContainer />
        </Suspense>
      </Box>
    </Box>
  )
}
