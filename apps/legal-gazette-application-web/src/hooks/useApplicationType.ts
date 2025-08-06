import { usePathname } from 'next/navigation'

import { PageRoutes } from '../lib/constants'

type ApplicationType = 'bankruptcy' | 'estate' | 'common' | null

export const useApplicationType = (): ApplicationType => {
  const pathname = usePathname()

  if (pathname.includes(PageRoutes.APPLICATION_THROTABU)) {
    return 'bankruptcy'
  } else if (pathname.includes(PageRoutes.APPLICATION_DANARBU)) {
    return 'estate'
  } else if (pathname.includes('common')) {
    return 'common'
  }

  return null
}
