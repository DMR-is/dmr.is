import { useRef } from 'react'

import { Box, type BoxProps } from '@dmr.is/ui/components/island-is/Box'

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
