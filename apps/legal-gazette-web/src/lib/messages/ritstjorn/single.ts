import { defineMessages } from 'react-intl'

export const ritstjornSingleMessages = {
  common: defineMessages({
    title: {
      id: 'lg.web:ritstjorn.single.title',
      defaultMessage: 'Vinnslusvæði Lögbirtingablaðs',
      description: 'Title for the ritstjórn single page',
    },
    intro: {
      id: 'lg.web:ritstjorn.single.intro',
      defaultMessage:
        'Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
      description: 'Subtitle for the ritstjórn single page',
    },
    caseNumber: {
      id: 'lg.web:ritstjorn.single.caseNumber',
      defaultMessage: 'Mál nr. {caseNumber}',
      description: 'Case number displayed in ritstjórn single page',
    },
  }),
  tabs: defineMessages({
    title: {
      id: 'lg.web:ritstjorn.single.tabs.title',
      defaultMessage: 'Birting {version}',
      description: 'Title for the tabs in ritstjórn single page',
    },
  }),
  formSidebar: {
    employee: defineMessages({
      label: {
        id: 'lg.web:ritstjorn.single.formSidebar.employee.label',
        defaultMessage: 'Starfsmaður',
        description: 'Label for the employee input in ritstjórn single page',
      },
    }),
    status: defineMessages({
      label: {
        id: 'lg.web:ritstjorn.single.formSidebar.status.label',
        defaultMessage: 'Staða',
        description: 'Label for the status input in ritstjórn single page',
      },
    }),
    buttons: defineMessages({
      moveToPublishing: {
        id: 'lg.web:ritstjorn.single.formSidebar.buttons.moveToPublishing',
        defaultMessage: 'Færa mál í útgáfu',
        description:
          'Button label to move advert to publishing in ritstjórn single page',
      },
      moveToSubmitted: {
        id: 'lg.web:ritstjorn.single.formSidebar.buttons.moveToSubmitted',
        defaultMessage: 'Færa mál í innsent',
        description:
          'Button label to move advert to submitted in ritstjórn single page',
      },
      rejectCase: {
        id: 'lg.web:ritstjorn.single.formSidebar.buttons.rejectCase',
        defaultMessage: 'Hafna máli',
        description: 'Button label to reject case in ritstjórn single page',
      },
    }),
  },
  accordionItems: defineMessages({
    basicInformation: {
      id: 'lg.web:ritstjorn.single.accordionItems.basicInformation',
      defaultMessage: 'Grunnupplýsingar',
      description: 'Label for the basic information accordion item',
    },
    publishing: {
      id: 'lg.web:ritstjorn.single.accordionItems.publishing',
      defaultMessage: 'Birting',
      description: 'Label for the publishing accordion item',
    },
    mainContent: {
      id: 'lg.web:ritstjorn.single.accordionItems.mainContent',
      defaultMessage: 'Meginmál',
      description: 'Label for the main content accordion item',
    },
    signature: {
      id: 'lg.web:ritstjorn.single.accordionItems.signature',
      defaultMessage: 'Undirritun',
      description: 'Label for the signature accordion item',
    },
  }),
  inputs: {
    advertId: defineMessages({
      label: {
        id: 'lg.web:ritstjorn.single.inputs.advertId.label',
        defaultMessage: 'Auðkenni auglýsingar',
        description: 'Label for the advert ID input in ritstjórn single page',
      },
    }),
    institutution: defineMessages({
      label: {
        id: 'lg.web:ritstjorn.single.inputs.institutution.label',
        defaultMessage: 'Stofnun',
        description: 'Label for the institution input in ritstjórn single page',
      },
    }),
    submittedDate: defineMessages({
      label: {
        id: 'lg.web:ritstjorn.single.inputs.submittedDate.label',
        defaultMessage: 'Dagsetning innsendingar',
        description:
          'Label for the submitted date input in ritstjórn single page',
      },
    }),
    type: defineMessages({
      label: {
        id: 'lg.web:ritstjorn.single.inputs.type.label',
        defaultMessage: 'Tegund auglýsingar',
        description: 'Label for the type input in ritstjórn single page',
      },
    }),
    category: defineMessages({
      label: {
        id: 'lg.web:ritstjorn.single.inputs.category.label',
        defaultMessage: 'Flokkur auglýsingar',
        description: 'Label for the category input in ritstjórn single page',
      },
    }),
    scheduledPublishingDate: defineMessages({
      label: {
        id: 'lg.web:ritstjorn.single.inputs.scheduledPublishingDate.label',
        defaultMessage: 'Birtingardagur',
        description:
          'Label for the publishing date input in ritstjórn single page',
      },
    }),
    publishingDate: defineMessages({
      label: {
        id: 'lg.web:ritstjorn.single.inputs.publishingDate.label',
        defaultMessage: 'Útgáfudagur',
        description:
          'Label for the publishing date input in ritstjórn single page',
      },
    }),
    caption: defineMessages({
      label: {
        id: 'lg.web:ritstjorn.single.inputs.caption.label',
        defaultMessage: 'Yfirskrift',
        description: 'Label for the caption input in ritstjórn single page',
      },
    }),
    signature: defineMessages({
      name: {
        id: 'lg.web:ritstjorn.single.inputs.signature.name.label',
        defaultMessage: 'Nafn undirritara',
        description:
          'Label for the signature name input in ritstjórn single page',
      },
      location: {
        id: 'lg.web:ritstjorn.single.inputs.signature.location.label',
        defaultMessage: 'Staðsetning undirritunar',
        description:
          'Label for the signature location input in ritstjórn single page',
      },
      date: {
        id: 'lg.web:ritstjorn.single.inputs.signature.date.label',
        defaultMessage: 'Dagsetning undirritunar',
        description:
          'Label for the signature date input in ritstjórn single page',
      },
    }),
  },
}
