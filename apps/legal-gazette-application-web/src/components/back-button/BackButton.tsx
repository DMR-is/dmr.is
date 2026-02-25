import { Button } from '@dmr.is/ui/components/island-is/Button'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'

import { PageRoutes } from '../../lib/constants'


type PageRouteStrings = `${PageRoutes}`

type Props = {
  href: PageRouteStrings
}

export const BackButton = ({ href }: Props) => {
  return (
    <LinkV2 href={href}>
      <Button preTextIcon="arrowBack" variant="text" size="small">
        Til baka á forsíðu
      </Button>
    </LinkV2>
  )
}
