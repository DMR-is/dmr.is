'use client'

import { HeaderNoAuth } from '@dmr.is/ui/components/Header/HeaderNoAuth'

type Props = React.ComponentProps<typeof HeaderNoAuth>

export const Header = async (props: Props) => {
  return <HeaderNoAuth {...props} />
}
