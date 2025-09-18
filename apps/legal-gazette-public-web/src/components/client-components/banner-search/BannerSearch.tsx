'use client'

import { useRouter } from 'next/navigation'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Input,
  Stack,
  Tag,
  Text,
} from '@dmr.is/ui/components/island-is'

import * as styles from './BannerSearch.css'

type QuickLink = {
  title: string
  href: string
  variant?: React.ComponentProps<typeof Tag>['variant']
}

type Props = {
  quickLinks?: QuickLink[]
}

export const BannerSearch = ({ quickLinks }: Props) => {
  const router = useRouter()

  const handleSearch = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const wasEnter = event.key === 'Enter'
    if (!wasEnter) return

    const target = event.target as HTMLInputElement
    const query = target.value

    router.push(`/auglysingar?search=${query}`)
  }

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['1/1', '1/1', '1/1', '9/12', '7/12']}>
          <Stack space={[2, 3, 4]}>
            <Input
              name="search"
              backgroundColor="blue"
              className={styles.searchBox}
              icon={{ name: 'search', type: 'outline' }}
              placeholder="Leita í Lögbirtingablaðinu"
              onKeyDown={(event) => handleSearch(event)}
            />
            {quickLinks && quickLinks.length > 0 && (
              <Stack space={1}>
                <Text variant="eyebrow" color="purple400">
                  Flýtileiðir
                </Text>
                <Inline space={2}>
                  {quickLinks?.map((link, i) => (
                    <Tag key={i} variant={link.variant} href={link.href}>
                      {link.title}
                    </Tag>
                  ))}
                </Inline>
              </Stack>
            )}
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
