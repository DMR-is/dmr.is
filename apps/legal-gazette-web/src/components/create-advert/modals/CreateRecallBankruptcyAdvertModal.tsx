'use client'

import { useRouter } from 'next/navigation'

import { useState } from 'react'
import * as z from 'zod'

import {
  ApplicationRequirementStatementEnum,
  parseZodError,
} from '@dmr.is/legal-gazette/schemas'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { createAdvertAndRecallBankruptcyApplicationInput } from '../../../lib/inputs'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { CreateAdvertAdditionalText } from '../CreateAdvertAdditionalText'
import { CreateAdvertApplicant } from '../CreateAdvertApplicant'
import { CreateAdvertCommunicationChannel } from '../CreateAdvertCommunicationChannel'
import { CreateAdvertCourtDistrict } from '../CreateAdvertCourtDistrict'
import { CreateAdvertDivisionMeeting } from '../CreateAdvertDivisionMeeting'
import { CreateAdvertErrors } from '../CreateAdvertErrors'
import { CreateAdvertPublications } from '../CreateAdvertPublications'
import { CreateAdvertSignature } from '../CreateAdvertSignature'
import { CreateBankruptcySettlement } from '../CreateBankruptcySettlement'
import { SubmitCreateAdvert } from '../SubmitCreateAdvert'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type CreateAdvertAndRecallBankruptcyApplicationBody = z.infer<
  typeof createAdvertAndRecallBankruptcyApplicationInput
>

const initalState: CreateAdvertAndRecallBankruptcyApplicationBody = {
  applicantNationalId: '',
  additionalText: undefined,
  prequisitesAccepted: true,
  communicationChannels: [],
  publishingDates: [],
  signature: {},
  fields: {
    courtAndJudgmentFields: {
      courtDistrict: {
        id: '',
        title: '',
        slug: '',
      },
      judgmentDate: '',
    },
    divisionMeetingFields: {
      meetingDate: '',
      meetingLocation: '',
    },
    settlementFields: {
      address: '',
      deadlineDate: '',
      liquidatorLocation: '',
      liquidatorName: '',
      name: '',
      nationalId: '',
      recallRequirementStatementLocation: '',
      recallRequirementStatementType:
        ApplicationRequirementStatementEnum.LIQUIDATORLOCATION,
    },
  },
}

export const CreateBankruptcyAdvertModal = () => {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [errors, setErrors] = useState<{ path: string; message: string }[]>([])

  const { mutate, isPending } = useMutation(
    trpc.createRecallBankruptcyAdvertAndApplication.mutationOptions({
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
    useState<CreateAdvertAndRecallBankruptcyApplicationBody>(initalState)

  const onSubmit = () => {
    const check =
      createAdvertAndRecallBankruptcyApplicationInput.safeParse(state)

    if (!check.success) {
      const parsedErrors = parseZodError(check.error)
      setErrors(parsedErrors.filter((err) => err.path !== undefined))
      toast.error('Vinsamlegast fylltu út öll nauðsynleg svæði')

      return
    }

    mutate(state)
  }

  return (
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
        <CreateAdvertCourtDistrict
          onChange={(courtDistrict) =>
            setState((prev) => ({
              ...prev,
              fields: {
                ...prev.fields,
                courtAndJudgmentFields: courtDistrict,
              },
            }))
          }
        />
        <CreateAdvertAdditionalText
          onChange={(val) =>
            setState((prev) => ({
              ...prev,
              additionalText: val,
            }))
          }
        />

        <CreateAdvertSignature
          onChange={(signature) =>
            setState((prev) => ({ ...prev, signature: signature }))
          }
        />

        <CreateBankruptcySettlement
          onChange={(settlement) =>
            setState((prev) => ({
              ...prev,
              fields: {
                ...prev.fields,
                settlementFields: settlement,
              },
            }))
          }
        />
        <CreateAdvertDivisionMeeting
          required={true}
          onChange={(divisionMeeting) =>
            setState((prev) => ({
              ...prev,
              fields: {
                ...prev.fields,
                divisionMeetingFields: divisionMeeting,
              },
            }))
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
  )
}
