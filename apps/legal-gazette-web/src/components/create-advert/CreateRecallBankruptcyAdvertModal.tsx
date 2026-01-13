import { useState } from 'react'
import z from 'zod'

import { ApplicationRequirementStatementEnum } from '@dmr.is/legal-gazette/schemas'
import { Button } from '@dmr.is/ui/components/island-is'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { createAdvertAndRecallBankruptcyApplicationInput } from '../../lib/inputs'
import { CreateAdvertAdditionalText } from './CreateAdvertAdditionalText'
import { CreateAdvertApplicant } from './CreateAdvertApplicant'
import { CreateAdvertCommunicationChannel } from './CreateAdvertCommunicationChannel'
import { CreateAdvertCourtDistrict } from './CreateAdvertCourtDistrict'
import { CreateAdvertDivisionMeeting } from './CreateAdvertDivisionMeeting'
import { CreateAdvertPublications } from './CreateAdvertPublications'
import { CreateAdvertSettlement } from './CreateAdvertSettlement'
import { CreateAdvertSignature } from './CreateAdvertSignature'

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
  const [state, setState] =
    useState<CreateAdvertAndRecallBankruptcyApplicationBody>(initalState)

  const disclosure = (
    <Button variant="utility" size="small" icon="add" iconType="outline">
      Innköllun þrotabús
    </Button>
  )

  return (
    <Modal disclosure={disclosure} title="Innköllun þrotabús">
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
      <CreateAdvertSettlement />
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
    </Modal>
  )
}
