'use client'

import {
  Box,
  Button,
  Inline,
  Stack,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { ApplicationTypeEnum } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  applicationId: string
  advertId?: string
  type: ApplicationTypeEnum
  openModal: boolean
  setOpenModal: (open: boolean) => void
  onSuccess?: () => void
}

export const RemoveApplicationAdvert = ({
  applicationId,
  advertId,
  type,
  openModal,
  setOpenModal,
  onSuccess,
}: Props) => {
  const isSingleAdvert = type === ApplicationTypeEnum.COMMON || advertId

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate: deleteApplication } = useMutation(
    trpc.deleteApplication.mutationOptions({
      onSuccess: () => {
        onRemoveSuccess()
      },
      onError: () => {
        onRemoveError()
      },
    }),
  )

  const { mutate: deleteAdvert } = useMutation(
    trpc.deleteAdvertFromApplication.mutationOptions({
      onSuccess: () => {
        onRemoveSuccess()
      },
      onError: () => {
        onRemoveError()
      },
    }),
  )

  const onRemoveSuccess = () => {
    if (onSuccess) onSuccess()
    queryClient.invalidateQueries(trpc.getApplications.queryFilter())
    toast.info(isSingleAdvert ? 'Auglýsing afturkölluð' : 'Mál afturkallað')
    setOpenModal(false)
  }

  const onRemoveError = () => {
    toast.error(
      'Ekki tókst afturkalla ' + (isSingleAdvert ? 'auglýsingu' : 'mál'),
    )
    setOpenModal(false)
  }

  const handleRemove = () => {
    if (advertId && type !== ApplicationTypeEnum.COMMON) {
      deleteAdvert({ applicationId, advertId })
    } else {
      deleteApplication({ applicationId })
    }
  }

  return (
    <Modal
      baseId={applicationId}
      isVisible={openModal}
      toggleClose={() => {
        setTimeout(() => {
          setOpenModal(false)
        }, 300)
      }}
      width="small"
    >
      <Box padding={3} paddingTop={0}>
        <Stack space={2}>
          <Text variant="h2">
            Afturkalla {isSingleAdvert ? 'auglýsingu' : 'mál'}{' '}
          </Text>
          <Text marginBottom={3}>
            Ert þú viss um að þú viljir afturkalla{' '}
            {isSingleAdvert
              ? 'þessa auglýsingu? Þú munt missa allar upplýsingar sem tengjast henni.'
              : 'þetta mál? Þú munt missa allar auglýsingar og upplýsingar sem tengjast því.'}
          </Text>
          <Inline justifyContent="spaceBetween" space={2}>
            <Button
              variant="ghost"
              onClick={() => setOpenModal(false)}
              size="medium"
            >
              Hætta við
            </Button>
            <Button onClick={handleRemove} size="medium">
              Afturkalla
            </Button>
          </Inline>
        </Stack>
      </Box>
    </Modal>
  )
}
