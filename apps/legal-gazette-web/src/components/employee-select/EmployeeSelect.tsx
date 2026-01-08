'use client'

import { useMemo } from 'react'

import { Select } from '@dmr.is/ui/components/island-is'

import { useUpdateAdvert } from '../../hooks/useUpdateAdvert'
import { StatusIdEnum } from '../../lib/constants'

type Props = {
  advertId: string
  currentStatusId?: string
  assignedUserId?: string
  options?: { label: string; value: string; disabled?: boolean }[]
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

  const selected = options?.find((option) => option.value === assignedUserId)

  const filteredOptions = useMemo(() => {
    if (!options) return []
    return options?.filter((option) => {
      if (option.value === assignedUserId) {
        return true
      }

      return !option.disabled
    })
  }, [selected, options])

  return (
    <Select
      size="sm"
      label="Starfsmaður"
      options={filteredOptions}
      isLoading={isLoading || isAssigningUser}
      value={selected}
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
