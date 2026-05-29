import { useEffect, useState } from 'react'

import { theme } from '@island.is/island-ui/theme'

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < theme.breakpoints.md)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return { isMobile }
}

export default useIsMobile
