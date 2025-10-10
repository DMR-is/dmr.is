'use client'

import { useMemo } from 'react'

import {
  Box,
  Button,
  Input,
  Select,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { LinkV2 } from '@island.is/island-ui/core'

import { AdvertDetailedDto, StatusEnum, StatusIdEnum } from '../../../gen/fetch'
import { useUpdateAdvert } from '../../../hooks/useUpdateAdvert'
import { Route } from '../../../lib/constants'
import { trpc } from '../../../lib/trpc/client'
import { AdvertFormStepper } from './AdvertFormStepper'
import * as styles from './Form.css'

type AdvertSidebarProps = {
  advert: AdvertDetailedDto
}

export const AdvertSidebar = ({ advert }: AdvertSidebarProps) => {
  const { assignUser, changeAdvertStatus, isChangingAdvertStatus } =
    useUpdateAdvert(advert.id as string)
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
  const isSubmitted = advert?.status.title === StatusEnum.Innsent
  const shouldShowButton =
    advert?.status.title === StatusEnum.TilbúiðTilÚtgáfu ||
    advert?.status.title === StatusEnum.Innsent

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
            name="advert-status"
            readOnly
            value={advert.status.title}
            size="sm"
            label="Staða auglýsingar"
          />
        </Box>

        {shouldShowButton && (
          <Button
            size="small"
            fluid
            icon={isSubmitted ? 'arrowForward' : 'arrowBack'}
            iconType="outline"
            disabled={isChangingAdvertStatus}
            onClick={() =>
              changeAdvertStatus(
                isSubmitted
                  ? StatusIdEnum.READY_FOR_PUBLICATION
                  : StatusIdEnum.SUBMITTED,
              )
            }
          >
            <Text color="white" variant="small" fontWeight="semiBold">
              {isSubmitted ? 'Færa í tilbúið til útgáfu' : 'Færa í innsent'}
            </Text>
          </Button>
        )}

        <AdvertFormStepper />
      </Stack>
    </Box>
  )
}
