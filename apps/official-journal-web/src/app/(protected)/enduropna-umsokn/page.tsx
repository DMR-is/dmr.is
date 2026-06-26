'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { Section } from '../../../components/section/Section'
import { useTRPC } from '../../../lib/trpc/client/trpc'

import { useMutation } from '@tanstack/react-query'

export default function ReopenApplicationPage() {
  const trpc = useTRPC()
  const [applicationId, setApplicationId] = useState<string>('')

  const reopenMutation = useMutation(
    trpc.reopenApplication.mutationOptions({
      onSuccess: () => {
        toast.success('Umsókn enduropnuð', {
          toastId: 'reopenApplication',
        })
      },
      onError: () => {
        toast.error('Ekki tókst að enduropna umsókn', {
          toastId: 'reopenApplication',
        })
      },
    }),
  )

  return (
    <Section paddingTop="content">
      <GridContainer>
        <GridRow>
          <GridColumn
            span={['12/12', '12/12', '12/12', '10/12']}
            offset={['0', '0', '0', '1/12']}
          >
            <Text marginBottom={4}>
              Enduropna umsókn sem sat föst í innsendri stöðu án þess að mál hafi
              verið stofnað (t.d. vegna villu við innsendingu) svo umsækjandi geti
              opnað hana aftur og sent inn að nýju. Aðeins er hægt að enduropna
              umsóknir sem eru í stöðunni innsend. Þetta input tekur við auðkenni
              (UUID) umsóknar.
            </Text>
            <Stack space={2}>
              <Input
                name="application-id"
                type="text"
                label="Auðkenni umsóknar"
                placeholder="a12c3d4e-5f67-8h90-1i23-j45k6l7m8n9o0"
                backgroundColor="white"
                onChange={(e) => {
                  setApplicationId(e.target.value)
                }}
              />
              <Box>
                <Button
                  variant="ghost"
                  size="small"
                  icon="arrowForward"
                  iconType="outline"
                  type="button"
                  disabled={!applicationId}
                  loading={reopenMutation.isPending}
                  onClick={() => reopenMutation.mutate({ id: applicationId })}
                >
                  Enduropna umsókn
                </Button>
              </Box>
            </Stack>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}
