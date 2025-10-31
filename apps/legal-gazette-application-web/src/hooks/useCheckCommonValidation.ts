/* eslint-disable no-console */
import { useFormContext } from 'react-hook-form'

import {
  CommonApplicationSchema,
  commonApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'

export const useCheckCommonValidation = () => {
  const context = useFormContext<CommonApplicationSchema>()

  const checkCommonValidation = async () => {
    const { trigger, getValues } = context
    await trigger()

    const values = getValues()

    const check = commonApplicationSchema.safeParse(values)

    if (check.success) {
      console.log('Common validation passed')
      return true
    } else {
      console.error('Common validation failed', check.error)
      return false
    }
  }

  return { checkCommonValidation }
}
