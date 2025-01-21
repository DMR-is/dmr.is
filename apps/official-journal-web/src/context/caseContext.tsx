import { createContext, useEffect, useState } from 'react'

import {
  CaseDetailed,
  CaseStatusTitleEnum,
  CaseTagTitleEnum,
  CommunicationStatusTitleEnum,
} from '../gen/fetch'
import { useCase } from '../hooks/api'

const emptyCase = {
  id: '',
  applicationId: '',
  year: 0,
  caseNumber: '',
  status: {
    id: '',
    title: '' as CaseStatusTitleEnum,
    slug: '',
  },
  tag: {
    id: '',
    title: '' as CaseTagTitleEnum,
    slug: '',
  },
  involvedParty: {
    id: '',
    title: '',
    slug: '',
  },
  createdAt: '',
  modifiedAt: '',
  isLegacy: false,
  assignedTo: null,
  communicationStatus: {
    id: '',
    title: '' as CommunicationStatusTitleEnum,
    slug: '',
  },
  fastTrack: false,
  publishedAt: '',
  requestedPublicationDate: '',
  advertTitle: '',
  advertDepartment: {
    id: '',
    title: '',
    slug: '',
  },
  advertType: {
    id: '',
    title: '',
    slug: '',
  },
  advertCategories: [],
  price: 0,
  paid: false,
  message: null,
  html: '',
  publicationNumber: '',
  channels: [],
  comments: [],
  signatures: [],
  attachments: [],
  additions: [],
}

type CaseState = {
  currentCase: CaseDetailed
  refetch: () => void
  isLoading?: boolean
  isValidating?: boolean
  error?: Error
}

export const CaseContext = createContext<CaseState>({
  currentCase: emptyCase,
  refetch: () => undefined,
  isLoading: false,
  isValidating: false,
  error: undefined,
})

type CaseProviderProps = {
  initalCase: CaseDetailed
  children: React.ReactNode
}

export const CaseProvider = ({ initalCase, children }: CaseProviderProps) => {
  const { mutate, isLoading, error, isValidating } = useCase({
    caseId: initalCase.id,
    options: {
      keepPreviousData: true,
      revalidateOnFocus: false,
      onSuccess: (data) => setCurrentCase(data._case),
    },
  })

  const [currentCase, setCurrentCase] = useState<CaseDetailed>(initalCase)

  const refetch = async () => await mutate()

  return (
    <CaseContext.Provider
      value={{ currentCase, refetch, isLoading, isValidating, error }}
    >
      {children}
    </CaseContext.Provider>
  )
}
