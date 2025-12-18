import { AlertMessage } from '@dmr.is/ui/components/island-is'

import { StatusDto } from '../../gen/fetch'
import { StatusIdEnum } from '../../lib/constants'

type Props = {
  status: StatusDto
  canEdit: boolean
}
export const AdvertFormAlert = ({ status, canEdit }: Props) => {
  if (status.id === StatusIdEnum.PUBLISHED) {
    return (
      <AlertMessage
        type="success"
        title="Auglýsing útgefin"
        message="Aðeins er hægt að breyta auglýsingum sem ekki er búið að gefa út"
      />
    )
  }

  if (status.id === StatusIdEnum.REJECTED) {
    return (
      <AlertMessage
        type="error"
        title="Auglýsing hafnað"
        message="Ekki er hægt að breyta auglýsingum sem hafa verið hafnaðar"
      />
    )
  }

  if (status.id === StatusIdEnum.WITHDRAWN) {
    return (
      <AlertMessage
        type="warning"
        title="Auglýsing afturkölluð"
        message="Ekki er hægt að breyta auglýsingum sem hafa verið afturkallaðar"
      />
    )
  }

  if (!canEdit) {
    return (
      <AlertMessage
        type="info"
        title="Þú ert ekki skráður sem starfsmaður á þessari auglýsingu"
        message="Ekki er hægt að breyta auglýsingum ef þú ert ekki skráður sem starfsmaður"
      />
    )
  }

  return null
}
