import dynamic from 'next/dynamic'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'

import {
  Button,
  Drawer,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Tabs,
} from '@island.is/island-ui/core'

import { Route, Routes } from '../../lib/constants'
import { MOCK_FILTERS } from '../../lib/mocks'
import { routesToBreadcrumbs } from '../../lib/utils'

const CaseFilters = dynamic(
  () => import('../../components/CaseFilters/CaseFilters'),
)

const CaseTable = dynamic(() => import('../../components/Tables/CaseTable'))

export default function Ritstjorn() {
  const breadcrumbs = routesToBreadcrumbs(Routes, Route.RITSTJORN)

  return (
    <>
      <Hero
        breadcrumbs={{ items: breadcrumbs }}
        variant="small"
        title="Vinnslusvæði Lögbirtingablaðs"
        description="Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
        image={{
          src: '/assets/banner-image-small-2.svg',
          alt: 'Image alt',
        }}
      >
        <Stack space={2}>
          <CaseFilters filters={MOCK_FILTERS} />
          <Drawer
            ariaLabel="Stofna auglýsingu"
            baseId="create-case-drawer"
            disclosure={
              <Button variant="utility" icon="document" iconType="outline">
                Stofna auglýsingu
              </Button>
            }
          >
            <h2>Hello</h2>
          </Drawer>
        </Stack>
      </Hero>
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
            <Tabs
              contentBackground="white"
              label="Ritstjórn"
              tabs={[
                {
                  label: 'Innsendar',
                  content: <CaseTable />,
                },
                {
                  label: 'Á leið í útgáfu',
                  content: 'Á leið í útgáfu',
                },
                { label: 'Yfirlit', content: 'Yfirlit' },
              ]}
            />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </>
  )
}
