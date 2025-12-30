'use client'
import { useFormContext } from 'react-hook-form'

import { BaseApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../../../lib/trpc/client/trpc'

export const PreviewStep = () => {
  const trpc = useTRPC()
  const { getValues } = useFormContext<BaseApplicationWebSchema>()
  const id = getValues('metadata.applicationId')
  const { data, isPending } = useQuery(
    trpc.getPreviewHTML.queryOptions({ applicationId: id }),
  )

  return isPending ? (
    <SkeletonLoader
      repeat={5}
      height={64}
      space={[1, 2]}
      borderRadius="large"
    />
  ) : (
    <AdvertDisplay html={data?.preview} />
  )
}
