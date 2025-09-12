'use client'

import { createContext } from 'react'

import { AdvertDetailedDto, CategoryDto, TypeDto } from '../gen/fetch'

export type AdvertContextState = {
  advert: AdvertDetailedDto
  categories: CategoryDto[]
  types: TypeDto[]
}

export const AdvertContext = createContext<AdvertContextState>(
  {} as AdvertContextState,
)

export type AdvertProviderProps = {
  children?: React.ReactNode
  advert: AdvertDetailedDto
  categories: CategoryDto[]
  types: TypeDto[]
}

export const AdvertProvider = ({
  children,
  advert,
  categories,
  types,
}: AdvertProviderProps) => {
  return (
    <AdvertContext.Provider value={{ advert, categories, types }}>
      {children}
    </AdvertContext.Provider>
  )
}
