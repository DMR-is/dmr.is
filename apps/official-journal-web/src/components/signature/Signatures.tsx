import { Stack } from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import { SignatureRecord } from './Signature'

export const Signatures = () => {
  const { currentCase } = useCaseContext()

  const { signature } = currentCase

  return (
    <Stack space={2}>
      {signature.records.map((s, i) => (
        <SignatureRecord key={i} record={s} />
      ))}
    </Stack>
  )
}
