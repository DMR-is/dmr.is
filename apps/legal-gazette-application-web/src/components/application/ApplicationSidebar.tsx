/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import z from 'zod'

import {
  CommonApplicationSchema,
  commonApplicationSchema,
  RecallApplicationSchema,
  recallApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'
import {
  Box,
  Bullet,
  BulletList,
  Button,
  Stack,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'

import { getDotNotationPaths, getErrors } from '../../lib/utils'
import * as styles from './application.css'

export const ApplicationSidebar = () => {
  const [didTrigger, setDidTrigger] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const { getValues, formState, trigger, setValue } = useFormContext<
    RecallApplicationSchema | CommonApplicationSchema
  >()

  const application = getValues()

  const commonResult = commonApplicationSchema.safeParse(application)
  const recallResult = recallApplicationSchema.safeParse(application)

  const validatedErrors = useMemo(() => {
    const errors = getErrors(
      application.fields.type === 'COMMON'
        ? commonResult.error
          ? z.treeifyError(commonResult.error)
          : []
        : recallResult.error
          ? z.treeifyError(recallResult.error)
          : [],
    ).flatMap((err) => err)

    const dottedPaths = getDotNotationPaths(formState.touchedFields)

    const filteredErrors = errors.filter((error) =>
      dottedPaths.includes(error.path),
    )

    return filteredErrors
  }, [
    formState.touchedFields,
    commonResult.error,
    recallResult.error,
    application.fields.type,
  ])

  const triggerValidation = useCallback(async () => {
    const validate = async () => {
      try {
        setIsValidating(true)
        const isValid = await trigger()

        if (isValid) {
          return
        }
      } catch (e) {
        toast.error('Ekki tókst að yfirfara gögnin')
      } finally {
        setIsValidating(false)
      }
    }

    await validate()
  }, [trigger])

  useEffect(() => {
    if (didTrigger) {
      setDidTrigger(false)
    }

    const errors = Object.values(formState.errors)

    const paths = errors
      .map((error) => {
        const paths = getDotNotationPaths(error as object)
        const pathsToUse = paths.map((p) => `fields.${p}`)
        const formattedPaths = pathsToUse.map((path) => {
          const parts = path.split('.')
          // Remove last element
          parts.pop()
          if (parts[parts.length - 1] === 'ref') {
            parts.pop()
          }
          return parts.join('.')
        })

        return formattedPaths
      })
      .flat()

    const uniquePaths = Array.from(new Set(paths))

    uniquePaths.forEach((path) => {
      const currentValue = getValues(path as any) || ''

      setValue(path as any, currentValue, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
    })
  }, [formState.errors, didTrigger])

  return (
    <Box className={styles.sidebarStyles}>
      <Stack space={2}>
        <Text variant="h4">Athugsemdir</Text>
        <BulletList>
          <Stack space={1}>
            {validatedErrors.map((err, i) => (
              <Bullet key={i}>
                <div>{err.errors.join(', ')}</div>
              </Bullet>
            ))}
          </Stack>
        </BulletList>
        <Button
          fluid
          loading={isValidating}
          size="small"
          icon="checkmarkCircle"
          iconType="outline"
          onClick={async () => {
            await triggerValidation()
            setDidTrigger(true)
          }}
        >
          Yfirfara athugasemdir
        </Button>
      </Stack>
    </Box>
  )
}
