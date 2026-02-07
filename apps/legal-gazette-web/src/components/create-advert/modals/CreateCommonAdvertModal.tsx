'use client'

import { useRouter } from 'next/navigation'

import { useState } from 'react'
import * as z from 'zod'

import { parseZodError } from '@dmr.is/legal-gazette/schemas'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { createAdvertAndCommonApplicationInput } from '../../../lib/inputs'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { Editor } from '../../editor/HTMLEditor'
import { CategorySelect } from '../../selects/CategorySelect'
import { TypeSelect } from '../../selects/TypeSelect'
import { CreateAdvertApplicant } from '../CreateAdvertApplicant'
import { CreateAdvertCommunicationChannel } from '../CreateAdvertCommunicationChannel'
import { CreateAdvertErrors } from '../CreateAdvertErrors'
import { CreateAdvertPublications } from '../CreateAdvertPublications'
import { CreateAdvertSignature } from '../CreateAdvertSignature'
import { SubmitCreateAdvert } from '../SubmitCreateAdvert'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type CreateAdvertAndCommonApplicationBody = z.infer<
  typeof createAdvertAndCommonApplicationInput
>

const initalState: CreateAdvertAndCommonApplicationBody = {
  applicantNationalId: '',
  additionalText: undefined,
  prequisitesAccepted: true,
  communicationChannels: [],
  publishingDates: [],
  signature: {},
  fields: {
    caption: '',
    html: '',
    category: {
      id: '',
      title: '',
      slug: '',
    },
    type: {
      id: '',
      title: '',
      slug: '',
    },
  },
}

export const CreateCommonAdvertModal = () => {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation(
    trpc.createAdvertAndCommonApplication.mutationOptions({
      onSuccess: () => {
        toast.success('Auglýsing búin til')
        queryClient.invalidateQueries(trpc.getAdvertsInProgress.queryFilter())
        setState(initalState)
        router.back()
      },
      onError: () => {
        toast.error('Ekki tókst að búa til auglýsingu')
      },
    }),
  )

  const [state, setState] =
    useState<CreateAdvertAndCommonApplicationBody>(initalState)
  const [errors, setErrors] = useState<{ path: string; message: string }[]>([])

  const onSubmit = () => {
    const check = createAdvertAndCommonApplicationInput.safeParse(state)

    if (!check.success) {
      const parsedErrors = parseZodError(check.error)
      setErrors(parsedErrors.filter((err) => err.path !== undefined))
      toast.error('Vinsamlegast fylltu út öll nauðsynleg svæði')

      return
    }

    mutate(state)
  }

  return (
    <>
      <GridContainer>
        <GridRow rowGap={[2, 3]}>
          <CreateAdvertApplicant
            onChange={(nationalId) =>
              setState((prev) => ({
                ...prev,
                applicantNationalId: nationalId,
              }))
            }
          />

          <GridColumn span="12/12">
            <Text variant="h4">Grunnupplýsingar</Text>
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <TypeSelect
              required
              selectedId={state.fields.type.id}
              onSelect={(type) => {
                if (!type) return
                setState((prev) => ({
                  ...prev,
                  fields: {
                    ...prev.fields,
                    type: type,
                    category: { id: '', title: '', slug: '' }, // Reset category when type changes
                  },
                }))
              }}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <CategorySelect
              required
              typeId={state.fields.type.id}
              selectedId={state.fields.category.id}
              onSelect={(cat) => {
                if (!cat) return
                setState((prev) => ({
                  ...prev,
                  fields: {
                    ...prev.fields,
                    category: cat,
                  },
                }))
              }}
            />
          </GridColumn>
          <GridColumn span="12/12">
            <Input
              size="sm"
              backgroundColor="blue"
              name="new-advert-caption"
              label="Yfirskrift"
              required
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  fields: {
                    ...prev.fields,
                    caption: e.target.value,
                  },
                }))
              }
            />
          </GridColumn>
          <GridColumn span="12/12">
            <Editor
              onChange={(val) =>
                setState((prev) => ({
                  ...prev,
                  fields: {
                    ...prev.fields,
                    html: val,
                  },
                }))
              }
            />
          </GridColumn>

          <CreateAdvertSignature
            onChange={(signature) =>
              setState((prev) => ({ ...prev, signature: signature }))
            }
          />

          <CreateAdvertPublications
            onChange={(pubDates) =>
              setState((prev) => ({
                ...prev,
                publishingDates: pubDates,
              }))
            }
          />

          <CreateAdvertCommunicationChannel
            onChange={(channels) =>
              setState((prev) => ({
                ...prev,
                communicationChannels: channels,
              }))
            }
          />

          <CreateAdvertErrors
            errors={errors}
            onResetErrors={() => setErrors([])}
          />
          <SubmitCreateAdvert onSubmit={onSubmit} isPending={isPending} />
        </GridRow>
      </GridContainer>
    </>
  )
}
