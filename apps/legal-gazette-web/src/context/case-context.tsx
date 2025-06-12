import { createContext, useState } from 'react'
import useSWR from 'swr'

import { toast } from '@island.is/island-ui/core'

import { AdvertDetailedDto, CaseDetailedDto } from '../gen/fetch'
import { fetchCase } from '../lib/api/fetchers'

export type CaseContextState = {
  case: CaseDetailedDto
  selectedAdvert: AdvertDetailedDto
  setSelectedAdvert: (id: string) => void
  refetch: () => void
}

export const CaseContext = createContext<CaseContextState>({
  case: {} as CaseDetailedDto,
  selectedAdvert: {} as AdvertDetailedDto,
  setSelectedAdvert: () => undefined,
  refetch: () => undefined,
})

type CaseProviderProps = {
  initalCase: CaseDetailedDto
  children: React.ReactNode
}

export const CaseProvider = ({ children, initalCase }: CaseProviderProps) => {
  const [currentCase, setCurrentCase] = useState<CaseDetailedDto>(initalCase)
  const [selectedAdvert, setSelectedAdvert] = useState<AdvertDetailedDto>(
    initalCase.adverts[0],
  )

  const handleSelectedAdvert = (id: string) => {
    const advert = currentCase.adverts.find((a) => a.id === id)
    if (!advert) {
      toast.error('Auglýsing fannst ekki', {
        toastId: 'case-context-advert-not-found',
      })
      return
    }

    setSelectedAdvert(advert)
  }

  const { data, mutate } = useSWR(
    ['getCase', initalCase.id],
    ([key, caseId]) => fetchCase(key, caseId),
    {
      keepPreviousData: true,
      fallbackData: currentCase,
      onSuccess: (data) => {
        setCurrentCase(data)

        const selectedAdvert = data.adverts.find(
          (advert) => advert.id === initalCase.adverts[0].id,
        )

        if (!selectedAdvert) {
          toast.error('Auglýsing fannst ekki', {
            toastId: 'case-context-advert-not-found',
          })
          return
        }

        setSelectedAdvert(selectedAdvert)
      },
      onError: (_error) => {
        toast.error('Ekki tókst að sækja mál', {
          toastId: 'case-context-fetch-error',
        })
      },
    },
  )

  return (
    <CaseContext.Provider
      value={{
        case: data as CaseDetailedDto,
        selectedAdvert: selectedAdvert,
        setSelectedAdvert: handleSelectedAdvert,
        refetch: () => mutate(),
      }}
    >
      {children}
    </CaseContext.Provider>
  )
}
