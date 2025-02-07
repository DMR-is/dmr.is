import { Button, Inline, Stack, toast } from '@island.is/island-ui/core'

import { useUpdateSignature } from '../../hooks/api'
import { useCaseContext } from '../../hooks/useCaseContext'
import { SignatureDislay } from '../advert-display/SignatureDisplay'
import { SignatureRecord } from './Signature'

export const Signatures = () => {
  const { currentCase, canEdit, refetchSignature } = useCaseContext()

  const { signature } = currentCase

  const { addSignatureRecord, isAddingSignatureRecord } = useUpdateSignature({
    signatureId: currentCase.signature.id,
    addSignatureRecordOptions: {
      onSuccess: () => {
        toast.success('Auka undirritun bætt við')
        refetchSignature()
      },
      onError: () => {
        toast.error('Ekki tóskt að bæta við undirritun')
      },
    },
  })

  return (
    <Stack space={2}>
      {signature.records.map((record) => (
        <SignatureRecord key={record.id} record={record} />
      ))}
      <Inline justifyContent="flexEnd">
        <Button
          disabled={!canEdit}
          loading={isAddingSignatureRecord}
          variant="utility"
          icon="add"
          onClick={() => addSignatureRecord()}
        >
          Bæta við auka undirritun
        </Button>
      </Inline>
      <SignatureDislay />
    </Stack>
  )
}
