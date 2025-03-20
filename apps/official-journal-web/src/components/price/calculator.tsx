import { useEffect, useState } from 'react'

import {
  Box,
  Checkbox,
  Inline,
  Stack,
  Text,
  toast,
  useBreakpoint,
} from '@island.is/island-ui/core'

import { useGetPaymentStatus, useUpdatePrice } from '../../hooks/api'
import { useCaseContext } from '../../hooks/useCaseContext'
import { amountFormat } from '../../lib/utils'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'

type OptionType = {
  value: string
  label: string
}

const imageTiers = [
  {
    value: 'B108',
    label: '1-5 myndir í máli',
  },
  {
    value: 'B109',
    label: '6-15 myndir í máli',
  },
  {
    value: 'B110',
    label: '>15 myndir í máli',
  },
  {
    value: '',
    label: 'Engar myndir',
  },
]

export const PriceCalculator = () => {
  const [selectedItem, setSelectedItem] = useState<OptionType | undefined>()
  const [customBaseDocumentCount, setCustomBaseDocumentCount] = useState<number>()
  const [customBodyLengthCount, setCustomBodyLengthCount] = useState<number>()
  const [additionalDocuments, setAdditionalDocuments] = useState<number>()

  const { currentCase, refetch, canEdit, feeCodeOptions } =
    useCaseContext()

  const { md } = useBreakpoint()
  const { data: paymentData } = useGetPaymentStatus({ caseId: currentCase.id })

  useEffect(() => {
    if (currentCase?.transaction?.imageTier) {
      const tier = imageTiers.find(
        (tier) => tier.value === currentCase?.transaction?.imageTier,
      )
      setSelectedItem(tier)
    }
    if (currentCase.transaction?.customDocCount) {
      if (typeof currentCase.transaction?.customDocCount === 'string') {
        setAdditionalDocuments(Number(currentCase.transaction?.customDocCount))
      } else {
        setAdditionalDocuments(currentCase.transaction?.customDocCount)
      }
    }
    if (
      currentCase.transaction?.customBaseCount &&
      currentCase.advertDepartment.slug === 'b-deild'
    ) {
      if (typeof currentCase.transaction?.customBaseCount === 'string') {
        setCustomBodyLengthCount(
          Number(currentCase.transaction?.customBaseCount),
        )
      } else {
        setCustomBodyLengthCount(currentCase.transaction?.customBaseCount)
      }
    }
    if (
      currentCase.transaction?.customBaseCount &&
      currentCase.advertDepartment.slug !== 'b-deild'
    ) {
      if (typeof currentCase.transaction?.customBaseCount === 'string') {
        setCustomBaseDocumentCount(
          Number(currentCase.transaction?.customBaseCount),
        )
      } else {
        setCustomBaseDocumentCount(currentCase.transaction?.customBaseCount)
      }
    }
  }, [
    currentCase?.transaction?.imageTier,
    currentCase.transaction?.customBaseCount,
    currentCase.transaction?.customDocCount,
    currentCase.advertDepartment.slug,
  ])

  const { trigger: updatePrice, isMutating: isPriceLoading } = useUpdatePrice({
    caseId: currentCase.id,
    options: {
      onSuccess: () => {
        toast.success('Verð auglýsingar hefur verið uppfært')
        refetch()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra verð auglýsingar')
      },
    },
  })

  console.log('paymentData', paymentData)

  return (
    <>
      <Box marginBottom={1}>
        <Text variant="eyebrow" color="blueberry400">
          Greiðsla
        </Text>
      </Box>
      <Box marginBottom={3} style={{ maxWidth: md ? '308px' : '254px' }}>
        <Stack space={2}>
          <Box>
            <OJOIInput
              name="price"
              label="Einingafjöldi"
              type="number"
              inputMode="numeric"
              placeholder={"0"}
              value={customBodyLengthCount ?? undefined}
              onChange={(e) => setCustomBodyLengthCount(Number(e.target.value))}
            />
            <Text variant="small" color="blue600">
              Einingarverð:{' '}
              {amountFormat(
                feeCodeOptions.find(
                  (feeCode) => feeCode.feeType === 'BASE_MODIFIER',
                )?.value,
              )}
            </Text>
            <Text variant="small" color="blue600">
              Álag vegna hraðbirtingar: {currentCase.fastTrack ? '80%' : '0%'}
            </Text>
          </Box>
          <Box>
            <OJOIInput
              name="price"
              label="Fylgiskjöl"
              placeholder={"0"}
              type="number"
              inputMode="numeric"
              value={additionalDocuments}
              onChange={(e) => setAdditionalDocuments(Number(e.target.value))}
            />
            {additionalDocuments ? (
              <Text variant="small" color="blue600">
                Einingarverð:{' '}
                {amountFormat(
                  feeCodeOptions.find(
                    (feeCode) => feeCode.feeType === 'ADDITIONAL_DOC',
                  )?.value ?? 0,
                )}
              </Text>
            ) : undefined}
          </Box>
          <Box>
            <OJOISelect
              isDisabled={!canEdit}
              label="Myndir"
              placeholder="Veldu myndafjölda"
              options={imageTiers}
              value={selectedItem}
              onChange={(opt) => {
                if (opt?.value && opt.label) {
                  setSelectedItem({
                    value: opt.value,
                    label: opt.label,
                  })
                } else {
                  setSelectedItem(undefined)
                }
              }}
            />
            <Text variant="small" color="blue600">
              Myndir einingarverð:{' '}
              {amountFormat(
                feeCodeOptions.find(
                  (feeCode) => feeCode.feeCode === selectedItem?.value,
                )?.value ?? 0,
              )}
            </Text>
          </Box>
        </Stack>
      </Box>
      <Inline alignY="center" space={[2, 4]}>
        <Box style={{ minWidth: md ? '308px' : '254px' }}>
          <OJOIInput
            readOnly
            name="price"
            value={amountFormat(currentCase.transaction?.price)}
            label="Samtals"
            type="text"
            loading={isPriceLoading}
          />
        </Box>
        <Inline alignY="center" space={1}>
          <Checkbox
            checked={paymentData?.paid}
            disabled
            label="Búið er að greiða"
          />
        </Inline>
      </Inline>
      <Box marginTop={2}>
        <button
          onClick={() =>
            updatePrice({
              imageTier: selectedItem?.value ?? undefined,
              customBaseDocumentCount: customBaseDocumentCount ?? undefined,
              customBodyLengthCount: customBodyLengthCount ?? undefined,
              customAdditionalDocCount: additionalDocuments ?? undefined,
            })
          }
          type="button"
        >
          Uppfæra verð
        </button>
        {
          paymentData?.created ? (
            <Text>Auglýsing hefur verið send til TBR</Text>
          ) : (
            <Text>Auglýsing verður send til TBR við staðfestingu á útgáfu.</Text>
          )
        }
      </Box>
    </>
  )
}
