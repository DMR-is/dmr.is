'use client'
import { useState } from 'react'
import AnimateHeight from 'react-animate-height'
import { useFormContext } from 'react-hook-form'

import {
  CommonApplicationWebSchema,
  parseFormstateErrors,
  RecallApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'
import { Box, Button, Stack, Text } from '@dmr.is/ui/components/island-is'

import * as styles from './application.css'

export const ApplicationSidebar = () => {
  const [showValidation, setShowValidation] = useState(true)
  const { formState, clearErrors } = useFormContext<
    RecallApplicationWebSchema | CommonApplicationWebSchema
  >()

  const parsedErrors = parseFormstateErrors(formState.errors)

  const handleFieldNavigation = (fieldPath: string) => {
    let element = document.querySelector(`[name="${fieldPath}"]`) as HTMLElement

    if (!element) element = document.getElementById(fieldPath) as HTMLElement

    if (!element) return

    clearErrors(fieldPath as any)
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.focus()
  }

  return (
    <Box className={styles.sidebarStyles}>
      <Stack space={3}>
        <Stack space={2}>
          <Text variant="h4">Athugasemdir</Text>
          {parsedErrors.length === 0 && <Text>Engar athugasemdir</Text>}
          <AnimateHeight height={showValidation ? 'auto' : 0}>
            <ul>
              <Stack space={1}>
                {parsedErrors.map((err, i) => (
                  <li key={i}>
                    <Button
                      size="small"
                      icon="arrowForward"
                      iconType="outline"
                      variant="text"
                      colorScheme="destructive"
                      onClick={() => handleFieldNavigation(err.path)}
                    >
                      {err.message}
                    </Button>
                  </li>
                ))}
              </Stack>
            </ul>
          </AnimateHeight>
        </Stack>
        {parsedErrors.length > 0 && (
          <Button
            fluid
            disabled={!formState.isReady}
            size="small"
            icon={showValidation ? 'eyeOff' : 'eye'}
            iconType="outline"
            onClick={() => setShowValidation((prev) => !prev)}
          >
            <Text fontWeight="semiBold" color="white" variant="medium">
              {showValidation ? 'Fela athugasemdir' : 'Sjá athugasemdir'}
            </Text>
          </Button>
        )}
      </Stack>
    </Box>
  )
}
