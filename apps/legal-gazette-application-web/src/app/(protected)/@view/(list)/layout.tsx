import { LGFooter } from '@dmr.is/ui/components/Footer/LGFooter'
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
              span={['12/12', '12/12', '12/12', '10/12']}
              offset={['0', '0', '0', '1/12']}
            >
              <TabNav />
            </GridColumn>
          </GridRow>

          {children}
        </GridContainer>
      </Stack>
      <LGFooter site="applications" />
    </>
  )
}
