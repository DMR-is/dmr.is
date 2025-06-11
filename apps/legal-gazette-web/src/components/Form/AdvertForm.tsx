import { AlertMessage, Tabs, TabType } from '@island.is/island-ui/core'

import { AdvertDetailedDto, TypeEnum } from '../../gen/fetch'
import { CommonAdvertTab } from './form-tabs/CommonAdvert'

type CommonAdvertFormProps = {
  adverts: AdvertDetailedDto[]
  selected?: string
  onAdvertSelect?: (id: string) => void
}

export const AdvertForm = ({
  adverts,
  selected,
  onAdvertSelect,
}: CommonAdvertFormProps) => {
  const tabs: TabType[] = adverts.map((advert) => {
    switch (advert.type.title) {
      case TypeEnum.COMMON_ADVERT: {
        const { commonAdvert, ...rest } = advert
        return {
          id: advert.id,
          label: `Birting ${advert.version}`,
          content: (
            <CommonAdvertTab advert={rest} commonAdvert={commonAdvert} />
          ),
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
      onChange={(id) => onAdvertSelect?.(id)}
      contentBackground="white"
      selected={selected}
      tabs={tabs}
      label="Auglýsingar"
    />
  )
}
