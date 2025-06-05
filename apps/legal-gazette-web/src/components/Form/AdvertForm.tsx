import { AlertMessage, Tabs, TabType } from '@island.is/island-ui/core'

import { AdvertDetailedDto, AdvertTypeEnum } from '../../gen/fetch'
import { CommonAdvertTab } from './form-tabs/CommonAdvert'

type CommonAdvertFormProps = {
  adverts: AdvertDetailedDto[]
}

export const AdvertForm = ({ adverts }: CommonAdvertFormProps) => {
  const tabs: TabType[] = adverts.map((advert) => {
    switch (advert.type.title) {
      case AdvertTypeEnum.COMMON_ADVERT: {
        const { commonAdvert, ...rest } = advert
        return {
          label: `Birting ${advert.version}`,
          content: (
            <CommonAdvertTab advert={rest} commonAdvert={commonAdvert} />
          ),
        }
      }
      default: {
        return {
          label: 'Óþekkt tegund',
          content: (
            <AlertMessage type="warning" title="Óþekkt tegund auglýsingar" />
          ),
        }
      }
    }
  })

  return <Tabs contentBackground="white" tabs={tabs} label="Auglýsingar" />
}
