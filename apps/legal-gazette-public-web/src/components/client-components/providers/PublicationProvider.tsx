'use client'

import { usePathname } from 'next/navigation'

type Props = {
  children: React.ReactNode
}

export const PublicationProvider = ({ children }: Props) => {
  const path = usePathname()

  // check if the path matches this pattern /auglysingar/id/:version
  console.log(path)

  return <>{children}</>
}
