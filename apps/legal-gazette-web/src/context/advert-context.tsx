'use client'

import { useSession } from 'next-auth/react'

import { createContext } from 'react'

import {
  AdvertDetailedDto,
  CategoryDto,
  CourtDistrictDto,
  TypeDto,
} from '../gen/fetch'

export type AdvertContextState = {
  advert: AdvertDetailedDto
  categories: CategoryDto[]
  courtDistricts: CourtDistrictDto[]
  types: TypeDto[]
  canEdit: boolean
}

export const AdvertContext = createContext<AdvertContextState>(
  {} as AdvertContextState,
)

export type AdvertProviderProps = {
  children?: React.ReactNode
  advert: AdvertDetailedDto
  categories: CategoryDto[]
  types: TypeDto[]
  courtDistricts: CourtDistrictDto[]
}

export const AdvertProvider = ({
  children,
  advert,
  categories,
  types,
  courtDistricts,
}: AdvertProviderProps) => {
  const session = useSession()
  const currentUserId = session.data?.user.id

  const canEdit = advert.assignedUser === currentUserId

  return (
    <AdvertContext.Provider
      value={{ advert, categories, types, courtDistricts, canEdit }}
    >
      {children}
    </AdvertContext.Provider>
  )
}
