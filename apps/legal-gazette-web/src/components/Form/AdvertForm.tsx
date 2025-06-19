import { useRouter } from 'next/router'

import { useIntl } from 'react-intl'

import { AlertMessage, Tabs, TabType } from '@island.is/island-ui/core'

import { TypeEnum } from '../../gen/fetch'
import { useCaseContext } from '../../hooks/cases/useCase'
import { errorMessages } from '../../lib/messages/errors/messages'
import { ritstjornSingleMessages } from '../../lib/messages/ritstjorn/single'
import { CommonAdvertTab } from './form-tabs/CommonAdvert'

export const AdvertForm = () => {
  const { case: theCase, selectedAdvert, setSelectedAdvert } = useCaseContext()
  const router = useRouter()
  const { formatMessage } = useIntl()
  const adverts = theCase.adverts

  const handleTabChange = (id: string) => {
    const advert = adverts.find((advert) => advert.id === id)
    if (advert) {
      setSelectedAdvert(id)
      router.query.tab = id
      router.replace(router, undefined, { shallow: true })
    }
  }

  const tabs: TabType[] = adverts.map((advert, index) => {
    switch (advert.type.title) {
      case TypeEnum.COMMON_ADVERT: {
        return {
          id: advert.id,
          label: formatMessage(ritstjornSingleMessages.tabs.title, {
            version: advert.version,
          }),
          content: <CommonAdvertTab key={index} />,
        }
      }
      default: {
        return {
          id: advert.id,
          label: formatMessage(errorMessages.unknownAdvertType),
          content: (
            <AlertMessage
              key={index}
              type="warning"
              title={formatMessage(errorMessages.unknownAdvertTypeMessage, {
                advertType: advert.type.title,
              })}
            />
          ),
        }
      }
    }
  })

  return (
    <Tabs
      onChange={handleTabChange}
      contentBackground="white"
      selected={selectedAdvert.id}
      tabs={tabs}
      label=""
    />
  )
}
