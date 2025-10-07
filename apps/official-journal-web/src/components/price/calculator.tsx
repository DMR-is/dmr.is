import { useSession } from 'next-auth/react'

import { useEffect, useMemo, useState } from 'react'

import {
  Box,
  Button,
  Checkbox,
  Inline,
  Stack,
  Text,
  toast,
  useBreakpoint,
} from '@island.is/island-ui/core'

import { useGetPaymentStatus, useUpdatePrice } from '../../hooks/api'
import { useCaseContext } from '../../hooks/useCaseContext'
import { getDmrClient } from '../../lib/api/createClient'
import { amountFormat, imageTiers } from '../../lib/utils'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import * as styles from './Calculator.css'
import { usePriceCalculatorState } from './calculatorContext'
import { PriceCalculatorStatusBox } from './StatusBox'

export const PriceCalculator = () => {
  const {
    currentCase,
    refetch,
    canEdit,
    feeCodeOptions,
    isPublishedOrRejected,
  } = useCaseContext()
  const { md } = useBreakpoint()
  const { data: session } = useSession()
  const { data: paymentData, mutate } = useGetPaymentStatus({
    caseId: currentCase.id,
  })
  const { state, dispatch } = usePriceCalculatorState(currentCase)
  const [prevPrice, setPrevPrice] = useState(currentCase.transaction?.price)
  const [isLocalPaymentLoading, setLocalPaymentLoading] = useState(false)
  const dmrClient = getDmrClient(session?.idToken as string)

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
    if (!currentCase.transaction?.price) {
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
  }, [])

  useEffect(() => {
    updateAllPrices()
  }, [currentCase.html, currentCase.fastTrack, currentCase.additions])

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
                  disabled={!canEdit}
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
                  disabled={!canEdit}
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
            disabled={!canEdit}
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
        {isPublishedOrRejected ? (
          <Inline alignY="center" space={1}>
            <PriceCalculatorStatusBox
              text={
                paymentData?.paid ? 'Búið er að greiða' : 'Ekki búið að greiða'
              }
              success={!!paymentData?.paid}
            />
          </Inline>
        ) : undefined}
      </Inline>
      <Box marginTop={2}>
        {isPublishedOrRejected ? (
          <Box>
            {paymentData?.created ? (
              <PriceCalculatorStatusBox
                text={`Auglýsing hefur verið send til TBR, nr: ${currentCase.transaction?.externalReference}`}
                success
              />
            ) : (
              <>
                <Inline alignY="center" space={[2, 4]}>
                  <Box style={{ minWidth: md ? '308px' : '254px' }}>
                    <Text>Auglýsing hefur ekki verið send til TBR.</Text>
                    <Text variant="small">(nr: {currentCase.caseNumber})</Text>
                  </Box>
                  <Button
                    variant="ghost"
                    size="small"
                    icon="arrowForward"
                    disabled={!canEdit}
                    loading={isLocalPaymentLoading}
                    type="button"
                    onClick={async () => {
                      await dmrClient
                        .postExternalPaymentByCaseId({
                          caseId: currentCase.id,
                        })
                        .then(() => {
                          setLocalPaymentLoading(true)
                        })
                        .finally(() => {
                          setTimeout(() => {
                            mutate()
                            setLocalPaymentLoading(false)
                          }, 1000)
                        })
                        .catch(() => {
                          setLocalPaymentLoading(false)
                          toast.error(
                            'Ekki tókst að senda auglýsingu til TBR',
                            {
                              toastId: 'external-payment-error',
                            },
                          )
                        })
                    }}
                  >
                    Senda til TBR
                  </Button>
                </Inline>
              </>
            )}
          </Box>
        ) : paymentData?.created ? (
          <PriceCalculatorStatusBox
            text={`Auglýsing hefur verið send til TBR, nr: ${currentCase.transaction?.externalReference}`}
            success
          />
        ) : (
          <Text>Auglýsing verður send til TBR við staðfestingu á útgáfu.</Text>
        )}
      </Box>
    </>
  )
}
