'use client'

import { useRouter } from 'next/navigation'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

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
      <Text marginBottom={2}>
        Hér getur þú valið um hverskonar auglýsingu þú vilt senda inn til
        Lögbirtingablaðsins:
      </Text>
      <Inline space={2}>
        <Button
          variant="utility"
          icon="fileTrayFull"
          iconType="outline"
          title="Búa til almennna auglýsingu"
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
          title="Búa til innköllun þrotabús"
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
          title="Búa til innköllun dánarbús"
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
