import { defineMessages } from 'react-intl'

export const errorMessages = defineMessages({
  unknownAdvertType: {
    id: 'lg.web.error.unknownAdvertType',
    defaultMessage: 'Óþekkt tegund auglýsingar',
    description: 'Error message when the advert type is unknown',
  },
  unknownAdvertTypeMessage: {
    id: 'lg.web.error.unknownAdvertTypeMessage',
    defaultMessage: 'Óþekkt tegund auglýsingar: {advertType}',
    description: 'Detailed error message when the advert type is unknown',
  },
  advertNotFound: {
    id: 'lg.web.error.advertNotFound',
    defaultMessage: 'Auglýsing fannst ekki',
    description: 'Error message when an advert is not found',
  },
  advertNotFoundMessage: {
    id: 'lg.web.error.advertNotFoundMessage',
    defaultMessage: 'Auglýsing með auðkenni {advertId} fannst ekki.',
    description: 'Detailed error message when an advert is not found',
  },
})
