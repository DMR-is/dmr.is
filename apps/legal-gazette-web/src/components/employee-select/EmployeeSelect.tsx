'use client'

import { useMemo } from 'react'

import { useQuery, useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { Select } from '@dmr.is/ui/components/island-is'

import { useUpdateAdvert } from '../../hooks/useUpdateAdvert'
import { StatusIdEnum } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'


type Props = {
  advertId: string
}

export const EmployeeSelect = ({ advertId }: Props) => {
    const trpc = useTRPC()

  const { data: usersData, isLoading } = useQuery(
    trpc.getEmployees.queryOptions(),
  )
  const { data: advert } = useSuspenseQuery(
    trpc.getAdvert.queryOptions({ id: advertId }),
  )

  const assignedUserId = advert.assignedUser?.id
  const currentStatusId = advert.status.id

  const { assignUser, isAssigningUser, assignAndUpdateStatus } =
    useUpdateAdvert(advertId)

  const options = usersData?.users.map((user) => ({
    label: user.name,
    value: user.id,
    disabled: !user.isActive,
  }))

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
