'use client'

import { usePathname } from 'next/navigation'

import { Button, Inline, LinkV2, Text } from '@dmr.is/ui/components/island-is'

type Tab = {
  id: string
  label: string
  href: string
}

const tabs: Tab[] = [
  { id: 'applications', label: 'Mínar auglýsingar', href: '/auglysingar' },
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
    <Inline justifyContent={'spaceBetween'}>
      {activeTab === 'applications' ? (
        <>
          <Text variant="h3">Mínar auglýsingar</Text>
          <LinkV2 href="/eldriauglysingar">
            <Button variant="text">Eldri auglýsingar</Button>
          </LinkV2>
        </>
      ) : (
        <>
          <Text variant="h3">Eldri auglýsingar</Text>
          <LinkV2 href="/">
            <Button variant="text">Mínar auglýsingar</Button>
          </LinkV2>
        </>
      )}
    </Inline>
    // <Box className={styles.tabsTablist}>
    //   {tabs.map((tab) => {
    //     const isActive = activeTab === tab.id
    //     return (
    //       <Link key={tab.id} href={tab.href} className={styles.tabLink}>
    //         <Box className={styles.tabsTab({ active: isActive })}>
    //           <Text
    //             variant="h4"
    //             fontWeight={isActive ? 'semiBold' : 'regular'}
    //             color={isActive ? 'blue400' : 'dark400'}
    //           >
    //             {tab.label}
    //           </Text>
    //         </Box>
    //       </Link>
    //     )
    //   })}
    // </Box>
  )
}
