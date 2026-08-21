export const frontPageText = {
  heroTitle: 'Ritstjórn Jafnréttisstofu',
  heroImageAlt: 'Ritstjórn Jafnréttisstofu',
  heroDescription:
    'Hér má finna jafnréttisáætlanir og skýrslur um kynjabundinn launamun, ásamt úrbótaáætlunum.',
  heildarlisti: {
    description:
      'Yfirlit yfir innsendingar sem eru óúthlutaðar og ekki í vinnslu',
    title: 'Innsendingar',
    href: '/yfirlit',
  },
  jafnrettisaetlanir: {
    description: 'Yfirlit jafnréttisáætlana og meðferð þeirra.',
  },
  urbotaaetlanir: {
    description: 'Yfirlit úrbótaáætlana og meðferð þeirra.',
  },
  sectionTitle: 'Staða mála',
  tabGeneral: 'Almennt',
  tabMine: 'Mín mál',
  statsTitle: 'Tölfræði',
  statsWindows: {
    last30: 'Síðustu 30 dagar',
    thisYear: 'Þetta ár',
    allTime: 'Allt saman',
  },
  statsIntros: {
    last30: 'Hlutfall mála eftir stöðu síðustu 30 daga.',
    thisYear: 'Hlutfall mála eftir stöðu á þessu ári.',
    allTime: 'Hlutfall mála eftir stöðu frá upphafi.',
  },
  panelStats: {
    title: 'Tölulegar upplýsingar',
    description:
      'Upplýsingar birtar opinberlega á vef jafnréttisstofu og fylgst er með árangri ...',
    linkText: 'Lesa meira',
  },
  panelExport: {
    title: 'Keyra út lista',
    description:
      'Sækja skýrslur og tölfræðileg gögn um starfsemi stofnunarinnar.',
    linkText: 'Sækja skýrslu',
  },
}

export const overviewText = {
  heroTitle: 'Vinnslusvæði',
  heroDescription:
    'Hér má finna yfirlit yfir allar innsendar jafnréttisáætlanir og skýrslur um kynjabundinn launamun, ásamt úrbótaáætlunum.',
  imageAlt: 'Innsendingar',
  breadcrumbOverview: 'Yfirlit',
  tabInnsendingar: 'Innsendingar',
  tabInProgress: 'Í vinnslu',
  tabAfgreitt: 'Afgreitt',
  resultsText: 'færslur fundust',
  noComments: 'Engar athugasemdir',
  waitingForAction: 'Beðið svara',
  companyQuarantined: 'Fyrirtæki er í vari',
  companyFinesStarted: 'Fyrirtæki er í dagsektarferli',
  openAdmin: 'Opna ritjstjórn',
  filter: {
    heading: 'Leit og síun',
    placeholder: 'Sláðu inn leitarorð',
    categoryLabel: 'Mál',
    reviewerLabel: 'Starfsmaður',
    dateLabel: 'Dagsetning',
    typeLabel: 'Mál',
    companyLabel: 'Málsaðili',
    dateRangeLabel: 'Tímabil',
    dateFrom: 'Frá',
    dateFromPlaceholder: 'Veldu dagsetningu',
    dateTo: 'Til',
    dateToPlaceholder: 'Veldu dagsetningu',
    clearDates: 'Hreinsa dagsetningar',
    showDelayed: 'Sýna frestaðar úrbótaráætlanir',
  },
  createEqualityReport: {
    drawerLabel: 'Skrá jafnréttisáætlun',
    buttonLabel: 'Jafnréttisáætlun',
    heading: 'Ný jafnréttisáætlun',
    employeeCountHeading: 'Starfsmannafjöldi',
    successToast: 'Skýrsla send inn',
    inflightConflictToast:
      'Fyrirtækið er nú þegar með jafnréttisáætlun í stöðunni „{status}“. Ljúktu afgreiðslu hennar áður en ný jafnréttisáætlun er send inn.',
  },
  createSalaryReport: {
    drawerLabel: 'Skrá launagreiningu',
    buttonLabel: 'Skýrslugjöf',
    heading: 'Ný launagreining',
    excelHeading: 'Excel innflutningur',
    excelPlaceholder: 'Veldu Excel skrá til að flytja inn launagreiningargögn',
    switchFile: 'Skipta um skrá',
    chooseFile: 'Velja skrá',
    downloadTemplate: 'Sækja sniðmát',
    deviationsHeading: 'Frávik',
    deferLabel: 'Fresta skilum frávika',
    deferReasonLabel: 'Ástæða frestunar',
    employeeCountHeading: 'Starfsmannafjöldi',
    dataBasisHeading: 'Viðmiðunartímabil launagagna',
    dataBasisLabel: 'Launagögn miðast við',
    dataBasisMonthOption: 'Tiltekinn mánuð',
    dataBasisAverageOption: 'Tólf mánaða meðaltal',
    dataBasisMonthLabel: 'Mánuður',
    excelSuccessToast: 'Excel skrá flutt inn',
    excelErrorToast: 'Villa við innflutning á Excel skrá',
    excelErrorTitle: 'Ekki tókst að lesa Excel skrána',
    excelErrorIntro: 'Lagfærðu eftirfarandi atriði og reyndu aftur:',
    successToast: 'Skýrslugjöf send inn',
    deviations: {
      analyzing: 'Greini frávik…',
      analyzeError:
        'Ekki tókst að greina frávik. Reyndu að flytja skrána inn aftur.',
      none: 'Óskýrður launamunur er undir viðmiði. Engar úrbætur nauðsynlegar — hægt er að senda skýrsluna beint inn.',
      intro:
        'Óskýrður launamunur er yfir viðmiði. Launahækkun þessara starfsmanna færir hann undir viðmiðið. Skráðu úrbætur í hópa eða frestaðu skilum þeirra.',
      postponeOption: 'Fresta skilum frávika',
      tableEmployee: 'Starfsmaður',
      tableSalary: 'Tímakaup',
      tableExpected: 'Væntanlegt tímakaup',
      tableDifference: 'Frávik',
      tableContribution: 'Hlutur af óskýrðu',
      createGroup: 'Búa til frávikahóp úr völdum',
      groupHeading: 'Frávikahópur',
      groupMembers: 'Starfsmenn',
      removeGroup: 'Fjarlægja hóp',
      reasonLabel: 'Ástæða fráviks',
      actionLabel: 'Aðgerðir til úrbóta',
      signatureNameLabel: 'Nafn ábyrgðaraðila',
      signatureRoleLabel: 'Starfsheiti ábyrgðaraðila',
      unassignedWarning:
        'Öll frávik verða að tilheyra frávikahópi áður en hægt er að senda inn.',
      incompleteGroupWarning:
        'Fylltu út allar upplýsingar fyrir hvern frávikahóp.',
    },
    missingEqualityTitle: 'Samþykkta jafnréttisáætlun vantar',
    missingEqualityMessage:
      'Ekki er hægt að senda inn launagreiningu fyrir þetta fyrirtæki fyrr en það er með samþykkta jafnréttisáætlun í gildi. Skráðu jafnréttisáætlun fyrst.',
    missingEqualityToast:
      'Fyrirtækið er ekki með samþykkta jafnréttisáætlun í gildi. Skráðu jafnréttisáætlun áður en launagreining er send inn.',
    inflightConflictToast:
      'Fyrirtækið er nú þegar með launagreiningu í stöðunni „{status}“. Ljúktu afgreiðslu hennar áður en ný launagreining er send inn.',
  },
}

