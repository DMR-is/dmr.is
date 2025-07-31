'use client'

import { LinkCard } from '@dmr.is/ui/components/LinkCard/LinkCard'

import { GridColumn, GridRow } from '@island.is/island-ui/core'

import { PageRoutes } from '../../../lib/constants'

export const ApplicationTypes = () => {
  return (
    <GridRow>
      <GridColumn
        span={['12/12', '5/12']}
        offset={['0', '1/12']}
        paddingBottom={[2, 0]}
      >
        <LinkCard
          href={PageRoutes.APPLICATION_THROTABU}
          title="Innköllun þrotabús"
          description="Stofna umsókn um innköllun þrotabús."
          image={{
            src: '/assets/ritstjorn-image.svg',
          }}
        />
      </GridColumn>
      <GridColumn span={['12/12', '5/12']} paddingBottom={[2, 0]}>
        <LinkCard
          href={PageRoutes.APPLICATION_DANARBU}
          title="Innköllun dánarbús"
          description="Stofna umsókn um dánarbú."
          image={{
            src: '/assets/utgafa-image.svg',
          }}
        />
      </GridColumn>
    </GridRow>
  )
}
