import { FocusableBox, useBreakpoint } from '@island.is/island-ui/core'

import skjaldarmerki from './images/skjaldarmerki.svg'

export const HeaderLogo = () => {
  const { lg } = useBreakpoint()

  return (
    <FocusableBox href={'/'} data-testid="link-back-home">
      <img
        src={skjaldarmerki}
        alt="Skjaldarmerki"
        width={lg ? 64 : 50}
        height={lg ? 40 : 32}
      />
    </FocusableBox>
  )
}