export const reportText = {
  heroTitle: 'Vinnslusvæði',
  heroDescription:
    'Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
  breadcrumbOverview: 'Yfirlit',
  sidebarTitle: 'Upplýsingar',
  tabEquality: 'Jafnréttisáætlun',
  tabCompany: 'Fyrirtækið',
  tabSalary: 'Skýrslugjöf',
  tabsLabel: 'Skýrsla',
  stepApproved: 'Afgreitt',
  comments: {
    heading: 'Athugasemdir',
    label: 'Athugasemd',
    placeholder: 'Bættu við athugasemd',
    sendToApplicant: 'Senda á innsendanda',
    externalDisabledHint: 'Opnaðu samskipti til að senda innsendanda skilaboð.',
    submit: 'Vista athugasemd',
    visibleToApplicant: 'Sýnileg innsendanda',
    seeAllComments: 'Sjá allar athugasemdir',
    createError: 'Villa við að vista athugasemd',
    deleteError: 'Villa við að eyða athugasemd',
    deleteSuccess: 'Athugasemd eytt',
  },
  statusSelect: {
    successToast: 'Uppfærsla á stöðu tókst.',
    errorToast: 'Villa við að uppfæra stöðu. Vinsamlegast reyndu aftur síðar.',
    assignButton: 'Færa í vinnslu',
    approveButton: 'Samþykkja',
    denyButton: 'Hafna',
  },
  communicationControl: {
    label: 'Staða samskipta',
    successToast: 'Uppfærsla á samskiptum tókst.',
    errorToast:
      'Villa við að uppfæra samskipti. Vinsamlegast reyndu aftur síðar.',
    openButton: 'Opna',
    closeButton: 'Loka',
    sendToEditButton: 'Breytingar',
  },
  sendToEditModal: {
    heading: 'Senda skýrslu í breytingar',
    description:
      'Vinsamlegast gerðu grein fyrir hvað þarf að laga. Athugasemdin er sýnileg innsendanda og samskipti verða opnuð svo hægt sé að svara.',
    warningTitle: 'Athugið',
    warningMessage: 'Innsendandi fær skýrsluna opna til breytinga á Ísland.is.',
    reasonLabel: 'Ástæða',
    submitButton: 'Senda í breytingar',
  },
  employeeSelect: {
    label: 'Starfsmaður',
    successToast: 'Úthlutun tókst.',
    errorToast: 'Villa við að úthluta starfsmanni.',
  },
  detailFields: {
    isatCode: 'ÍSAT atvinnugreinaflokkun',
    companyAdminGender: 'Kyn æðsta stjórnanda',
    employeeCount: 'Fjöldi starfsmanna',
    address: 'Heimilisfang',
    city: 'Sveitarfélag',
    province: 'Landshluti',
    fines: 'Dagsektir',
    email: 'Netfang',
  },
  companyTab: {
    companyInfoHeading: 'Upplýsingar fyrirtækis',
    averageEmployeesHeading: 'Meðalfjöldi starfsmanna',
    genderNeutralRegistry: 'Hlutlaus skráning kyns í Þjóðskrá',
    subsidaries: 'Dótturfélög',
  },
  denialModal: {
    heading: 'Höfnun skýrslu',
    description:
      'Vinsamlegast gerðu grein fyrir ástæðu höfnunar. Athugið að afrit af þessum texta er sent til innsendanda.',
    warningTitle: 'Athugið',
    warningMessage: 'Þessi aðgerð er óaftukræf og mun vísa skýrslunni frá.',
    reasonLabel: 'Ástæða höfnunar',
    submitButton: 'Vista',
  },
  equalityTab: {
    emptyTitle: 'Engin jafnréttisáætlun',
    emptyMessage:
      'Engin jafnréttisáætlun fannst fyrir þessa skýrslu. Vinsamlegast hafðu samband við fyrirtækið til að fá frekari upplýsingar.',
    approvedDateLabel: 'Dagsetning samþykktar',
    expiryLabel: 'Gildistími',
    responsibleLabel: 'Ábyrgðaraðili',
  },
  salaryTab: {
    emptyTitle: 'Engin skýrslugjöf ',
    emptyMessage:
      'Engin skýrslugjöf fannst. Vinsamlegast hafðu samband við fyrirtækið til að fá frekari upplýsingar.',
    outliersPostponedTitle: 'Frestur á úrbótaáætlun.',
    outliersPostponedMessage:
      'Fyrirtækið hefur óskað eftir fresti við skil á úrbótaáætlun.',
    dataBasisLabel: 'Viðmiðunartímabil launagagna',
    dataBasisMonth: 'Tiltekinn mánuður',
    dataBasisAverage: 'Tólf mánaða meðaltal',
    dataBasisMissing: 'Ekki tilgreint',
    wageGapDescription:
      'Munur á meðaltímakaupi karla og kvenna, án leiðréttingar. Ekki borið við viðmið.',
    avgSalaryMale: 'Meðaltímakaup karla',
    avgSalaryFemale: 'Meðaltímakaup kvenna',
    wageGapLabel: 'Óleiðréttur launamunur',

    /**
     * ── The two gap figures ──────────────────────────────────────────────────
     *
     * Deliberately in SEPARATE groups, not side by side. Óleiðréttur sits with
     * the two meðaltímakaup figures it is computed from, which makes it
     * self-verifying: subtract the two averages and you get it. Leiðréttur sits
     * alone as the compliance figure.
     *
     * Keeping them apart matters because they do NOT nest — leiðréttur can
     * legitimately exceed óleiðréttur when the job-score mix favours the
     * lower-paid group — so putting them adjacent invites a comparison that
     * does not hold.
     */
    unadjustedGroupHeading: 'Meðaltímakaup og hrátt bil',
    adjustedGroupHeading: 'Leiðréttur launamunur',
    adjustedLabel: 'Leiðréttur launamunur',
    adjustedDescription:
      'Sá hluti launamunar sem starfsmatsstig skýra ekki. Þetta er talan sem borin er við viðmiðið.',
    benchmarkLabel: 'Viðmið',
    benchmarkWithin: 'Undir viðmiði',
    benchmarkExceeded: 'Yfir viðmiði',
    disfavourFemale: 'í óhag kvenna',
    disfavourMale: 'í óhag karla',
    disfavourNone: 'engin átt',
    // No longer a StatisticCard: it is a count of rows in the table below, not
    // a figure to be read against the other two, so it reads as a subtitle on
    // the Úrbótaáætlun heading instead.
    minimumSetLabel: 'Starfsmenn í úrbótaáætlun',
    minimumSetNone: 'Engir',
    cohortCountsLabel: 'Fjöldi í greiningu',
    cohortMale: 'karlar',
    cohortFemale: 'konur',

    /**
     * ── Unavailable states ───────────────────────────────────────────────────
     *
     * The API sends enum codes only, never Icelandic, so the mapping lives
     * here. `cannotCompute` is the heading; the blocker keys explain why.
     *
     * ⚠️ Never render 0% for an unavailable gap. A company that cannot be
     * measured is not a company without a pay gap, and "0%" states the opposite
     * of what is known.
     */
    cannotCompute: 'Ekki hægt að reikna',
    blockers: {
      EMPTY_MALE_COHORT:
        'Engir karlar í skýrslunni, því er ekki unnt að reikna launamun milli kynja.',
      EMPTY_FEMALE_COHORT:
        'Engar konur í skýrslunni, því er ekki unnt að reikna launamun milli kynja.',
    },
    warnings: {
      ROWS_EXCLUDED_NON_POSITIVE_WAGE:
        'Starfsmenn með ógilt tímakaup voru undanskildir útreikningi.',
      NO_SCORE_OVERLAP:
        'Starfsmatsstig kynjanna skarast ekki. Það er raunveruleg niðurstaða — algjör kynjaskipting starfa — en leiðrétta talan byggir þá á framreikningi utan gagnasviðs.',
      NO_SCORE_VARIATION:
        'Öll starfsmatsstig eru eins, því er ekki unnt að greina hvað stig skýra.',
    },

    /**
     * ── Chart annotations ────────────────────────────────────────────────────
     *
     * The fitted line printed in words. Skurðpunktur is predicted pay at score
     * 0, which no real job has, so the label stays deliberately vague about it.
     */
    // The readout describes the POOLED LOG CURVE now drawn on the chart, not
    // the old level-space straight line. `Hallatala`/`Skurðpunktur` are gone
    // with it: a log-space slope is not kr./klst. per stig, and printing it
    // under that label would be a unit error on a government page.
    regressionHeading: 'Viðmiðslína',
    curveGrowthLabel: 'Hækkun á hver 100 stig',
    curveGrowthHint: 'Hlutfallsleg hækkun á væntanlegu tímakaupi',
    curveUnavailable: 'Viðmiðslína ekki reiknanleg fyrir þessi gögn',
    rSquaredLabel: 'R²',
    rSquaredHint: 'Hve mikið af launabreytileikanum stigin skýra',
    noDataMessage: 'Engin launagögn til að birta',
    cohort: {
      label: 'Starfsmenn í greiningu',
      male: 'karlar',
      female: 'konur',
      separator: ' · ',
      // The counts split men against women-and-kynsegin, exactly as every
      // figure on this page does. Stated rather than assumed: a reviewer
      // counting heads against the company's own records needs to know which
      // convention produced the two numbers.
      hint: 'Kynsegin og hlutlaus skráning kyns eru talin með konum, eins og í öllum útreikningum á síðunni.',
    },
    chartTitle: 'Stig á móti reglulegu tímakaupi',
    chartDescription:
      'Viðmiðslínan er væntanlegt tímakaup eftir stigum. Launafrávik hvers starfsmanns er mælt frá henni, og starfsmenn undir línunni eru þeir sem úrbótaáætlun getur tekið til.',
    chartScaleScore: 'stig',
    chartScaleCurrency: 'kr./klst.',
    chartRegressionSeries: 'Væntanlegt tímakaup',
    chartTooltipScore: 'Stig',
    chartTooltipSalary: 'Tímakaup',
    hourlyUnit: 'kr./klst.',
    outlierTable: {
      heading: 'Úrbótaáætlun',
      numberHeader: 'Númer',
      roleHeader: 'Starf',
      genderHeader: 'Kyn',
      deviationHeader: 'Launafrávik',
      groupLabel: 'Hópur',
      reasonLabel: 'Ástæða',
      actionLabel: 'Aðgerð',
      signatureNameLabel: 'Nafn undirritanda',
      signatureRoleLabel: 'Hlutverk undirritanda',
      points: 'Stig',
      salary: 'Tímakaup',
      predictedSalary: 'Væntanlegt tímakaup',
      /**
       * The column that actually explains why a row is listed. The deviation is
       * about the individual; this is their share of the company-wide óskýrt
       * figure, which is what the lágmarksmengi is selected on.
       */
      contributionShareHeader: 'Hlutur af óskýrðu',
      emptyMinimumSet:
        'Engar úrbætur nauðsynlegar — óskýrður launamunur er undir viðmiði.',
    },
    /**
     * ── Pay-component split by gender ────────────────────────────────────────
     *
     * ⚠️ `Aukagreiðslur`, NOT `hlunnindi`. The template's own computed columns
     * are P "Viðbótarlaun" (`=SUM(J:K)`) and Q "Aukagreiðslur" (`=SUM(L:O)`), so
     * that is the submitter-facing vocabulary. "Hlunnindi" had crept into the
     * formula docs and was corrected out 2026-08-20.
     */
    components: {
      heading: 'Viðbótarlaun og aukagreiðslur',
      description:
        'Meðaltal viðbótarlauna og aukagreiðslna á mánuði, eftir kyni. Krónur á mánuði — ekki tímakaup, og ekki deilt með greiddum stundum.',
      genderHeader: 'Kyn',
      additionalHeader: 'Viðbótarlaun',
      bonusHeader: 'Aukagreiðslur',
      totalHeader: 'Samtals',
      male: 'Karl',
      female: 'Kona',
      overall: 'Allir',
      /**
       * The screenshot's "Launamunur kynjanna" row. This is the ÓLEIÐRÉTTI
       * gap per component — a plain difference of means, with no Oaxaca
       * decomposition and no compliance role.
       */
      gapRow: 'Óleiðréttur launamunur',
      gapHint:
        'Hlutfallslegur munur á meðaltali karla og kvenna fyrir hvern lið. Ekki leiðrétt fyrir starfsmatsstigum og ekki borið við viðmið.',
      empty: 'Engar viðbótarlaunagreiðslur skráðar',
    },
    remedyDeadlineLabel: 'Frestur til úrbóta',
    remedyDeadlinePlaceholder: 'Valin dagsetning fyrir úrbótafrest',
  },
  timeline: {
    today: 'Í dag',
    yesterday: 'Í gær',
    company: 'Fyrirtæki',
    employee: 'Starfsmaður',
    reportSubmitted: 'Skýrsla innsend',
    assigned: 'Úthlutað',
    unassigned: 'tekur sig af málinu',
    superseded: 'Útrunnið',
    registersMessage: 'skráir skilaboð',
    submitsReport: 'sendir inn skýrslu',
    claimsCase: 'merkir sér málið',
    assignedOther: 'merkti',
    assignedOtherSuffix: 'á málið',
    unassignedOther: 'tók',
    unassignedOtherSuffix: 'af málinu',
    movesToStatus: 'færir mál í stöðuna:',
    edited: 'gerði breytingar á skýrslu',
    communicationOpened: 'opnaði á samskipti við innsendanda',
    communicationClosed: 'lokaði á samskipti við innsendanda',
    companyCreated: 'Fyrirtæki skráð',
    finesStarted: 'hefur hafið dagsektarferli',
    finesStopped: 'hefur stöðvað dagsektarferli',
    companyQuarantined: 'hefur sett fyrirtækið í var',
    companyUnquarantined: 'hefur tekið fyrirtækið úr vari',
    reminderSentEquality: 'Áminning send um skil jafnréttisskýrslu',
    reminderSentSalary: 'Áminning send um skil jafnlaunaskýrslu',
    reminderNoEmailEquality:
      'Reyndi að senda áminningu um jafnréttisskýrslu en ekkert netfang fannst',
    reminderNoEmailSalary:
      'Reyndi að senda áminningu um jafnlaunaskýrslu en ekkert netfang fannst',
    reminderTierSixMonths: 'Sex mánaða áminning',
    reminderTierTwoMonths: 'Tveggja mánaða áminning',
    reminderTierTwoWeeks: 'Tveggja vikna áminning',
    reminderTierDue: 'Áminning á skiladegi',
    reminderDueDatePrefix: 'skiladagur',
    systemAutoReviewApprove: 'Kerfið myndi samþykkja skýrsluna sjálfvirkt',
    systemAutoReviewNeedsReview: 'Kerfið myndi senda skýrsluna í yfirferð',
  },
  salaryStatsLoadError: 'Villa við að hlaða tölfræðigögn fyrir skýrslu',
  salaryStatsLoadErrorMessage:
    'Vinsamlegast reyndu aftur síðar eða hafðu samband við kerfisstjóra ef vandamálið heldur áfram.',
  loadError: 'Villa kom upp við að hlaða skýrslu',
  loadSidebarError: 'Villa kom upp við að hlaða hliðarstiku',
}

