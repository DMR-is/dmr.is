'use client'
import { useRouter } from 'next/navigation'

import { FormProvider, useForm } from 'react-hook-form'
import useSWRMutation from 'swr/mutation'

import { Stack, Text, toast } from '@island.is/island-ui/core'

import {
  BankruptcyApplicationDto,
  SubmitBankruptcyApplicationRequest,
} from '../../../../gen/fetch'
import { submitBankruptcyApplication } from '../../../../lib/fetchers'
import {
  BankruptcyApplicationSchema,
  bankruptcyApplicationSchema,
} from '../../../../lib/schemas'
import { BankruptcyAdvertFields } from './fields/BankruptcyAdvertFields'

import { zodResolver } from '@hookform/resolvers/zod'

type Props = {
  caseId: string
  applicationId: string
  application: BankruptcyApplicationDto
  courtOptions: { label: string; value: string }[]
}

export const BankruptcyForm = ({
  caseId,
  applicationId,
  application,
  courtOptions,
}: Props) => {
  const router = useRouter()
  const methods = useForm<BankruptcyApplicationSchema>({
    mode: 'onChange',
    resolver: zodResolver(bankruptcyApplicationSchema),
    defaultValues: {
      meta: {
        caseId,
        applicationId,
        courtOptions,
      },
      advert: {
        courtId: application.courtDistrict?.id,
        additionalText: application.additionalText,
        judgementDate: application.judgmentDate
          ? new Date(application.judgmentDate)
          : undefined,
      },
      divisionMeeting: {
        date: application.settlementMeetingDate
          ? new Date(application.settlementMeetingDate)
          : undefined,
        location: application.settlementMeetingLocation,
      },
      liquidator: {
        name: application.liquidator,
        location: application.liquidatorLocation,
        onBehalfOf: application.liquidatorOnBehalfOf,
      },
      settlement: {
        name: application.settlementName,
        nationalId: application.settlementNationalId,
        address: application.settlementAddress,
        deadline: application.settlementDeadline
          ? new Date(application.settlementDeadline)
          : undefined,
      },
      signature: {
        date: application.signatureDate
          ? new Date(application.signatureDate)
          : undefined,
        location: application.signatureLocation,
      },
      publishing: application.publishingDates
        ? application.publishingDates.map((date) => new Date(date))
        : [],
    },
  })

  const { trigger: submitBankruptcyApplicationTrigger } = useSWRMutation(
    'submitBankruptcyApplication',
    (_key: string, { arg }: { arg: SubmitBankruptcyApplicationRequest }) =>
      submitBankruptcyApplication(arg),
    {
      onSuccess: () => {
        toast.success('Umsókn hefur verið send til birtingar.', {
          toastId: 'submit-bankruptcy-application-success',
        })

        router.refresh()
      },
      onError: () => {
        toast.error(
          'Ekki tókst að senda inn umsókn. Vinsamlegast reyndu aftur síðar.',
          {
            toastId: 'submit-bankruptcy-application-error',
          },
        )
      },
    },
  )

  const onValidSubmit = (_data: BankruptcyApplicationSchema) => {
    submitBankruptcyApplicationTrigger({ applicationId, caseId })
  }

  const onInvalidSubmit = (_errors: unknown) => {
    toast.error('Umsóknin er ekki gild.', {
      toastId: 'submit-bankruptcy-application-error',
    })
  }

  return (
    <FormProvider {...methods}>
      <form
        id="bankruptcy"
        onSubmit={methods.handleSubmit(onValidSubmit, onInvalidSubmit)}
      >
        <Stack space={[2, 3, 4]}>
          <Stack space={[1, 2]}>
            <Text variant="h2">Innköllun þrotabús</Text>
            <Text>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </Text>
          </Stack>
          <BankruptcyAdvertFields courtOptions={courtOptions} />
        </Stack>
      </form>
    </FormProvider>
  )
}
