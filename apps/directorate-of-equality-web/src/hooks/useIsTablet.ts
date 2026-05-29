import { useEffect, useState } from 'react'

import { theme } from '@island.is/island-ui/theme'

export const useIsTablet = () => {
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const check = () => setIsTablet(window.innerWidth < theme.breakpoints.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return { isTablet }
}

export default useIsTablet