export const companiesText = {
  heading: 'Fyrirtæki',
  heroDescription:
    'Hér eru skráð fyrirtæki í kerfinu. Hægt er að leita að fyrirtækjum, sía eftir stærð og skoða stöðu jafnréttismála.',
  newButton: 'Nýtt fyrirtæki',
  filterHeading: 'Leit og síun',
  filterPlaceholder: 'Sláðu inn leitarorð',
  // Accordion card headings — each groups several select filters.
  cardCompany: 'Fyrirtæki',
  cardStatus: 'Staða',
  cardLocation: 'Staðsetning',
  avgEmployeeCount: 'Meðalfjöldi starfsmanna',
  avgEmployeeCountPlaceholder: 'Veldu stærð',
  validPeriod: 'Gildistími',
  validPeriodPlaceholder: 'Veldu gildistíma',
  statusPlaceholder: 'Veldu stöðu',
  flags: 'Annað',
  flagsPlaceholder: 'Veldu',
  dailyFines: 'Dagsektir',
  overdue: 'Skiladagur',
  overdueTag: 'Skiladagur liðinn',
  quarantine: 'Í var',
  location: 'Staður',
  region: 'Landshluti',
  regionPlaceholder: 'Veldu landshluta',
  postcode: 'Póstnúmer',
  postcodePlaceholder: 'Veldu póstnúmer',
  filterNoResults: 'Ekkert fannst',
  isatCategory: 'ÍSAT-flokkur',
  isatCategoryPlaceholder: 'Leita að ÍSAT-flokki',
  isatCategoryNoResults: 'Engir flokkar fundust',
  isatSection: 'ÍSAT-bálkur',
  isatSectionPlaceholder: 'Veldu bálk',
  isatSectionNoResults: 'Engir bálkar fundust',
  // "Eignarhald", not "rekstrarform": the values are Almennur markaður / Ríki
  // og sveitarfélög, i.e. who owns the entity. Rekstrarform is the RSK legal
  // form the classification is *derived* from, and is reserved for that hint on
  // the detail view — the two must not share a word the admin can edit.
  sector: 'Eignarhald',
  sectorPlaceholder: 'Veldu eignarhald',
  resultsText: 'fyrirtæki fundust',
  noData: 'Engin fyrirtæki skráð',
  expandedRow: {
    salaryRequired: 'Skýrslugjöf skylda',
    equalityRequired: 'Jafnréttisáætlun skylda',
    validUntilPrefix: 'Gildir til:',
    avgEmployees: 'Meðalfjöldi starfsmanna',
    contactPerson: 'Tengiliður',
    contactEmail: 'Netfang tengiliðar',
    viewReport: 'Opna skýrslu',
    equalityDueAt: 'Næsti skiladagur jafnréttisáætlunar',
    salaryDueAt: 'Næsti skiladagur launagreiningar',
  },
  createModal: {
    title: 'Skrá nýtt fyrirtæki',
    kennitalaEyebrow: 'Kennitala fyrirtækis',
    kennitalaPlaceholder: '000000-0000',
    lookupButton: 'Fletta upp',
    notFoundTitle: 'Fyrirtæki fannst ekki',
    notFoundError: 'Fyrirtæki fannst ekki í fyrirtækjaskrá RSK',
    lookupErrorTitle: 'Villa við uppflettingu',
    lookupError:
      'Ekki tókst að sækja gögn frá fyrirtækjaskrá RSK. Reyndu aftur síðar.',
    activeTitle: 'Fyrirtæki er virkt',
    activeMessage: 'Fyrirtæki er virkt í fyrirtækjaskrá RSK',
    inactiveTitle: 'Fyrirtæki er ekki virkt',
    inactiveFallbackReason: 'Fyrirtæki er ekki virkt í fyrirtækjaskrá RSK',
    nameLabel: 'Nafn fyrirtækis',
    addressLabel: 'Heimilisfang',
    postcodeLabel: 'Póstnúmer',
    isatCategoryLabel: 'ÍSAT-flokkur',
    sectorLabel: 'Eignarhald',
    // Shown under the sector field when RSK's rekstrarform is one we do not map
    // yet, so the admin sees it here rather than after the company exists.
    sectorUnknownHint:
      'Ekki tókst að flokka eignarhald sjálfvirkt. Hægt er að skrá það handvirkt eftir að fyrirtækið hefur verið stofnað.',
    emptyValue: '—',
    employeeCountLabel: 'Meðalfjöldi starfsmanna',
    submit: 'Skrá fyrirtæki',
    successToast: 'Fyrirtæki skráð',
    errorToast: 'Villa við skráningu fyrirtækis',
  },
  importModal: {
    title: 'Flytja inn fyrirtækjaskrá',
    description:
      'Veldu Excel-skrá (.xlsx) með árlegri fyrirtækjaskrá. Skráin er staðreyndaruppspretta — fyrirtæki eru stofnuð, uppfærð eða merkt óþekkt eftir innihaldi hennar.',
    button: 'Flytja inn skrá',
    chooseFile: 'Velja skrá',
    reading: 'Les skrá…',
    yearLabel: 'Tekjuár',
    noChanges: 'Engar breytingar fundust í skránni.',
    noticeCount: 'athugasemd(ir)',
    confirm: 'Staðfesta innflutning',
    cancel: 'Hætta við',
    close: 'Loka',
    chooseAnother: 'Velja aðra skrá',
    successToast: 'Innflutningur staðfestur',
    errorToast: 'Villa við innflutning',
    committedBanner: 'Innflutningur staðfestur',
    sections: {
      created: 'Ný fyrirtæki',
      updated: 'Uppfærð',
      reactivated: 'Endurvirkjuð',
      deactivated: 'Óvirkjuð (vantar í skrá)',
      unchanged: 'Óbreytt',
      invalid: 'Ógildar línur',
    },
    rowPrefix: 'Lína',
  },
  detailView: {
    heading: 'Upplýsingar um fyrirtæki',
    tabInfo: 'Upplýsingar',
    tabReports: 'Skýrslur',
    tabsLabel: 'Fyrirtækjaflippar',
    timelineHeading: 'Saga fyrirtækis',
    sidebarTitle: 'Staða fyrirtækis',
    statusLabel: 'Staða',
    finesButton: 'Hefja dagsektarferli',
    finesStopButton: 'Stöðva dagsektarferli',
    noReports: 'Engar skýrslur skráðar',
    reportsLoadError: 'Villa við að hlaða skýrslur',
    noCompany: 'Fyrirtæki fannst ekki',
    finesStartedToast: 'Dagsektarferli hafið',
    finesStoppedToast: 'Dagsektarferli stöðvað',
    finesErrorToast: 'Villa við að uppfæra dagsektir',
    quarantineButton: 'Setja í var',
    quarantineStopButton: 'Taka úr vari',
    quarantinedToast: 'Fyrirtæki sett í var',
    unquarantinedToast: 'Fyrirtæki tekið úr vari',
    quarantineErrorToast: 'Villa við að uppfæra stöðu fyrirtækis',
    quarantinedAlert: 'Fyrirtækið er í vari',
    quarantinedReasonAlertMessage: 'Fyrirtækið hefur verið sett í var vegna: ',
    finesAlert: 'Fyrirtækið er í dagsektarferli',
    finesAlertReasonAlertMessage:
      'Fyrirtækið hefur verið sett í dagsektarferli vegna: ',

    // Only sectorLegalFormHint says "rekstrarform" — it is the RSK legal form,
    // a read-only input to the classification. The editable field above it is
    // eignarhald. Stacking both concepts under one word on the same screen
    // invites an admin to "correct" one when they meant the other.
    sectorLabel: 'Eignarhald',
    sectorEditButton: 'Breyta',
    sectorSaveButton: 'Vista',
    sectorCancelButton: 'Hætta',
    sectorPlaceholder: 'Veldu eignarhald',
    sectorSavedToast: 'Eignarhald uppfært',
    sectorErrorToast: 'Villa við að uppfæra eignarhald',
    sectorOverrideHint: 'Skráð handvirkt af umsjónarmanni',
    sectorLegalFormHint: 'Rekstrarform úr fyrirtækjaskrá RSK: ',
    sectorUnknownHint:
      'Ekki hefur verið unnt að flokka fyrirtækið sjálfvirkt. Veldu eignarhald handvirkt.',

    emailLabel: 'Netfang',
    emailPlaceholder: 'netfang@fyrirtaeki.is',
    emailEditButton: 'Breyta',
    emailSaveButton: 'Vista',
    emailCancelButton: 'Hætta við',
    emailSavedToast: 'Netfang uppfært',
    emailErrorToast: 'Villa við að uppfæra netfang',

    comments: {
      label: 'Athugasemdir',
      placeholder: 'Bættu við athugasemd',
      submit: 'Vista athugasemd',
    },
  },
}

