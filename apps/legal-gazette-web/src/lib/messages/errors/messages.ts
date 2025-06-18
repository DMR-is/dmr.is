import { defineMessages } from 'react-intl'

export const errorMessages = defineMessages({
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
