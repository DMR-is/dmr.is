import _ from 'lodash'
import { useCallback } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import z from 'zod'

import {
  ApplicationTypeEnum,
  BaseApplicationWebSchema,
  CommonApplicationWebSchema,
  RecallApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'
import { Box, Button, Inline } from '@dmr.is/ui/components/island-is'

import { useUpdateApplication } from '../../../hooks/useUpdateApplication'
import { CommonFormSteps } from '../../../lib/forms/common/steps'
import * as styles from './application-footer.css'

const setFormErrors = (
  errorTree: any,
  setError: ReturnType<
    typeof useFormContext<
      RecallApplicationWebSchema | CommonApplicationWebSchema
    >
  >['setError'],
  basePath = '',
) => {
  if (!errorTree) return

  // If this level has errors, set them
  if (
    errorTree.errors &&
    Array.isArray(errorTree.errors) &&
    errorTree.errors.length > 0
  ) {
    setError(basePath as any, {
      type: 'validation',
      message: errorTree.errors[0], // Use first error message
    })
  }

  // If this level has properties, recurse into them
  if (errorTree.properties && typeof errorTree.properties === 'object') {
    Object.entries(errorTree.properties).forEach(([key, value]) => {
      const newPath = basePath ? `${basePath}.${key}` : key
      setFormErrors(value, setError, newPath)
    })
  }
}

export const ApplicationFooter = () => {
  const { getValues, setValue, setError, clearErrors } =
    useFormContext<BaseApplicationWebSchema>()
  const id = getValues('metadata.applicationId')
  const { updateApplication, isUpdatingApplication } = useUpdateApplication({
    id: id,
    type: 'COMMON',
  })

  const metadata = getValues('metadata')
  const { currentStep, totalSteps } = metadata
  const canProceed = useWatch({ name: 'metadata.canProceed' })

  const canContinue = currentStep < totalSteps - 1 && canProceed !== false
  const canGoBack = currentStep > 0
  const isLastStep = currentStep + 1 === totalSteps

  const goBack = useCallback(() => {
    if (!canGoBack) return
    updateApplication(
      { currentStep: currentStep - 1 },
      {
        onSuccessCallback: () => {
          clearErrors()
          setValue('metadata.currentStep', currentStep - 1)
        },
      },
    )
  }, [canGoBack, updateApplication, currentStep, setValue])

  const goForward = useCallback(() => {
    if (!canContinue) return

    switch (metadata.type) {
      case ApplicationTypeEnum.COMMON: {
        const validationSchema =
          CommonFormSteps.steps[currentStep].validationSchema

        if (!validationSchema) {
          break
        }

        const { metadata: _metadata, ...answers } = getValues()
        const check = validationSchema.safeParse(answers)

        if (!check.success) {
          const errors = z.treeifyError(check.error)

          // Set form errors using the utility function
          setFormErrors(errors, setError)

          return
        }

        break
      }
    }

    updateApplication(
      { currentStep: currentStep + 1 },
      {
        onSuccessCallback: () => {
          setValue('metadata.currentStep', currentStep + 1)
        },
      },
    )
  }, [
    canContinue,
    updateApplication,
    currentStep,
    setValue,
    metadata.type,
    setError,
  ])
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
