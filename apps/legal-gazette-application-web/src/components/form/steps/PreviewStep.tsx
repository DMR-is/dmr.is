'use client'
import { useFormContext } from 'react-hook-form'

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
  const { getValues } = useFormContext<
    RecallApplicationWebSchema | CommonApplicationWebSchema
  >()

  const markup = getApplicationPreview(
    getValues('metadata.type'),
    getValues(),
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
