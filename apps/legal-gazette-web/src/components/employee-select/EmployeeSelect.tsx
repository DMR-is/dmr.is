'use client'

import { Select, SkeletonLoader } from '@dmr.is/ui/components/island-is'

import { useUpdateAdvert } from '../../hooks/useUpdateAdvert'

type Props = {
  advertId: string
  assignedUserId?: string
  options?: { label: string; value: string }[]
  isLoading?: boolean
}

export const EmployeeSelect = ({
  advertId,
  assignedUserId,
  options,
  isLoading,
}: Props) => {
  const { assignUser, isAssigningUser } = useUpdateAdvert(advertId)

  if (isLoading) {
    return (
      <SkeletonLoader background="purple200" height={64} borderRadius="large" />
    )
  }

  if (!options) {
    return null
  }

  const selected = options.find((option) => option.value === assignedUserId)

  return (
    <Select
      size="sm"
      label="Starfsmaður"
      options={options}
      isLoading={isAssigningUser}
      defaultValue={selected}
      onChange={(opt) => {
        if (!opt) return
        return assignUser(opt.value)
      }}
    />
  )
}
