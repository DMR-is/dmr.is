import { defineMessage } from 'react-intl'

export const messages = {
  general: defineMessage({
    preparePublishing: {
      id: 'web.components.casePublishingTab:preparePublishing',
      defaultMessage: 'Undirbúa útgáfu',
      description: 'Prepare publishing button label',
    },
    selectedCasesForPublishing: {
      id: 'web.components.casePublishingTab:selectedCasesForPublishing',
      defaultMessage: 'Valin mál til útgáfu',
      description: 'Selected cases for publishing heading',
    },
    publishCases: {
      id: 'web.components.casePublishingTab:publishCases',
      defaultMessage: 'Gefa út valin mál',
      description: 'Publish cases button label',
    },
  }),
}
