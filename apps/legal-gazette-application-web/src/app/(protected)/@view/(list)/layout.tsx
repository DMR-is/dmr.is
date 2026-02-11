import { LGFooter } from '@dmr.is/ui/components/Footer/LGFooter'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { UmsoknirHero } from '../../../../components/hero/UmsoknirHero'

export default function ViewListLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Stack space={2}>
        <UmsoknirHero />
        {children}
      </Stack>
      <LGFooter site="applications" />
    </>
  )
}
