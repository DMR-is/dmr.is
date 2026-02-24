import { useEffect, useState } from 'react'

import { theme } from '@dmr.is/island-ui-theme'

import { useWindowSize } from './useIsWindowSize'

export const useBreakpoints = () => {
  const { width } = useWindowSize()

  const [breakpoints, setBreakpoints] = useState({
    xs: false,
    sm: false,
    md: false,
    lg: false,
    xl: false,
  })

  const handleSetBreakpoints = (width: number) => {
    // check if we need to update the state
    const tmp = {
      xs: width < theme.breakpoints.sm,
      sm: width < theme.breakpoints.md,
      md: width < theme.breakpoints.lg,
      lg: width < theme.breakpoints.xl,
      xl: width >= theme.breakpoints.xl,
    }

    Object.values(tmp).forEach((value, index) => {
      if (value !== Object.values(breakpoints)[index]) {
        setBreakpoints(tmp)
        return
      }
    })
  }

  useEffect(() => {
    if (!width) return
    handleSetBreakpoints(width)
  }, [width])

  return {
    ...breakpoints,
  }
}

export default useBreakpoints
