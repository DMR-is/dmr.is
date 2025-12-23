'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Box, Text } from '@island.is/island-ui/core'

import * as styles from './Tabs.css'

type Tab = {
  id: string
  label: string
  href: string
}

const tabs: Tab[] = [
  { id: 'applications', label: 'Mínar auglýsingar', href: '/umsoknir' },
  { id: 'olderAdverts', label: 'Eldri auglýsingar', href: '/eldriauglysingar' },
]

export const TabNav = () => {
  const pathname = usePathname()

  const getActiveTab = () => {
    if (pathname === '/eldriauglysingar') {
      return 'olderAdverts'
    }
    return 'applications'
  }

  const activeTab = getActiveTab()

  return (
    <Box className={styles.tabsTablist}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <Link key={tab.id} href={tab.href} className={styles.tabLink}>
            <Box className={styles.tabsTab({ active: isActive })}>
              <Text
                variant="h4"
                fontWeight={isActive ? 'semiBold' : 'regular'}
                color={isActive ? 'blue400' : 'dark400'}
              >
                {tab.label}
              </Text>
            </Box>
          </Link>
        )
      })}
    </Box>
  )
}
