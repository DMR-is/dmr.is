import { AdvertSidebar } from '../../components/client-components/Form/FormSidebar'
import { AdvertDetailedDto } from '../../gen/fetch'

type AdvertContainerProps = {
  advert: AdvertDetailedDto
}

export function AdvertSidebarContainer({ advert }: AdvertContainerProps) {
  return <AdvertSidebar advert={advert} />
}
