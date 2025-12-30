import { useCallback } from 'react'
import { useFormContext } from 'react-hook-form'

import { BaseApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { Box, Button, Inline } from '@dmr.is/ui/components/island-is'

import { useUpdateApplication } from '../../../hooks/useUpdateApplication'
import * as styles from './application-footer.css'

export const ApplicationFooter = () => {
  const { getValues, setValue, watch } =
    useFormContext<BaseApplicationWebSchema>()
  const id = getValues('metadata.applicationId')
  const { updateApplication, isUpdatingApplication } = useUpdateApplication({
    id: id,
    type: 'COMMON',
  })

  const metadata = getValues('metadata')
  const { currentStep, totalSteps } = metadata
  const canProceed = watch('metadata.canProceed')

  const canContinue = currentStep < totalSteps - 1 && canProceed !== false
  const canGoBack = currentStep > 0
  const isLastStep = currentStep + 1 === totalSteps
  const goBack = useCallback(() => {
    if (!canGoBack) return
    updateApplication(
      { currentStep: currentStep - 1 },
      {
        onSuccessCallback: () => {
          setValue('metadata.currentStep', currentStep - 1)
        },
      },
    )
  }, [canGoBack, updateApplication, currentStep, setValue])

  const goForward = useCallback(() => {
    if (!canContinue) return
    updateApplication(
      { currentStep: currentStep + 1 },
      {
        onSuccessCallback: () => {
          setValue('metadata.currentStep', currentStep + 1)
        },
      },
    )
  }, [canContinue, updateApplication, currentStep, setValue])

  return (
    <Box
      paddingY={[3, 5]}
      paddingX={[9, 12]}
      background="white"
      borderTopWidth="standard"
      borderColor="purple100"
      className={styles.shellFooter}
    >
      <Inline justifyContent="spaceBetween" alignY="center">
        <Button
          disabled={!canGoBack || isUpdatingApplication}
          type="button"
          variant="ghost"
          onClick={goBack}
          preTextIcon="arrowBack"
          preTextIconType="outline"
        >
          Til baka
        </Button>
        {!isLastStep ? (
          <Button
            loading={isUpdatingApplication}
            type="button"
            onClick={goForward}
            icon="arrowForward"
            iconType="outline"
            disabled={!canContinue}
          >
            Halda áfram
          </Button>
        ) : (
          <Button type="submit" icon="arrowForward">
            Senda til birtingar
          </Button>
        )}
      </Inline>
    </Box>
  )
}
