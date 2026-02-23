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

export default function AdvertPublishRegulationPage() {
  const trpc = useTRPC()
  const [advertId, setAdvertId] = useState<string>('')

  const publishMutation = useMutation(
    trpc.publishAdvertRegulation.mutationOptions({
      onSuccess: () => {
        toast.success('Reglugerð send í ritstjórnarkerfi reglugerða', {
          toastId: 'publishRegulation',
        })
      },
      onError: () => {
        toast.error(
          'Ekki tókst að senda reglugerð í ritstjórnarkerfi reglugerða',
          {
            toastId: 'publishRegulation',
          },
        )
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
              Senda reglugerð í ritstjórnarkerfi reglugerða. Þetta input tekur
              við id auglýsingar.
            </Text>
            <Stack space={2}>
              <Input
                name="advert-id"
                type="text"
                label="Auðkenni auglýsingar"
                placeholder="123456"
                backgroundColor="white"
                onChange={(e) => {
                  setAdvertId(e.target.value)
                }}
              />
              <Box>
                <Button
                  variant="ghost"
                  size="small"
                  icon="arrowForward"
                  iconType="outline"
                  type="button"
                  loading={publishMutation.isPending}
                  onClick={() =>
                    publishMutation.mutate({ id: advertId })
                  }
                >
                  Senda reglugerð
                </Button>
              </Box>
            </Stack>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}
