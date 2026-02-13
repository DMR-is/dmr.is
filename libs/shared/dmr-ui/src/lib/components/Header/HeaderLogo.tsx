import Image from 'next/image'

import { useBreakpoint } from '@island.is/island-ui/core/hooks/useBreakpoint'

import { FocusableBox } from '../../island-is/lib/FocusableBox'
import skjaldarmerki from './images/skjaldarmerki.svg'

export const HeaderLogo = () => {
  const { lg } = useBreakpoint()

  return (
    <FocusableBox href={'/'} data-testid="link-back-home">
      <Image
        src={skjaldarmerki}
        alt="Skjaldarmerki"
        width={lg ? 64 : 50}
        height={lg ? 40 : 32}
      />
    </FocusableBox>
  )
}
