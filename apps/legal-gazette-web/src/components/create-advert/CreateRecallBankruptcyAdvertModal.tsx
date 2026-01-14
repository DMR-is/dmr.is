import { useState } from 'react'
import z from 'zod'

import { ApplicationRequirementStatementEnum } from '@dmr.is/legal-gazette/schemas'
import { Button, toast } from '@dmr.is/ui/components/island-is'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { createAdvertAndRecallBankruptcyApplicationInput } from '../../lib/inputs'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { CreateAdvertAdditionalText } from './CreateAdvertAdditionalText'
import { CreateAdvertApplicant } from './CreateAdvertApplicant'
import { CreateAdvertCommunicationChannel } from './CreateAdvertCommunicationChannel'
import { CreateAdvertCourtDistrict } from './CreateAdvertCourtDistrict'
import { CreateAdvertDivisionMeeting } from './CreateAdvertDivisionMeeting'
import { CreateAdvertPublications } from './CreateAdvertPublications'
import { CreateAdvertSettlement } from './CreateAdvertSettlement'
import { CreateAdvertSignature } from './CreateAdvertSignature'
import { SubmitCreateAdvert } from './SubmitCreateAdvert'

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
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation(
    trpc.createRecallBankruptcyAdvertAndApplication.mutationOptions({
      onSuccess: () => {
        toast.success('Auglýsing búin til')
        queryClient.invalidateQueries(trpc.getAdvertsInProgress.queryFilter())
        setState(initalState)
        setIsVisible(false)
      },
      onError: () => {
        toast.error('Ekki tókst að búa til auglýsingu')
      },
    }),
  )

  const [state, setState] =
    useState<CreateAdvertAndRecallBankruptcyApplicationBody>(initalState)
  const [isVisible, setIsVisible] = useState(false)

  const onSubmit = () => {
    const check =
      createAdvertAndRecallBankruptcyApplicationInput.safeParse(state)

    if (!check.success) {
      const err = z.treeifyError(check.error)
      // eslint-disable-next-line no-console
      console.error('Validation errors:', err)

      toast.error('Vinsamlegast fylltu út öll nauðsynleg svæði')

      return
    }

    mutate(state)
  }

  const disclosure = (
    <Button variant="utility" size="small" icon="add" iconType="outline">
      Innköllun þrotabús
    </Button>
  )

  return (
    <Modal
      disclosure={disclosure}
      title="Innköllun þrotabús"
      baseId="create-recall-bankruptcy-advert-modal"
      isVisible={isVisible}
      onVisibilityChange={setIsVisible}
    >
      <CreateAdvertApplicant
        onChange={(nationalId) =>
          setState((prev) => ({ ...prev, applicantNationalId: nationalId }))
        }
      />
      <CreateAdvertCourtDistrict
        onChange={(courtDistrict) =>
          setState((prev) => ({
            ...prev,
            fields: { ...prev.fields, courtAndJudgmentFields: courtDistrict },
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
      <CreateAdvertSettlement
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
      <SubmitCreateAdvert onSubmit={onSubmit} isPending={isPending} />
    </Modal>
  )
}
