'use client'

import { useRouter } from 'next/navigation'

import { Box, Inline, Text, toast } from '@dmr.is/ui/components/island-is'

import { Button } from '@island.is/island-ui/core'

import {
  ApplicationTypeEnum,
  CreateApplicationApplicationTypeEnum,
} from '../../gen/fetch'
import { PageRoutes } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'
export const CreateApplication = () => {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate: createApplication } = useMutation(
    trpc.createApplication.mutationOptions({
      onMutate: () => {
        queryClient.invalidateQueries(trpc.getApplications.queryFilter())
      },
      onSuccess: (data) => {
        if (data.type === ApplicationTypeEnum.RECALLBANKRUPTCY) {
          router.push(`${PageRoutes.APPLICATION_THROTABU}/${data.id}`)
        }

        if (data.type === ApplicationTypeEnum.RECALLDECEASED) {
          router.push(`${PageRoutes.APPLICATION_DANARBU}/${data.id}`)
        }

        if (data.type === ApplicationTypeEnum.COMMON) {
          router.push(`${PageRoutes.APPLICATION_COMMON}/${data.id}`)
        }

        router.refresh()
      },
      onError: (error) => {
        toast.error(
          error?.message ||
            'Ekki tókst að stofna auglýsingu. Vinsamlegast reyndu aftur síðar.',
          {
            toastId: 'createApplicationError',
          },
        )
      },
    }),
  )

  return (
    <Box marginTop={2}>
      <Inline space={2}>
        <Button
          variant="utility"
          icon="fileTrayFull"
          iconType="outline"
          title="Stofna almennna auglýsingu"
          onClick={() =>
            createApplication(CreateApplicationApplicationTypeEnum.COMMON)
          }
        >
          Almenn auglýsing
        </Button>
        <Button
          variant="utility"
          icon="hammer"
          iconType="outline"
          title="Stofna "
          onClick={() =>
            createApplication(
              CreateApplicationApplicationTypeEnum.RECALLBANKRUPTCY,
            )
          }
        >
          Þrotabú
        </Button>
        <Button
          variant="utility"
          icon="homeWithCar"
          iconType="outline"
          onClick={() =>
            createApplication(
              CreateApplicationApplicationTypeEnum.RECALLDECEASED,
            )
          }
        >
          Dánarbú
        </Button>
      </Inline>
    </Box>
  )
}
