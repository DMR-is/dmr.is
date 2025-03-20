import dynamic from 'next/dynamic'
import { Hero } from '@dmr.is/ui'

import { GridColumn, GridContainer, GridRow } from '@island.is/island-ui/core'

import { Route, Routes } from '../../lib/constants'
import { MOCK_FILTERS } from '../../lib/mocks'
import { routesToBreadcrumbs } from '../../lib/utils'

const CaseFilters = dynamic(() =>
  import('../../components/CaseFilters/CaseFilters'),
)

const RitstjornTable = dynamic(() =>
  import('../../components/Tables/RitstjornTable'),
)

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
        <CaseFilters filters={MOCK_FILTERS} />
      </Hero>
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
            <RitstjornTable />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </>
  )
}
