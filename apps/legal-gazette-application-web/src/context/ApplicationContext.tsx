import React, { createContext, ReactNode, useContext, useState } from 'react'

interface ApplicationContextProps {
  caseId: string
  applicationId: string
  status: string
  setCaseId: (caseId: string) => void
  setApplicationId: (applicationId: string) => void
  setStatus: (status: string) => void
}

const ApplicationContext = createContext<ApplicationContextProps | undefined>(
  undefined,
)

export const ApplicationContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [caseId, setCaseId] = useState<string>('')
  const [applicationId, setApplicationId] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  return (
    <ApplicationContext.Provider
      value={{
        caseId,
        applicationId,
        status,
        setCaseId,
        setApplicationId,
        setStatus,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  )
}

export const useApplicationContext = (): ApplicationContextProps => {
  const context = useContext(ApplicationContext)
  if (!context) {
    throw new Error(
      'useApplicationContext must be used within an ApplicationProvider',
    )
  }
  return context
}
