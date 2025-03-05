import { DataTable, Hero } from '@dmr.is/ui'

import { GridColumn, GridContainer, GridRow } from '@island.is/island-ui/core'

import { Route, Routes } from '../../lib/constants'
import { routesToBreadcrumbs } from '../../lib/utils'

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
      />
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
            <DataTable
              columns={
                [
                  {
                    field: 'birting',
                    children: 'Birting',
                  },
                  {
                    field: 'skraning',
                    children: 'Skráning',
                  },
                  {
                    field: 'flokkur',
                    children: 'Flokkur',
                  },
                  {
                    field: 'efni',
                    fluid: true,
                    children: 'Efni',
                  },
                ] as const
              }
              rows={[
                {
                  birting: '2021-09-01',
                  skraning: '2021-09-01',
                  flokkur: 'Lög',
                  efni: 'Innköllun vegna skipta skv. lögum um skráningu raunverulegs eiganda nr. 82/2019. Innköllun vegna skipta skv. lögum um skráningu raunverulegs eiganda nr. 82/2019.',
                },
              ]}
            />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </>
  )
}
