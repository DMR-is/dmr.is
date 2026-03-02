'use client'

import { useRouter } from 'next/navigation'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { CasePublishingList } from '../../../../components/case-publishing-list/CasePublishingList'
import { Section } from '../../../../components/section/Section'
import { Case } from '../../../../gen/fetch'
import { Routes } from '../../../../lib/constants'
import { useTRPC } from '../../../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  cases: Case[]
  department: string
}

export function ConfirmPublishingClient({ cases, department }: Props) {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate, error, isPending } = useMutation(
    trpc.publishCases.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [['getCasesWithDepartmentCount']],
        })
        queryClient.invalidateQueries({
          queryKey: [['getCasesWithPublicationNumber']],
        })
        router.push(
          `${Routes.PublishingOverview}?department=${department}&success=true`,
        )
      },
    }),
  )

  const handleConfirm = () => {
    const hasPublicationDateToday = cases.every(
      (c) =>
        new Date(c.requestedPublicationDate).toDateString() ===
        new Date().toDateString(),
    )

    if (!hasPublicationDateToday) {
      const didConfirm = confirm(
        'Ertu viss um að þú viljir gefa út mál sem ekki er með umbeðinn birtingar dag í dag?',
      )

      if (didConfirm) {
        mutate({ caseIds: cases.map((c) => c.id) })
      }

      return
    }

    mutate({ caseIds: cases.map((c) => c.id) })
  }

  return (
    <Section paddingTop="default">
      <GridContainer>
        <GridRow>
          <GridColumn
            span={['12/12', '12/12', '12/12', '7/12']}
            offset={['0', '0', '0', '1/12']}
          >
            <Stack space={[2, 2, 3]}>
              {error ? (
                <AlertMessage
                  type="error"
                  title="Ekki tókst að gefa út mál"
                  message="Villa kom upp við útáfu mála, reyndu aftur síðar."
                />
              ) : (
                <AlertMessage
                  type="warning"
                  title="Mál til útgáfu"
                  message="Vinsamlegast farðu yfir og staðfestu eftirfarandi lista mála til birtingar."
                />
              )}
              <CasePublishingList cases={cases} />
              <Box
                marginTop={3}
                display="flex"
                flexWrap="wrap"
                justifyContent="spaceBetween"
              >
                <LinkV2
                  href={`${Routes.PublishingOverview}?department=${department}`}
                >
                  <Button variant="ghost">Tilbaka í útgáfu mála</Button>
                </LinkV2>
                <Button
                  onClick={() => handleConfirm()}
                  disabled={isPending}
                  loading={isPending}
                  icon="arrowForward"
                >
                  Gefa út öll mál
                </Button>
              </Box>
            </Stack>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}
