import { useEffect, useMemo, useState } from 'react'

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
import { amountFormat, imageTiers } from '../../lib/utils'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import * as styles from './Calculator.css'
import { usePriceCalculatorState } from './calculatorContext'

export const PriceCalculator = () => {
  const { currentCase, refetch, canEdit, feeCodeOptions } = useCaseContext()
  const { md } = useBreakpoint()
  const { data: paymentData } = useGetPaymentStatus({ caseId: currentCase.id })
  const { state, dispatch } = usePriceCalculatorState(currentCase)
  const [prevPrice, setPrevPrice] = useState(currentCase.transaction?.price)

  const { trigger: updatePrice, isMutating: isPriceLoading } = useUpdatePrice({
    caseId: currentCase.id,
    options: {
      onSuccess: () => {
        refetch()
        const newPrice = currentCase.transaction?.price
        if (newPrice !== prevPrice) {
          toast.success('Verð auglýsingar hefur verið uppfært', {
            toastId: 'price-update',
          })
          setPrevPrice(newPrice)
        }
      },
      onError: () =>
        toast.error('Ekki tókst að uppfæra verð auglýsingar', {
          toastId: 'price-update-error',
        }),
    },
  })

  const updateAllPrices = () => {
    setPrevPrice(currentCase.transaction?.price)
    if ('selectedItem' in state) {
      updatePrice({
        imageTier: state.selectedItem?.value,
        customBaseDocumentCount: state.customBaseDocumentCount,
        customBodyLengthCount: state.useCustomInputBase
          ? state.customBodyLengthCount
          : 0,
        customAdditionalDocCount: state.additionalDocuments,
        extraWorkCount: state.extraWorkCount,
        subject: state.subject ?? undefined,
      })
    }
  }

  const unitPrice = useMemo(
    () =>
      feeCodeOptions.find((feeCode) =>
        currentCase.advertDepartment.slug === 'b-deild'
          ? feeCode.feeType === 'BASE_MODIFIER'
          : feeCode.feeType === 'BASE' &&
            feeCode.department === currentCase.advertDepartment.slug,
      )?.value,
    [feeCodeOptions, currentCase.advertDepartment.slug],
  )

  useEffect(() => {
    updateAllPrices()
  }, [currentCase.html, currentCase.fastTrack])

  return (
    <>
      <Box marginBottom={1}>
        <Text variant="eyebrow" color="blueberry400">
          Greiðsla
        </Text>
      </Box>
      <Inline alignY="center" space={[2, 4]}>
        <Box style={{ minWidth: md ? '308px' : '254px' }}>
          <OJOIInput
            name="price"
            label="Einingafjöldi"
            type="number"
            disabled={!state.useCustomInputBase}
            placeholder="0"
            value={
              currentCase.advertDepartment.slug === 'b-deild'
                ? state.customBodyLengthCount || ''
                : state.customBaseDocumentCount || ''
            }
            onChange={(e) =>
              dispatch({
                type:
                  currentCase.advertDepartment.slug === 'b-deild'
                    ? 'SET_CUSTOM_BODY_LENGTH_COUNT'
                    : 'SET_CUSTOM_BASE_DOC_COUNT',
                payload: Number(e.target.value),
              })
            }
            onBlur={updateAllPrices}
          />
        </Box>
        <Inline alignY="center" space={[2, 4]}>
          <Checkbox
            checked={state.useCustomInputBase}
            onChange={() => {
              dispatch({ type: 'TOGGLE_CUSTOM_INPUT_BASE' })
              if (state.useCustomInputBase) {
                dispatch({ type: 'RESET_CUSTOM_INPUT' })
                updateAllPrices()
              } else {
                updateAllPrices()
              }
            }}
            label="Notast við innslegið gildi"
          />
        </Inline>
      </Inline>

      <Box marginBottom={3} style={{ maxWidth: md ? '308px' : '254px' }}>
        <Stack space={2}>
          <Box>
            <Text variant="small" color="blue600">
              Einingarverð: {amountFormat(unitPrice)}
            </Text>
            <Text variant="small" color="blue600">
              Álag vegna hraðbirtingar: {currentCase.fastTrack ? '80%' : '0%'}
            </Text>
          </Box>
          {currentCase.advertDepartment.slug === 'b-deild' ||
          currentCase.advertDepartment.slug === 'a-deild' ? ( // Additional documents & Álag are only for A and B
            <>
              <Box>
                <OJOIInput
                  name="additionalDocuments"
                  label="Fylgiskjöl"
                  placeholder="0"
                  type="number"
                  value={state.additionalDocuments || ''}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_ADDITIONAL_DOCUMENTS',
                      payload: Number(e.target.value),
                    })
                  }
                  onBlur={updateAllPrices}
                />
                <Text variant="small" color="blue600">
                  Einingarverð:{' '}
                  {state.additionalDocuments
                    ? amountFormat(
                        feeCodeOptions.find(
                          (feeCode) =>
                            feeCode.feeType === 'ADDITIONAL_DOC' &&
                            feeCode.department ===
                              currentCase.advertDepartment.slug,
                        )?.value ?? 0,
                      )
                    : 0}
                </Text>
              </Box>
              <Box position="relative">
                <span className={styles.percentage}>%</span>
                <OJOIInput
                  name="extrawork"
                  label="Álag"
                  placeholder="0"
                  type="number"
                  value={state.extraWorkCount || ''}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_EXTRA_WORK_COUNT',
                      payload: Number(e.target.value),
                    })
                  }
                  onBlur={updateAllPrices}
                />
                <Text variant="small" color="blue600">
                  % álag vegna vinnu
                </Text>
              </Box>
            </>
          ) : undefined}
          {currentCase.advertDepartment.slug === 'b-deild' && (
            <Box>
              <OJOISelect
                isDisabled={!canEdit}
                label="Myndir"
                placeholder="Veldu myndafjölda"
                options={imageTiers}
                value={state.selectedItem}
                onChange={(opt) => {
                  dispatch({
                    type: 'SET_SELECTED_ITEM',
                    payload: opt || undefined,
                  })
                  setPrevPrice(currentCase.transaction?.price)
                  updatePrice({
                    imageTier: opt?.value,
                    customBaseDocumentCount: state.customBaseDocumentCount,
                    customBodyLengthCount: state.useCustomInputBase
                      ? state.customBodyLengthCount
                      : 0,
                    customAdditionalDocCount: state.additionalDocuments,
                    extraWorkCount: state.extraWorkCount,
                    subject: state.subject ?? undefined,
                  })
                }}
              />
              <Text variant="small" color="blue600">
                Myndir einingarverð:{' '}
                {amountFormat(
                  feeCodeOptions.find(
                    (feeCode) => feeCode.feeCode === state.selectedItem?.value,
                  )?.value || 0,
                )}
              </Text>
            </Box>
          )}
        </Stack>
      </Box>

      <Inline alignY="center" space={[2, 4]}>
        <Box marginBottom={3} style={{ minWidth: md ? '308px' : '254px' }}>
          <OJOIInput
            name="subject"
            label="Viðfang"
            type="text"
            placeholder="Tilvísun"
            maxLength={16}
            value={state.subject || ''}
            onChange={(e) =>
              dispatch({
                type: 'SET_SUBJECT',
                payload: e.target.value,
              })
            }
            onBlur={updateAllPrices}
          />
          <Text variant="small" color="blue600">
            Tilvísun á reikningi
          </Text>
        </Box>
      </Inline>

      <Inline alignY="center" space={[2, 4]}>
        <Box style={{ minWidth: md ? '308px' : '254px' }}>
          <OJOIInput
            readOnly
            name="totalPrice"
            value={amountFormat(currentCase.transaction?.price)}
            label="Samtals"
            type="text"
            loading={isPriceLoading}
            onBlur={updateAllPrices}
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
        <Text>
          {paymentData?.created
            ? 'Auglýsing hefur verið send til TBR'
            : 'Auglýsing verður send til TBR við staðfestingu á útgáfu.'}
        </Text>
      </Box>
    </>
  )
}
