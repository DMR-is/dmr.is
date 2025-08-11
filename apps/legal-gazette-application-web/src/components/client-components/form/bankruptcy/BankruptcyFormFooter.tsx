'use client'

import { Button, Inline, LinkV2 } from '@island.is/island-ui/core'

import { PageRoutes } from '../../../../lib/constants'

export const BankruptcyFormFooter = () => {
  return (
    <Inline justifyContent="spaceBetween" alignY="center">
      <LinkV2 href={PageRoutes.APPLICATIONS}>
        <Button preTextIcon="arrowBack" variant="ghost">
          Yfirlit
        </Button>
      </LinkV2>
      <button type="submit">
        <Button as="div" icon="arrowForward">
          Senda til birtingar
        </Button>
      </button>
    </Inline>
  )
}