export const usersText = {
  heroTitle: 'Notendur',
  heroDescription:
    'Hér eru skráðir notendur kerfisins. Hægt er að bæta við nýjum notendum, breyta upplýsingum eða óvirkja notendur.',
  createButton: 'Nýr notandi',
  showInactive: 'Sýna óvirka',
  hideInactive: 'Fela óvirka',
  resultsText: 'notendur fundust',
  noData: 'Engir notendur skráðir',
  active: 'Virkur',
  inactive: 'Óvirkur',
  actionsHeading: 'Aðgerðir',
  roleLabel: 'Hlutverk',
  roleAdmin: 'Stjórnandi',
  roleEditor: 'Ritstjórn',
  modal: {
    createTitle: 'Nýr notandi',
    editTitle: 'Breyta notanda',
    nationalIdLabel: 'Kennitala',
    firstNameLabel: 'Fornafn',
    lastNameLabel: 'Eftirnafn',
    roleLabel: 'Hlutverk',
    roleAdmin: 'Stjórnandi',
    roleEditor: 'Ritstjórn',
    statusEyebrow: 'Staða notanda',
    activeLabel: 'Virkur notandi',
    create: 'Stofna notanda',
    save: 'Vista breytingar',
    createSuccess: 'Notandi stofnaður',
    saveSuccess: 'Breytingar vistaðar',
    createError: 'Villa við stofnun notanda',
    userAlreadyExists:
      'Notandi með þessari kennitölu er þegar til. Athugaðu hvort hann geti verið í listanum yfir óvirka notendur.',
    saveError: 'Villa við vistun breytinga',
  },
}

