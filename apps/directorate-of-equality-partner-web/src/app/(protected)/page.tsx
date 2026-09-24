import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Divider } from '@dmr.is/ui/components/island-is/Divider'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { ActorPanel } from '../../components/overview/ActorPanel'
import { CompanyPanel } from '../../components/overview/CompanyPanel'
import { AccessTabs } from '../../containers/AccessTabs'
import { companyText, layoutText } from '../../lib/text'
import { trpc } from '../../lib/trpc/client/server'

// Awaited rather than prefetched: these are plain server-rendered values the
// client never refetches, so there is nothing to hydrate. The tab contents
// fetch their own lists, since those change under the user's own actions.
export default async function OverviewPage() {
  const [identity, company, partnerClient] = await Promise.all([
    fetchQueryWithHandler(trpc.identity.get.queryOptions()),
    fetchQueryWithHandler(trpc.company.get.queryOptions()),
    fetchQueryWithHandler(trpc.partnerClient.get.queryOptions()),
  ])

  return (
    <Box
      background="purple100"
      paddingY={[2, 2, 6]}
      style={{ minHeight: 'calc(100dvh - 112px)' }}
    >
      <GridContainer>
        <GridRow>
          <GridColumn
            span={['12/12', '12/12', '12/12', '10/12']}
            offset={['0', '0', '0', '1/12']}
          >
            <Box
              background="white"
              paddingX={[3, 4, 4, 8]}
              paddingY={[4, 4, 4, 6]}
              borderRadius="large"
            >
              <Stack space={5}>
                <Stack space={2}>
                  <Text variant="h2" as="h1">
                    {layoutText.pageTitle}
                  </Text>
                  <Text variant="intro">{layoutText.pageIntro}</Text>
                </Stack>

                {company ? (
                  <CompanyPanel company={company} />
                ) : (
                  <AlertMessage
                    type="warning"
                    title={companyText.notInRegisterTitle}
                    message={companyText.notInRegisterMessage}
                  />
                )}

                <Divider />

                <ActorPanel
                  actor={identity.actor}
                  companyName={company?.name ?? null}
                  companyNationalId={identity.companyNationalId}
                />

                {(company || partnerClient) && (
                  <>
                    <Divider />
                    <AccessTabs
                      companyName={company?.name ?? null}
                      partnerClient={partnerClient}
                    />
                  </>
                )}
              </Stack>
            </Box>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
