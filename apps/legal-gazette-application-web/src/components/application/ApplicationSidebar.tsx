'use client'
import { useMemo, useState } from 'react'
import AnimateHeight from 'react-animate-height'
import { useFormContext } from 'react-hook-form'
import z from 'zod'

import {
  ApplicationTypeEnum,
  commonApplicationSchema,
  CommonApplicationWebSchema,
  recallApplicationSchema,
  RecallApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'
import { Box, Button, Stack, Text } from '@dmr.is/ui/components/island-is'

import { getErrors } from '../../lib/utils'
import * as styles from './application.css'

export const ApplicationSidebar = () => {
  const [showValidation, setShowValidation] = useState(true)
  const { getValues, formState } = useFormContext<
    RecallApplicationWebSchema | CommonApplicationWebSchema
  >()

  const applicationType = getValues('metadata.type')

  const application = getValues()

  const commonResult = useMemo(
    () => commonApplicationSchema.safeParse(application),
    [application],
  )
  const recallResult = useMemo(
    () => recallApplicationSchema.safeParse(application),
    [application],
  )

  const validatedErrors = useMemo(() => {
    const errors = getErrors(
      applicationType === ApplicationTypeEnum.COMMON
        ? commonResult.error
          ? z.treeifyError(commonResult.error)
          : []
        : recallResult.error
          ? z.treeifyError(recallResult.error)
          : [],
    ).flatMap((err) => err)

    return errors
  }, [commonResult.error, recallResult.error, applicationType])

  const handleScrollToField = (path: string) => {
    const element = document.getElementById(path)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <Box className={styles.sidebarStyles}>
      <Stack space={3}>
        <Stack space={2}>
          <Text variant="h4">Athugsemdir</Text>
          {validatedErrors.length === 0 && <Text>Engar athugasemdir</Text>}
          <AnimateHeight height={showValidation ? 'auto' : 0}>
            <ul>
              <Stack space={1}>
                {validatedErrors.map((err, i) => (
                  <li key={i}>
                    <Button
                      size="small"
                      icon="arrowForward"
                      iconType="outline"
                      variant="text"
                      colorScheme="destructive"
                      onClick={() => handleScrollToField(err.path)}
                    >
                      {err.errors.join(', ')}
                    </Button>
                  </li>
                ))}
              </Stack>
            </ul>
          </AnimateHeight>
        </Stack>
        <Button
          fluid
          disabled={!formState.isReady}
          size="small"
          icon={showValidation ? 'eyeOff' : 'eye'}
          iconType="outline"
          onClick={() => setShowValidation((prev) => !prev)}
        >
          <Text fontWeight="semiBold" color="white" variant="medium">
            {showValidation ? 'Fela athugasemdir' : 'Sjá athugsemdir'}
          </Text>
        </Button>
      </Stack>
    </Box>
  )
}
