'use client'
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import z from 'zod'

import {
  CommonApplicationSchema,
  commonApplicationSchema,
  RecallApplicationSchema,
  recallApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'
import { Box, Stack, Text } from '@dmr.is/ui/components/island-is'
import { Bullet, BulletList } from '@dmr.is/ui/components/island-is'

import { getDotNotationPaths, getErrors } from '../../lib/utils'
import * as styles from './application.css'

export const ApplicationSidebar = () => {
  const { getValues, formState } = useFormContext<
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
      </Stack>
    </Box>
  )
}
