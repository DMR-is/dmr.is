import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'

import { WithholdingTaxContainer } from '../../../containers/withholding-tax/WithholdingTaxContainer'
import { requireNavAccess } from '../../../lib/auth/requireNavAccess'
import { NAV_PATHS } from '../../../lib/constants'
import { headerText, withholdingTaxText } from '../../../lib/text'

export default async function SkatturinnPage() {
  await requireNavAccess(NAV_PATHS.skatturinn)

  return (
    <Box height="full">
      <Hero
        title={withholdingTaxText.heroTitle}
        description={withholdingTaxText.heroDescription}
        image={{
          src: '/assets/image-with-text-1.svg',
          alt: withholdingTaxText.heroImageAlt,
        }}
        breadcrumbs={{
          items: [
            {
              title: headerText.brand,
              href: NAV_PATHS.frontpage.href,
            },
            { title: NAV_PATHS.skatturinn.title },
          ],
        }}
        variant="default"
        reverse
        imageSpan={'3/12'}
        withOffset={false}
      />
      <Box background="blue100" paddingY={5} style={{ minHeight: '100%' }}>
        <WithholdingTaxContainer />
      </Box>
    </Box>
  )
}
