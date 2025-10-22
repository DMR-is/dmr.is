'use client'

import { useMemo } from 'react'

import {
  Box,
  Button,
  Input,
  Select,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { LinkV2 } from '@island.is/island-ui/core'

import { AdvertDetailedDto } from '../../gen/fetch'
import { useUpdateAdvert } from '../../hooks/useUpdateAdvert'
import { Route } from '../../lib/constants'
import { trpc } from '../../lib/trpc/client'
import { ChangeStatusButtons } from '../buttons/ChangeStatusButtons'
import { AdvertFormStepper } from './AdvertFormStepper'
import * as styles from './Form.css'

type AdvertSidebarProps = {
  advert: AdvertDetailedDto
}

export const AdvertSidebar = ({ advert }: AdvertSidebarProps) => {
  const { assignUser } = useUpdateAdvert(advert.id as string)
  const { data: usersData, isLoading: isLoadingEmployees } =
    trpc.users.getEmployees.useQuery()

  const employeeOptions = useMemo(
    () =>
      usersData
        ? usersData.users?.map((user) => ({
            label: user.name,
            value: user.id,
          }))
        : [],
    [usersData],
  )

  const defaultEmployee = usersData?.users?.find(
    (user) => user.id === advert.assignedUser,
  )

  return (
    <Box className={styles.advertSideBarStyle}>
      <Stack space={2}>
        <LinkV2 href={Route.RITSTJORN}>
          <Button
            variant="text"
            size="small"
            preTextIcon="arrowBack"
            preTextIconType="outline"
            fluid
          >
            Til baka í auglýsingar
          </Button>
        </LinkV2>
        <Select
          isLoading={isLoadingEmployees}
          key={`select-employee-${defaultEmployee?.id}`}
          label="Starfsmaður"
          options={employeeOptions}
          value={
            defaultEmployee
              ? { label: defaultEmployee.name, value: defaultEmployee.id }
              : undefined
          }
          size="sm"
          onChange={(option) => {
            if (!option) return
            assignUser(option.value)
          }}
        />
        <Box background="white">
          <Input
            disabled={!advert.canEdit}
            name="advert-status"
            readOnly
            value={advert.status.title}
            size="sm"
            label="Staða auglýsingar"
          />
        </Box>

        <ChangeStatusButtons
          advertId={advert.id}
          currentStatus={advert.status}
          canEdit={advert.canEdit}
        />

        <AdvertFormStepper />
      </Stack>
    </Box>
  )
}
