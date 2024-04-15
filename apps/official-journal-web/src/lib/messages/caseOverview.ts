import { defineMessages } from 'react-intl'

export const messages = {
  general: defineMessages({
    departments: {
      id: 'web.page.caseOverview:general.departments',
      defaultMessage: 'Deildir',
      description: '',
    },
  }),
  breadcrumbs: defineMessages({
    dashboard: {
      id: 'web.page.caseOverview:breadcrumbs.dashboard',
      defaultMessage: 'Stjórnartíðindi',
      description: 'Breadcrumb for the dashboard',
    },
    casePublishing: {
      id: 'web.page.caseOverview:breadcrumbs.casePublishing',
      defaultMessage: 'Heildaryfirlit',
      description: 'Breadcrumb for the case publishing page',
    },
  }),
  banner: defineMessages({
    title: {
      id: 'web.page.caseOverview:banner.title',
      defaultMessage: 'Heildaryfirlit',
      description: 'Title for the banner on the case overview page',
    },
    description: {
      id: 'web.page.caseOverview:banner.description',
      defaultMessage:
        'Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
      description: 'Description for the banner on the case overview page',
    },
  }),
}
