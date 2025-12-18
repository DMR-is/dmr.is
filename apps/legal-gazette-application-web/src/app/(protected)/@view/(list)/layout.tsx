import { Footer } from '@dmr.is/ui/components/Footer/Footer'
import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { UmsoknirHero } from '../../../../components/hero/UmsoknirHero'
import { TabNav } from '../../../../components/tabs/TabNav'

export default function ViewListLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Stack space={4}>
        <UmsoknirHero />
        <GridContainer>
          <GridRow>
            <GridColumn
              span={['12/12', '10/12', '10/12', '10/12']}
              offset={['0', '1/12', '1/12', '1/12']}
            >
              <TabNav />
            </GridColumn>
          </GridRow>
        </GridContainer>
        {children}
      </Stack>
      <Footer site="applications" />
    </>
  )
}
