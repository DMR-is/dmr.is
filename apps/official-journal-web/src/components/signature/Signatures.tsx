import { Stack } from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import { Signature } from './Signature'

export const Signatures = () => {
  const { currentCase } = useCaseContext()

  const { signature } = currentCase

  return (
    <Stack space={2}>
      {signature.records.map((s, i) => (
        <Signature key={i} signature={s} />
      ))}
    </Stack>
  )
}
