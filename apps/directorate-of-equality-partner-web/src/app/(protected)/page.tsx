import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Divider } from '@dmr.is/ui/components/island-is/Divider'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { trpc } from '../../lib/trpc/client/server'

// Awaited (not `prefetch`ed) on purpose - this is a plain server-rendered
// value with no client-side refetch, so there is nothing for a client
// component to hydrate and no useSuspenseQuery/useQuery mismatch to create.
export default async function CompanyOverviewPage() {
  const identity = await fetchQueryWithHandler(
    trpc.getCompanyIdentity.queryOptions(),
  )

  return (
    <GridContainer>
      <GridRow marginTop={[3, 4]}>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <Stack space={3}>
            <Text variant="h2">Yfirlit fyrirtækis</Text>

            <Stack space={1}>
              <Text variant="eyebrow">Fyrirtæki</Text>
              <Text variant="intro">
                Kennitala: {identity.companyNationalId ?? 'Óþekkt'}
              </Text>
            </Stack>

            {identity.actor && (
              <Stack space={1}>
                <Text variant="eyebrow">Innskráður umboðsaðili</Text>
                <Text variant="intro">
                  {identity.actor.name} ({identity.actor.nationalId})
                </Text>
              </Stack>
            )}

            <Divider />

            <Box
              background="blue100"
              borderRadius="large"
              padding={[3, 4]}
              display="flex"
              flexDirection="column"
              rowGap={2}
            >
              <Box display="flex" alignItems="center" columnGap={2}>
                <Text variant="h4">API-lyklar</Text>
                <Tag variant="blue" outlined>
                  Væntanlegt
                </Tag>
              </Box>
              <Text>
                Hér mun fyrirtækið geta gefið út, endurnýjað og afturkallað
                API-lykla til að tengja launakerfi sitt við Jafnréttisstofu.
                Þessi virkni er ekki tilbúin ennþá.
              </Text>
            </Box>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
