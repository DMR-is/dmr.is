import { useRef } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
// TODO: Change import
import { BoxProps } from '@island.is/island-ui/core'

export const Main: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const mainRef = useRef<HTMLDivElement>(null)
  const shouldAddLandmark =
    !mainRef?.current?.querySelectorAll('#main-content').length
  const boxProps: BoxProps = shouldAddLandmark
    ? {
        component: 'main',
        tabIndex: -1,
        outline: 'none',
        id: 'main-content',
      }
    : {}
  return (
    <Box ref={mainRef} {...boxProps}>
      {children}
    </Box>
  )
}
