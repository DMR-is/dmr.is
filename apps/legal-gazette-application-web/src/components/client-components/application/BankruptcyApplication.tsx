'use client'

import { useState } from 'react'
import useSWRMutation from 'swr/mutation'

import { Input, Stack, toast } from '@island.is/island-ui/core'

import {
  BankruptcyApplicationDto,
  UpdateBankruptcyApplicationDto,
} from '../../../gen/fetch'
import { updateBankruptcyApplication } from '../../../lib/fetchers'

type Props = {
  initalState: BankruptcyApplicationDto
}

export const BankruptcyApplication = ({ initalState }: Props) => {
  const [updateState, setUpdateState] =
    useState<UpdateBankruptcyApplicationDto>({})

  const { trigger } = useSWRMutation(
    ['updateApplication', updateState],
    ([_key, args]) => {
      const { caseId, id } = initalState
      return updateBankruptcyApplication({
        applicationId: id as string,
        caseId: caseId,
        updateBankruptcyApplicationDto: {
          ...args,
        },
      })
    },
    {
      onSuccess: () => {
        toast.success('Umsókn vistuð', {
          toastId: 'update-application-success',
        })
      },
      onError: (error) => {
        toast.error(`Villa við að vista umsókn: ${error}`, {
          toastId: 'update-application-error',
        })
      },
    },
  )

  return (
    <Stack space={2}>
      <Input
        size="sm"
        label="Auka texti"
        name="addtional-text"
        defaultValue={initalState?.additionalText ?? undefined}
        onChange={(e) => setUpdateState({ additionalText: e.target.value })}
        onBlur={() => trigger()}
      />
    </Stack>
  )
}