export const systemSettingsText = {
  heroTitle: 'Kerfisstillingar',
  heroDescription:
    'Hér má sjá stillingar sem gilda fyrir allt kerfið. Breytingar á þeim hafa áhrif á allar skýrslur sem eru reiknaðar eftir að breytingin er vistuð.',
  heroImageAlt: 'Kerfisstillingar',
  actionsHeading: 'Aðgerðir',
  thresholdHeading: 'Leyfilegur launamunur',
  thresholdLabel: 'Hámark á launamun karla og kvenna',
  // ⚠️ Rewritten when the ±band was retired. This used to read "sjálfvirka
  // greiningu á grunnlaunum … helming hlutfallsins til hvorrar áttar frá
  // reiknaðri viðmiðunarlínu", which described all three retired mechanics at
  // once: base salary rather than tímakaup, the halving, and a two-sided band
  // around a fitted line. Nothing halves the ratio any more and no per-employee
  // band exists — the figure is compared whole, once, per workplace. Keep this
  // string in step with `report-auto-review.constants.ts`; an admin lowers this
  // number irreversibly, so it must say what it actually controls.
  thresholdDescription:
    'Hlutfallið er viðmiðið sem óskýrður launamunur hvers vinnustaðar er mældur við. Fari óskýrður launamunur yfir hlutfallið þarf vinnustaðurinn að skila áætlun um úrbætur.',
  irreversibleTitle: 'Aðeins er hægt að lækka hlutfallið',
  irreversibleMessage:
    'Hlutfallið þrengist um hver áramót og verður aldrei rýmkað aftur. Þegar lækkun hefur verið vistuð er ekki hægt að hækka hlutfallið á ný.',
  lowerButton: 'Lækka hlutfall',
  historyHeading: 'Breytingaskrá',
  historyNoData: 'Engar breytingar hafa verið gerðar',
  historyValueLabel: 'Hlutfall',
  historyPeriodLabel: 'Gildistími',
  historyCurrent: 'Í gildi',
  historyUntil: (date: string) => `Gilti til ${date}`,
  modal: {
    title: 'Lækka leyfilegan launamun',
    currentLabel: 'Núgildandi hlutfall',
    newValueLabel: 'Nýtt hlutfall (%)',
    tooHigh: (current: string) =>
      `Nýtt hlutfall verður að vera lægra en ${current}%`,
    notANumber: 'Sláðu inn tölu hærri en 0, með mest tveimur aukastöfum',
    currentValueMalformed:
      'Núgildandi hlutfall er ekki gild tala og því er ekki hægt að lækka það. Hafðu samband við kerfisstjóra.',
    continue: 'Halda áfram',
    back: 'Til baka',
    confirmTitle: 'Þessi breyting er óafturkræf',
    confirmMessage: (current: string, next: string) =>
      `Þú ert að lækka leyfilegan launamun úr ${current}% í ${next}%. Ekki er hægt að hækka hlutfallið aftur eftir að breytingin hefur verið vistuð.`,
    confirmButton: 'Lækka hlutfall',
    saveSuccess: 'Hlutfallið hefur verið lækkað',
    saveError: 'Villa við vistun hlutfalls',
  },
}

