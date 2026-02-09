'use client'

import { useSession } from 'next-auth/react'

import get from 'lodash/get'
import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  ApplicationTypeEnum,
  BaseApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { formatDate, numberFormat } from '@dmr.is/utils/client'

import { useTRPC } from '../../../lib/trpc/client/trpc'
import { FormStep } from '../../form-step/FormStep'
import { SummaryFields } from '../fields/SummaryFields'

import { useMutation } from '@tanstack/react-query'

export const SummaryStep = () => {
  const trpc = useTRPC()
  const { getValues } = useFormContext<BaseApplicationWebSchema>()
  const formValues = getValues()

  const { data: application, isPending: isPendingApplication } = useQuery(
    trpc.getApplicationById.queryOptions({
      id: formValues.metadata.applicationId,
    }),
  )

  const { data: estimatedPrice } = useQuery(
    trpc.getEstimatedPrice.queryOptions(
      {
        applicationId: formValues.metadata.applicationId,
      },
      { gcTime: 0 },
    ),
  )

  const { mutate: getPersonInfo, isPending } = useMutation(
    trpc.getEntityByNationalId.mutationOptions({}),
  )
  const session = useSession()
  const [items, setItems] = useState<{ title: string; value: any }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!application) return

    getPersonInfo(
      {
        nationalId: application.applicantNationalId,
      },
      {
        onSuccess: (data) => {
          const submitteeNationalId = session.data?.user?.nationalId

          if (data?.entity?.kennitala === submitteeNationalId) {
            setItems((prev) => [
              {
                title: 'Eigandi auglýsingar',
                value: data?.entity?.nafn,
              },
              ...prev,
            ])
          } else {
            setItems((prev) => [
              {
                title: 'Eigandi auglýsingar',
                value: data?.entity?.nafn,
              },
              {
                title: 'Innsendandi',
                value: session.data?.user.name,
              },
              ...prev,
            ])
          }
        },
      },
    )

    const summaryItems: { title: string; value: any }[] = []

    switch (formValues.metadata.type) {
      case ApplicationTypeEnum.RECALL_BANKRUPTCY:
        summaryItems.push(
          {
            title: 'Flokkur',
            value: 'Innkallanir',
          },
          {
            title: 'Tegund',
            value: 'Innköllun þrotabús',
          },
        )
        break
      case ApplicationTypeEnum.RECALL_DECEASED:
        summaryItems.push(
          {
            title: 'Flokkur',
            value: 'Innkallanir',
          },
          {
            title: 'Tegund',
            value: 'Innköllun dánarbús',
          },
        )
        break
      case ApplicationTypeEnum.COMMON: {
        const cat = get(formValues, 'fields.category.title', null)
        const type = get(formValues, 'fields.type.title', null)

        if (cat) {
          summaryItems.push({
            title: 'Flokkur',
            value: cat,
          })
        }

        if (type) {
          summaryItems.push({
            title: 'Tegund',
            value: type,
          })
        }
        break
      }
    }

    const publishingDates = formValues.publishingDates?.map((date, i) => ({
      title: `Birtingadagur ${i + 1}`,
      value: formatDate(date, 'd.MM.yyyy'),
    }))

    if (publishingDates) {
      summaryItems.push(...publishingDates)
    }

    const communicationChannels = formValues.communicationChannels?.map(
      (channel, i) => ({
        title: i === 0 ? 'Tengiliður' : `Tengiliður ${i + 1}`,
        value: channel.email,
      }),
    )

    if (communicationChannels) {
      summaryItems.push(...communicationChannels)
    }

    setItems(summaryItems)
    setLoading(false)
  }, [session, application])

  useEffect(() => {
    setItems((prev) => [
      ...prev,
      {
        title: 'Áætlaður kostnaður',
        value: estimatedPrice
          ? `${numberFormat(estimatedPrice.price)} kr.`
          : 'Ekki hægt að reikna',
      },
    ])

    return () => {
      setItems((prev) =>
        prev.filter((item) => item.title !== 'Áætlaður kostnaður'),
      )
    }
  }, [estimatedPrice])

  const isLoading = loading || isPending || isPendingApplication

  return (
    <FormStep
      items={[
        {
          content: isLoading ? (
            <SkeletonLoader
              repeat={5}
              height={64}
              space={[1, 2]}
              borderRadius="standard"
            />
          ) : (
            <SummaryFields items={items} />
          ),
        },
      ]}
    />
  )
}
