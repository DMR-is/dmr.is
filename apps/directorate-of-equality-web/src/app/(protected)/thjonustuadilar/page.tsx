import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'

import { PartnerClientsContainer } from '../../../containers/partner-clients/PartnerClientsContainer'
import { requireNavAccess } from '../../../lib/auth/requireNavAccess'
import { NAV_PATHS } from '../../../lib/constants'
import { headerText, partnerClientsText, sharedText } from '../../../lib/text'

export default async function ThjonustuadilarPage() {
  await requireNavAccess(NAV_PATHS.thjonustuadilar)

  return (
    <Box height="full">
      <Hero
        title={partnerClientsText.heroTitle}
        description={partnerClientsText.heroDescription}
        image={{
          src: '/assets/shaking-hands.svg',
          alt: partnerClientsText.heroTitle,
        }}
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
        <PartnerClientsContainer />
      </Box>
    </Box>
  )
}
