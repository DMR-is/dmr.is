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

  actions: defineMessages({
    title: {
      id: 'web.page.caseSingle:actions.title',
      defaultMessage: 'Upplýsingar',
      description: '',
    },
    assignedTo: {
      id: 'web.page.caseSingle:actions.assignedTo',
      defaultMessage: 'Starfsmaður',
      description: '',
    },
    assignedToPlaceholder: {
      id: 'web.page.caseSingle:actions.assignedToPlaceholder',
      defaultMessage: 'Úthluta máli á starfsmann',
      description: '',
    },
    status: {
      id: 'web.page.caseSingle:actions.status',
      defaultMessage: 'Staða',
      description: '',
    },
    communicationsStatus: {
      id: 'web.page.caseSingle:actions.communicationsStatus',
      defaultMessage: 'Samskiptastaða',
      description: '',
    },
    rejectCase: {
      id: 'web.page.caseSingle:actions.rejectCase',
      defaultMessage: 'Hafna máli',
    },
    unpublishCase: {
      id: 'web.page.caseSingle:actions.unpublishCase',
      defaultMessage: 'Taka mál úr birtingu',
    },
  }),

  paging: defineMessages({
    goBack: {
      id: 'web.page.caseSingle:paging.goBack',
      defaultMessage: 'Til baka',
      description: '',
    },
    goBackOverview: {
      id: 'web.page.caseSingle:paging.goBackOverview',
      defaultMessage: 'Til baka í yfirlit',
      description: '',
    },
    nextStep: {
      id: 'web.page.caseSingle:actions.nextStep',
      defaultMessage: 'Næsta skref',
      description: '',
    },
    assignedToPlaceholder: {
      id: 'web.page.caseSingle:actions.assignedToPlaceholder',
      defaultMessage: 'Úthluta máli á starfsmann',
      description: '',
    },
    status: {
      id: 'web.page.caseSingle:actions.status',
      defaultMessage: 'Staða',
      description: '',
    },
    fixStep: {
      id: 'web.page.caseSingle:actions.fixStep',
      defaultMessage: 'Leiðrétta',
      description: '',
    },
    confirmFixStep: {
      id: 'web.page.caseSingle:actions.confirmFixStep',
      defaultMessage: 'Birta leiðréttingu',
      description: '',
    },
    unpublish: {
      id: 'web.page.caseSingle:actions.unpublish',
      defaultMessage: 'Taka mál úr birtingu',
      description: '',
    },
    unpublishDisabledExplanation: {
      id: 'web.page.caseSingle:actions.unpublishDisabledExplanation',
      defaultMessage: 'Bæta þarf við athugasemd til þess að leiðrétta mál',
      description: '',
    },
    toPublishing: {
      id: 'web.page.caseSingle:actions.toPublishing',
      defaultMessage: 'Fara í útgáfu',
      description: '',
    },
  }),
}
