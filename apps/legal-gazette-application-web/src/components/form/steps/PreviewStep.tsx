'use client'
import { useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

import {
  getApplicationPreview,
} from '@dmr.is/legal-gazette/html'
import {
  CommonApplicationWebSchema,
  RecallApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'
import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
import { Problem } from '@dmr.is/ui/components/Problem/Problem'



export const PreviewStep = () => {
  const { control, getValues } = useFormContext<
    RecallApplicationWebSchema | CommonApplicationWebSchema
  >()

  const values = useWatch({ control })
  const markup = useMemo(
    () => getApplicationPreview(getValues('metadata.type'), getValues()),
    [getValues, values],
  )

  if (markup.error !== null) {
    return (
      <Problem
        type="bad-request"
        title="Ekki tókst að búa til forskoðunarskjal"
        message="Gögn í umsókninni eru óglid eða ekki til staðar"
      />
    )
  }

  return <AdvertDisplay html={markup.html} />
}
