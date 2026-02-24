import { useCallback } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import * as z from 'zod'

import {
  ApplicationTypeEnum,
  BaseApplicationWebSchema,
  CommonApplicationWebSchema,
  RecallApplicationWebSchema,
} from '@dmr.is/legal-gazette-schemas'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'

import { useLocalFormStorage } from '../../../hooks/useLocalFormStorage'
import { useUpdateApplication } from '../../../hooks/useUpdateApplication'
import { CommonFormSteps } from '../../../lib/forms/common/steps'
import { RecallFormSteps } from '../../../lib/forms/recall/steps'
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
  const { getMergedData } = useLocalFormStorage(id)
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

    // Get all form values and merge with localStorage
    const { metadata: _metadata, ...answers } = getValues()
    const mergedAnswers = getMergedData(answers)

    // Submit all data to server on navigation (both directions save)
    updateApplication(
      { ...mergedAnswers, currentStep: currentStep - 1 },
      {
        onSuccessCallback: () => {
          clearErrors()
          setValue('metadata.currentStep', currentStep - 1)
        },
      },
    )
  }, [canGoBack, updateApplication, currentStep, setValue, getValues, getMergedData, clearErrors])

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
      case ApplicationTypeEnum.RECALL_BANKRUPTCY:
      case ApplicationTypeEnum.RECALL_DECEASED: {
        const validationSchema = RecallFormSteps(metadata.type).steps[
          currentStep
        ].validationSchema

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

    // Get all form values and merge with localStorage
    const { metadata: _formMetadata, ...allAnswers } = getValues()
    const mergedAnswers = getMergedData(allAnswers)

    // Submit all data to server on navigation
    updateApplication(
      { ...mergedAnswers, currentStep: currentStep + 1 },
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
    getValues,
    getMergedData,
  ])
  return (
    <Box
      paddingY={[2, 2, 4, 5]}
      paddingX={[2, 2, 4, 12]}
      background="white"
      borderTopWidth="standard"
      borderColor="purple100"
      className={styles.shellFooter}
    >
      <Inline justifyContent="spaceBetween" alignY="center" space={1}>
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
