'use client'

import { Select, SkeletonLoader } from '@dmr.is/ui/components/island-is'

import { useUpdateAdvert } from '../../hooks/useUpdateAdvert'
import { StatusIdEnum } from '../../lib/constants'

type Props = {
  advertId: string
  currentStatusId?: string
  assignedUserId?: string
  options?: { label: string; value: string }[]
  isLoading?: boolean
}

export const EmployeeSelect = ({
  advertId,
  currentStatusId,
  assignedUserId,
  options,
  isLoading,
}: Props) => {
  const { assignUser, isAssigningUser, assignAndUpdateStatus } =
    useUpdateAdvert(advertId)

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
        if (currentStatusId === StatusIdEnum.SUBMITTED) {
          return assignAndUpdateStatus({ userId: opt.value, id: advertId })
        }
        return assignUser(opt.value)
      }}
    />
  )
}
