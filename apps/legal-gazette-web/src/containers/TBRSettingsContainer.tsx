'use client'

import { parseAsInteger } from 'next-usequerystate'

import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import Hero from '@dmr.is/ui/components/Hero/Hero'
import {
  GridColumn,
  GridContainer,
  GridRow,
  Pagination,
  Text,
} from '@dmr.is/ui/components/island-is'

import { Stack } from '@island.is/island-ui/core'

import { TBRSettingsFilters } from '../components/tbr-settings/TBRSettingsFilters'
import { TBRSettingsList } from '../components/tbr-settings/TBRSettingsList'
import { useTRPC } from '../lib/trpc/client/trpc'

export const TBRSettingsContainer = () => {
  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(''),
    activeOnly: parseAsBoolean.withDefault(false),
  })

  const trpc = useTRPC()
  const { data } = useQuery(
    trpc.getTbrSettings.queryOptions({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      search: queryParams.search,
      activeOnly: queryParams.activeOnly,
    }),
  )

  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]} marginBottom={[2, 3]}>
        <GridColumn paddingTop={[2, 3]} span="12/12">
          <Hero
            title="Stillingar fyrir stórnotendur Lögbirtingablaðsins"
            variant="small"
            image={{ src: '/assets/banner-small-image.svg', alt: '' }}
            centerImage={true}
          >
            <Text>
              Hér er hægt að sjá notendur sem eru í áskrift hjá TBR. Notendur í
              áskrift fá reglulega greiðlur en ekki stakar greiðslur. Hægt er að
              slökkva og kveikja á áskriftarleið ásamt því að bæta við og
              fjarlæga notendur.
            </Text>
          </Hero>
        </GridColumn>
        <GridColumn span="12/12">
          <Stack space={[1, 2]}>
            <TBRSettingsFilters />
            <TBRSettingsList items={data?.items || []} />
            {data?.paging && (
              <Pagination
                page={data.paging.page}
                totalItems={data.paging.totalItems}
                itemsPerPage={10}
                totalPages={data.paging.totalPages}
                renderLink={(page, className, children) => (
                  <button
                    className={className}
                    onClick={() => setQueryParams({ page })}
                  >
                    {children}
                  </button>
                )}
              />
            )}
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
