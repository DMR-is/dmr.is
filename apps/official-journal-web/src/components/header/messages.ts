import { defineMessages } from 'react-intl'

export const messages = {
  general: defineMessages({
    controlPanelTitle: {
      id: 'web.components.header:controlPanelTitle',
      defaultMessage: 'Stjórnborð',
      description: 'Control panel title heading for the dashboard',
    },
    controlPanelProject: {
      id: 'web.components.header:controlPanelProject',
      defaultMessage: 'Stjórnartíðindi',
      description: 'Control panel description for the dashboard',
    },
  }),
  auth: defineMessages({
    user: {
      id: 'web.components.auth:user',
      defaultMessage: 'Notandi',
      description: '',
    },
    logout: {
      id: 'web.components.auth:logout',
      defaultMessage: 'Útskrá',
      description: '',
    },
  }),
}