export const loginText = {
  heading: 'Innskráning',
  description:
    'Skráðu þig inn í kerfi Jafnréttisstofu með rafrænum skilríkjum.',
  submitButton: 'Skrá inn með rafrænum skilríkjum',
  errorTitle: 'Innskráning mistókst',
  errorMessage: 'Ekki tókst að skrá þig inn. Reyndu aftur síðar.',
}

export const errorPageText = {
  heading: 'Villa við innskráningu',
  accessDenied: 'Þú hefur ekki aðgang að þessu kerfi.',
  defaultError:
    'Eitthvað fór úrskeiðis við innskráningu. Vinsamlegast reyndu aftur.',
}

export const notFoundText = {
  title: 'Síða fannst ekki',
  message:
    'Ekkert fannst á þessari slóð. Mögulega hefur síðan verið fjarlægð eða færð til.',
}

export const reportNotFoundText = {
  title: 'Skýrsla fannst ekki',
  message:
    'Engin skýrsla fannst með þetta auðkenni. Mögulega hefur hún verið fjarlægð eða auðkennið er rangt.',
  backToOverview: 'Til baka í yfirlit',
}

export const serverErrorText = {
  title: 'Eitthvað fór úrskeiðis',
  message:
    'Villa kom upp við að sækja gögn. Vinsamlegast reyndu aftur síðar eða hafðu samband við kerfisstjóra ef vandinn líður áfram.',
  tryAgain: 'Reyna aftur',
  backToOverview: 'Til baka í yfirlit',
}

