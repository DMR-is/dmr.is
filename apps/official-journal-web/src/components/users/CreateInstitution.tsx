'use client'

import { useState } from 'react'
import slugify from 'slugify'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import {
  CreateInstitution as CreateInstitutionDto,
  Institution,
} from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  onSuccess?: (institution?: Institution) => void
}

export const CreateInstitution = ({ onSuccess }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [createState, setCreateState] = useState<CreateInstitutionDto>({
    title: '',
    nationalId: '',
  })

  const createInstitutionMutation = useMutation(
    trpc.createInstitution.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.getInstitutions.queryFilter())
        toast.success(`Stofnun ${createState.title} hefur verið stofnuð`)
        onSuccess?.({
          id: 'new-institution',
          title: createState.title,
          slug: slugify(createState.title, { lower: true }),
          nationalId: createState.nationalId,
        })
        setCreateState({
          title: '',
          nationalId: '',
        })
      },
    }),
  )

  return (
    <Stack space={[2, 2, 3]}>
      <Text variant="h3">Ný stofnun</Text>
      <Input
        name="create-institution-title"
        size="sm"
        type="text"
        label="Titill stofnunar"
        placeholder="Sláðu inn heiti stofnunar"
        backgroundColor="blue"
        value={createState.title}
        onChange={(e) =>
          setCreateState({
            ...createState,
            title: e.target.value,
          })
        }
      />
      <Input
        name="create-institution-national-id"
        size="sm"
        type="text"
        label="Kennitala stofnunar"
        placeholder="Sláðu inn kennitölu stofnunar"
        backgroundColor="blue"
        value={createState.nationalId}
        onChange={(e) =>
          setCreateState({
            ...createState,
            nationalId: e.target.value,
          })
        }
      />
      <Input
        name="create-institution-slug"
        size="sm"
        type="text"
        label="Slóð stofnunar"
        backgroundColor="blue"
        value={slugify(createState.title, { lower: true })}
        readOnly
      />
      <Inline space={2} justifyContent="flexEnd">
        <Button
          icon="business"
          iconType="outline"
          loading={createInstitutionMutation.isPending}
          disabled={!createState.title}
          size="small"
          variant="primary"
          onClick={() => createInstitutionMutation.mutate(createState)}
        >
          Stofna stofnun
        </Button>
      </Inline>
    </Stack>
  )
}
