'use client'

import { createContext } from 'react'

import { ApplicationDetailedDto } from '../gen/fetch'

export type ApplicationState = ApplicationDetailedDto

export const ApplicationContext = createContext<ApplicationState>(
  {} as ApplicationState,
)

type Props = {
  application: ApplicationDetailedDto
  children?: React.ReactNode
}

export const ApplicationProvider = ({ application, children }: Props) => {
  return (
    <ApplicationContext.Provider value={application}>
      {children}
    </ApplicationContext.Provider>
  )
}
