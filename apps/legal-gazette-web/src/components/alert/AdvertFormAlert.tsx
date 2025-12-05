import { AlertMessage } from '@dmr.is/ui/components/island-is'

import { StatusDto, StatusEnum } from '../../gen/fetch'

type Props = {
  status: StatusDto
  canEdit: boolean
}
export const AdvertFormAlert = ({ status, canEdit }: Props) => {
  if (status.title === StatusEnum.ÚTgefið) {
    return (
      <AlertMessage
        type="success"
        title="Auglýsing útgefin"
        message=" auglýsingar sem eru ekki útgefnar er hægt að breyta"
      />
    )
  }

  if (status.title === StatusEnum.Hafnað) {
    return (
      <AlertMessage
        type="error"
        title="Auglýsing hafnað"
        message="Ekki er hægt að breyta auglýsingum sem hafa verið hafnaðar"
      />
    )
  }

  if (status.title === StatusEnum.Afturkallað) {
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
