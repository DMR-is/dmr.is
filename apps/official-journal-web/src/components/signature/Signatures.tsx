import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { SignatureDislay } from '../advert-display/SignatureDisplay'
import { SignatureRecord } from './Signature'

import { useMutation } from '@tanstack/react-query'

export const Signatures = () => {
  const { currentCase, canEdit, refetchSignature, handleOptimisticUpdate } =
    useCaseContext()
  const trpc = useTRPC()

  const { signature } = currentCase

  const addSignatureRecordMutation = useMutation(
    trpc.createSignatureRecord.mutationOptions({
      onSuccess: () => {
        toast.success('Auka undirritun bætt við')
        refetchSignature()
      },
      onError: () => {
        toast.error('Ekki tóskt að bæta við undirritun')
      },
    }),
  )

  const updateSignatureDisplayMutation = useMutation(
    trpc.updateSignatureDisplay.mutationOptions({
      onSuccess: () => {
        toast.success('Sýning undirritunardags uppfærð')
        refetchSignature()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra sýningu undirritunardags')
      },
    }),
  )

  return (
    <Stack space={4}>
      {!currentCase.isLegacy && (
        <>
          <Stack space={4} dividers>
            {signature.records.map((record) => (
              <SignatureRecord key={record.id} record={record} />
            ))}
          </Stack>
          <Inline justifyContent="flexEnd">
            <Button
              disabled={!canEdit}
              loading={addSignatureRecordMutation.isPending}
              variant="utility"
              icon="add"
              onClick={() =>
                addSignatureRecordMutation.mutate({
                  signatureId: currentCase.signature.id,
                })
              }
            >
              Bæta við undirritunar kafla
            </Button>
          </Inline>
          <SignatureDislay />
        </>
      )}
      <Inline alignY="center" space={1}>
        <Checkbox
          disabled={!canEdit}
          checked={currentCase.hideSignatureDate || false}
          label="Fela undirritunardag í birtingu auglýsingar"
          onChange={(e) => {
            handleOptimisticUpdate(
              { ...currentCase, hideSignatureDate: e.target.checked },
              () =>
                updateSignatureDisplayMutation.mutateAsync({
                  id: currentCase.id,
                  hide: e.target.checked,
                }),
            )
          }}
        />
      </Inline>
    </Stack>
  )
}