export const headerText = {
  logoAlt: 'Jafnréttisstofa logo',
  brand: 'Jafnréttisstofa',
  controlPanelTitle: 'Stjórnborð',
  userMenuLabel: 'Notandi',
  logout: 'Útskrá',
  logoutButton: 'Skrá út',
}

export const sharedText = {
  breadcrumbHome: 'Forsíða',
  admin: 'Ritstjórn',
  unknown: 'Óþekkt',
  yesLabel: 'Já',
  noLabel: 'Nei',
  statusLabel: 'Staða',
  delete: 'Eyða',
  companies: 'Fyrirtæki',
  filter: {
    labelClearAll: 'Hreinsa allar síur',
    labelOpen: 'Opna síur',
    labelClose: 'Loka síum',
    labelClear: 'Hreinsa',
    labelTitle: 'Síur',
    labelResult: 'Sýna niðurstöður',
  },
  statusLabels: {
    DRAFT: 'Drög',
    SUBMITTED: 'Innsent',
    IN_REVIEW: 'Í vinnslu',
    APPROVED: 'Samþykkt',
    DENIED: 'Hafnað',
    SUPERSEDED: 'Útrunnið',
    POSTPONED: 'Frestað',
    WITHDRAWN: 'Dregin til baka',
  },
  typeLabels: {
    EQUALITY: 'Jafnréttisáætlun',
    SALARY: 'Skýrslugjöf',
    IMPROVEMENT_PLAN: 'Úrbótaáætlun',
  },
  genders: {
    male: 'Karl',
    female: 'Kona',
    neutral: 'Kynhlutlægt',
    maleCount: 'Karlar',
    femaleCount: 'Konur',
  },
  form: {
    nameLabel: 'Nafn',
    jobTitleLabel: 'Starfsheiti',
    kennitalaLabel: 'Kennitala',
    emailLabel: 'Netfang',
    phoneLabel: 'Símanúmer',
    phoneShortLabel: 'Sími',
    genderLabel: 'Kyn',
    companyHeading: 'Fyrirtæki',
    companySelect: 'Veldu fyrirtæki',
    topManagerHeading: 'Æðsti stjórnandi',
    contactHeading: 'Tengiliður',
    reset: 'Hreinsa',
    submit: 'Senda inn',
    cancel: 'Hætta við',
    save: 'Vista',
    errorToast: 'Villa við innsendingu',
  },
  empty: {
    title: 'Ekkert fannst',
    message:
      'Engin gögn fundust. Vinsamlegast hafðu samband við fyrirtækið til að fá frekari upplýsingar.',
  },
  files: 'Skjöl',
}
