import { AlertMessage, Tabs, TabType } from '@island.is/island-ui/core'

import { TypeEnum } from '../../gen/fetch'
import { useCaseContext } from '../../hooks/cases/useCase'
import { CommonAdvertTab } from './form-tabs/CommonAdvert'

export const AdvertForm = () => {
  const { case: theCase, selectedAdvert, setSelectedAdvert } = useCaseContext()

  const adverts = theCase.adverts

  const tabs: TabType[] = adverts.map((advert) => {
    switch (advert.type.title) {
      case TypeEnum.COMMON_ADVERT: {
        return {
          id: advert.id,
          label: `Birting ${advert.version}`,
          content: <CommonAdvertTab />,
        }
      }
      default: {
        return {
          id: advert.id,
          label: 'Óþekkt tegund',
          content: (
            <AlertMessage type="warning" title="Óþekkt tegund auglýsingar" />
          ),
        }
      }
    }
  })

  return (
    <Tabs
      onChange={(id) => setSelectedAdvert(id)}
      contentBackground="white"
      selected={selectedAdvert.id}
      tabs={tabs}
      label="Auglýsingar"
    />
  )
}
