import { defineMessages } from 'react-intl'

export const messages = {
  general: defineMessages({
    backToPublishing: {
      id: 'web.page.caseSingle:general.backToPublishing',
      defaultMessage: 'Til baka í útgáfu mála',
      description: 'Back to publishing button label for the dashboard',
    },
    publishAllCases: {
      id: 'web.page.caseSingle:general.publishCases',
      defaultMessage: 'Gefa út öll mál',
      description: 'Publish cases button label for the dashboard',
    },
  }),
  breadcrumbs: defineMessages({
    dashboard: {
      id: 'web.page.caseSingle:breadcrumbs.dashboard',
      defaultMessage: 'Stjórnartíðindi',
      description: 'Dashboard breadcrumb for the dashboard',
    },
    caseOverview: {
      id: 'web.page.caseSingle:breadcrumbs.casePublishing',
      defaultMessage: 'Ritstjórn',
      description: 'Editorial breadcrumb for the dashboard',
    },
    case: {
      id: 'web.page.caseSingle:breadcrumbs.case',
      defaultMessage: 'Vinnslusvæði',
      description: 'Editing breadcrumb for the dashboard',
    },
  }),
  banner: defineMessages({
    title: {
      id: 'web.page.caseSingle:banner.title',
      defaultMessage: 'Vinnslusvæði Stjórnartíðinda',
      description: 'Banner title for the caseSingle',
    },
    description: {
      id: 'web.page.caseSingle:banner.description',
      defaultMessage:
        'Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
      description: 'Banner description for the caseSingle',
    },
  }),
}
