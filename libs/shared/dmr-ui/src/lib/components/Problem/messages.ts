/**
 * Centralized error messages for the Problem component
 * All error messages should be defined here for consistency and maintainability
 */

export const problemMessages = {
  // Default alert messages
  alerts: {
    noData: {
      title: 'Engin gögn fundust',
      message: 'Kanski þarf að síu eða reyna aftur',
    },
    badRequest: {
      title: 'Beiðni er ógild',
      message: 'Ekki er hægt að vinna úr beiðni',
    },
    notFound: {
      title: 'Eitthvað fór úrskeiðis',
      message: 'Síða eða gögn fundust ekki,',
    },
    serverError: {
      title: 'Eitthvað fór úrskeiðis',
      message: 'Ekki tókst að vinna úr beiðni',
    },
  },

  // Error mapping messages
  errors: {
    unknown: {
      title: 'Eitthvað fór úrskeiðis',
      message: 'Ekki tókst að vinna úr beiðni',
    },

    // tRPC error messages
    trpc: {
      notFound: {
        title: 'Síða eða gögn fundust ekki',
        message: 'Umbeðin síða eða gögn fundust ekki, eða hafa verið fjarlægð',
      },
      badRequest: {
        title: 'Beiðni er ógild',
        message: 'Rangt snið er á gögnum í fyrirspurn',
      },
      unauthorized: {
        title: 'Óheimill aðgangur',
        message: 'Þú hefur ekki heimild til að skoða þessi gögn',
      },
      internalError: {
        title: 'Villa kom upp',
        message: 'Villa kom upp við vinnslu beiðninnar',
      },
      default: {
        title: 'Eitthvað fór úrskeiðis',
        message: 'Ekki tókst að vinna úr beiðni',
      },
    },

    // HTTP error messages
    http: {
      notFound: {
        title: 'Síða eða gögn fundust ekki',
        message: 'Umbeðin gögn fundust ekki, eða hafa verið fjarlægð',
      },
      badRequest: {
        title: 'Beiðni er ógild',
        message: 'Rangt snið er á gögnum í fyrirspurn',
      },
      serverError: {
        title: 'Eitthvað fór úrskeiðis',
        message: 'Villa kom upp við vinnslu beiðninnar',
      },
      default: {
        title: 'Eitthvað fór úrskeiðis',
        message: 'Ekki tókst að vinna úr beiðni',
      },
    },

    // Standard error pattern messages
    patterns: {
      network: {
        title: 'Nettenging mistókst',
        message: 'Ekki tókst að tengjast vefþjóni. Vinsamlegast reyndu aftur.',
      },
      notFound: {
        title: 'Síða eða gögn fundust ekki',
        message: 'Umbeðin síða eða gögn fundust ekki',
      },
      validation: {
        title: 'Ógild beiðni',
        message: 'Beiðni er ekki á réttu formi og gat ekki verið unnin',
      },
      default: {
        title: 'Eitthvað fór úrskeiðis',
        message: 'Ekki tókst að vinna úr beiðni',
      },
    },
  },
} as const
