import { LGFooter } from '@dmr.is/ui/components/Footer/LGFooter'
import { GridContainer, Stack } from '@dmr.is/ui/components/island-is'

import { UmsoknirHero } from '../../../../components/hero/UmsoknirHero'

export default function ViewListLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Stack space={4}>
        <UmsoknirHero />
        <GridContainer>{children}</GridContainer>
      </Stack>
      <LGFooter site="applications" />
    </>
  )
}
