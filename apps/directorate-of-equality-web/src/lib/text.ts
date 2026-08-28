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
  reviewerSelect: {
    label: 'Starfsmaður',
    placeholder: 'Óúthlutað',
  },
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
      // ⚠️ Remedy-NEUTRAL by design. This used to read "Launahækkun þessara
      // starfsmanna færir hann undir viðmiðið" — naming a specific remedy (a
      // pay rise) and asserting an arithmetic outcome, neither of which the
      // process requires: the company files a reason and an action per listed
      // employee, and improvement is demonstrated at company level at the next
      // report. It was also simply false whenever the set cannot close the gap.
      // State the observation and the obligation; say nothing about the fix.
      intro:
        'Þessir starfsmenn bera óskýrðan launamun fyrirtækisins — laun þeirra víkja frá því sem starfsmatsstig þeirra gefa til kynna. Skráðu ástæður og aðgerðir. Skráðu úrbætur í hópa eða frestaðu skilum þeirra.',
      /**
       * ⚠️ Direction-specific, and shown PER GROUP rather than per row.
       *
       * The explanation fields live on `report_outlier_group`, not on the
       * employee join, and the submitter composes groups freely — so a group
       * can legitimately hold someone paid below their stig and someone paid
       * above. That is why there are three variants and not two: `mixed` is a
       * real case, not a fudge.
       *
       * The two questions are genuinely different. Asked about someone above
       * the line, the likeliest honest answer is that the job evaluation is
       * wrong — in which case the correction is to the evaluation and nobody's
       * pay moves. Sharing one prompt would hide that.
       */
      directionPrompt: {
        below:
          'Laun þessara starfsmanna eru LÆGRI en starfsmatsstig þeirra gefa til kynna. Skráðu hvers vegna og hvað verður gert.',
        above:
          'Laun þessara starfsmanna eru HÆRRI en starfsmatsstig þeirra gefa til kynna. Skráðu hvers vegna — ef starfsmatið vanmetur starfið er úrbótin að endurskoða matið, ekki launin.',
        mixed:
          'Í þessum hópi eru bæði starfsmenn með lægri og hærri laun en starfsmatsstig þeirra gefa til kynna. Skráðu ástæður sem eiga við hópinn í heild.',
      },
      /** Suffix on the Frávik cell, so a row states its own direction. */
      directionBelow: 'undir',
      directionAbove: 'yfir',
      /**
       * Added when `minimumSetClosesGap === false`.
       *
       * ⚠️ The MEANING of this flag inverted with the two-directional set. It
       * used to mean "the listed employees do not account for the whole gap,
       * because the rest of it sits with people we cannot reach" — and this
       * string said exactly that, naming the overpaid side as the unreachable
       * part. The set now reaches that side, so the old text described the
       * opposite of the truth.
       *
       * It now means the correction OVERSHOOTS: bringing these employees onto
       * the line would carry óskýrt past the benchmark in the other direction,
       * so no subset of them lands inside it. Still no figures — quantifying it
       * would imply the exact pay changes the process never asks for.
       */
      introDoesNotClose:
        'Athugið: launamunur fyrirtækisins verður ekki færður undir viðmiðið með þessum starfsmönnum einum. Skráðu samt ástæður og aðgerðir — úrbætur eru sýndar á fyrirtækinu í heild við næstu skil.',
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
    sendToApplicant: 'Sýnilegt innsendanda',
    externalDisabledHint:
      'Aðeins skýrslur í vinnslu er hægt að senda til innsendanda.',
    submit: 'Vista athugasemd',
    visibleToApplicant: 'Sýnileg innsendanda',
    seeAllComments: 'Sjá allar athugasemdir',
    createError: 'Villa við að vista athugasemd',
    externalSuccess:
      'Athugasemd send til innsendanda. Skýrslan er opin til breytinga á Ísland.is.',
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
  communicationStatus: {
    label: 'Staða samskipta',
  },
  externalCommentModal: {
    heading: 'Senda athugasemd til innsendanda',
    description:
      'Athugasemdin er sýnileg innsendanda og skýrslan verður opnuð til breytinga. Þú getur breytt textanum hér áður en hann er sendur.',
    warningTitle: 'Athugið',
    warningMessage: 'Innsendandi fær skýrsluna opna til breytinga á Ísland.is.',
    bodyLabel: 'Athugasemd',
    submitButton: 'Senda til innsendanda',
  },
  employeeSelect: {
    label: 'Starfsmaður',
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
    /**
     * ⚠️ Why the line bends, said once and plainly.
     *
     * The curvature is the single most-questioned thing on this page — it looks
     * like a modelling flourish and is in fact the whole model. Pay is fitted as
     * a constant PERCENTAGE rise per stig, and a constant percentage compounds,
     * so the line must bend in krónur. It is straight in log space, which is the
     * space it was fitted in.
     *
     * Kept next to the growth figure rather than buried in a tooltip: the two
     * explain each other. "+32,6% á hver 100 stig" is exactly why the gap
     * between successive 100-stig steps widens as you go right.
     */
    chartCurveNote:
      'Viðmiðslínan sveigist vegna þess að væntanlegt tímakaup hækkar um fast HLUTFALL á hvert stig, ekki fasta krónutölu — og hlutfallshækkun leggst við sjálfa sig. Í krónum verður hvert 100 stiga þrep því stærra en það síðasta.',
    regressionHeading: 'Viðmiðslína',
    curveGrowthLabel: 'Hækkun á hver 100 stig',
    curveGrowthHint: 'Hlutfallsleg hækkun á væntanlegu tímakaupi',
    /**
     * The krónur anchor for the growth figure above.
     *
     * ⚠️ This replaces the skurðpunktur, which is `exp(intercept)` — expected
     * pay at ZERO stig, a score no job holds. Printing it invited a reader to
     * treat a meaningless extrapolation as a floor. Expected pay at the cohort's
     * MEAN score is a real point on the curve, inside the data, and it gives the
     * percentage something concrete to be a percentage of.
     */
    curveAtMeanLabel: 'Væntanlegt tímakaup við meðalstig',
    curveAtMeanHint: 'Punktur á línunni við meðalstig starfsmanna',
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
      'Viðmiðslínan er væntanlegt tímakaup eftir stigum. Launafrávik hvers starfsmanns er mælt frá henni, og úrbótaáætlun getur tekið til starfsmanna á báða vegu — bæði undir línunni og yfir henni.',
    chartScaleScore: 'stig',
    chartScaleCurrency: 'kr./klst.',
    chartRegressionSeries: 'Væntanlegt tímakaup',
    chartTooltipScore: 'Stig',
    chartTooltipSalary: 'Tímakaup',
    /**
     * ── Chart hover ──────────────────────────────────────────────────────────
     *
     * ⚠️ The tooltip is per-POINT, not per-axis-position. It used to run in
     * recharts' default axis mode, which snapped to the nearest stig, drew a
     * vertical cursor and showed whatever series happened to sit at that x —
     * including the curve. A reviewer hovering a dot got figures that were not
     * that dot's.
     */
    chartTooltip: {
      employee: 'Starfsmaður',
      gender: 'Kyn',
      score: 'Stig',
      salary: 'Tímakaup',
      /**
       * Shorter than the same field's label in the tables (`Væntanlegt
       * tímakaup`) on purpose: this one sits in a floating card over the plot,
       * and the full label made the card wide enough to cover the dots a
       * reviewer is comparing against. Nothing is lost — it sits directly under
       * `Tímakaup`, and the value carries its own kr./klst.
       */
      expected: 'Væntanlegt',
      deviation: 'Launafrávik',
      /**
       * Only on a marked dot, and the wording follows WHICH list the report has.
       * The two can never both apply: a lágmarksmengi exists only above the
       * benchmark, ábendingar rows only below it.
       */
      inMinimumSet: 'Í úrbótaáætlun',
      isAbending: 'Ábending — engra skýringa krafist',
    },
    /**
     * The ring on a marked dot, named in the legend so the mark is never a
     * mystery. Same either/or as `chartTooltip` above.
     */
    chartMarkedLegend: {
      minimumSet: 'Í úrbótaáætlun',
      abending: 'Ábending',
    },
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
      /**
       * Mirrors the submitter-facing prompt so a reviewer reads the same
       * question the company was asked. Chosen per group by folding the
       * members' `payStatus`; `mixed` is a real case because the explanation
       * lives on the group and groups may span both directions.
       */
      directionPrompt: {
        below:
          'Laun þessara starfsmanna eru lægri en starfsmatsstig þeirra gefa til kynna.',
        above:
          'Laun þessara starfsmanna eru hærri en starfsmatsstig þeirra gefa til kynna.',
        mixed:
          'Hópurinn nær yfir starfsmenn með bæði lægri og hærri laun en starfsmatsstig þeirra gefa til kynna.',
      },
      /** Suffix on the Launafrávik cell, so a row states its own direction. */
      directionBelow: 'undir',
      directionAbove: 'yfir',
    },
    /**
     * ── Ábendingar um launadreifingu ─────────────────────────────────────────
     *
     * ⚠️ **A DIFFERENT INSTRUMENT from the úrbótaáætlun above**, and this copy has
     * one job above all others: make sure nobody reads it as the same one. The
     * úrbótaáætlun obliges the employer to record an ástæða and an aðgerð for each
     * person named, and a reviewer approves on those explanations. This asks for
     * nothing, is submitted nowhere, and cannot affect how the report is decided.
     *
     * It exists because óskýrður launamunur is a difference between the cohorts'
     * MEAN deviations, so deviations that offset each other inside one cohort
     * cancel exactly. A company can sit comfortably under 3,9% while individuals
     * are a long way off the line — and the statutory figure is silent about them,
     * correctly, because there is no gender gap to report.
     *
     * ⚠️ Deliberately its own keys rather than reaching into `outlierTable`. The
     * two words they would share are cheaper duplicated than a coupling that
     * invites someone to merge the tables.
     *
     * Addressed to the EMPLOYER, not the reviewer: the person who can go and look
     * at the underlying data works inside the company.
     */
    payDispersion: {
      heading: 'Ábendingar um launadreifingu',
      intro:
        'Laun þessara starfsmanna víkja meira frá starfsmatsstigum þeirra en launadreifing fyrirtækisins skýrir.',
      /**
       * ⚠️ Load-bearing. Without this sentence the table reads as a second, softer
       * úrbótaáætlun, and a reviewer starts asking the company to account for
       * rows it owes no account of.
       */
      noObligation:
        'Engra skýringa er krafist og ekkert þarf að skrá — þetta eru ekki frávik í skilningi úrbótaáætlunar og hafa engin áhrif á afgreiðslu skýrslunnar. Ábendingin er til fyrirtækisins sjálfs: gögnin gætu þurft nánari skoðun innanhúss.',
      /**
       * The context that makes the selection explicable. Without it a reader asks
       * why someone 30% off the line is listed while someone 25% off is not — the
       * answer being that the cut-off is measured in the company's OWN spread, not
       * in percent.
       */
      spreadNote: (down: string, up: string, threshold: string) =>
        `Dæmigerð dreifing um línuna hjá þessu fyrirtæki er ${down} til ${up}. Hér eru starfsmenn sem víkja ${threshold} staðalvik eða meira frá henni.`,
      allClear:
        'Engar ábendingar — laun engra starfsmanna víkja meira frá starfsmatsstigum sínum en launadreifing fyrirtækisins skýrir.',
      /**
       * ⚠️ Each of these is a state that is NOT "all clear", and must not be
       * rendered as an empty table. "Cannot be assessed" and "nothing to report"
       * are different answers.
       */
      blockers: {
        COHORT_TOO_SMALL:
          'Of fáir starfsmenn til að meta launadreifingu áreiðanlega — það þarf að minnsta kosti 12.',
        NO_SCORE_VARIATION:
          'Öll starfsmatsstig eru eins, því liggur ekkert væntanlegt tímakaup fyrir til að víkja frá.',
        GAP_NOT_COMPUTABLE:
          'Launadreifing verður ekki metin því ekki var unnt að reikna væntanlegt tímakaup.',
      },
      numberHeader: 'Númer',
      genderHeader: 'Kyn',
      points: 'Stig',
      salary: 'Tímakaup',
      predictedSalary: 'Væntanlegt tímakaup',
      deviationHeader: 'Launafrávik',
      /** The column that explains the selection — see `spreadNote`. */
      spreadHeader: 'Staðalvik frá línu',
      directionBelow: 'undir',
      directionAbove: 'yfir',
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
    // Retired event types — nothing emits these any more, but rows logged
    // before communication status became silent still render in the timeline.
    communicationOpened: 'opnaði á samskipti við innsendanda',
    communicationClosed: 'lokaði á samskipti við innsendanda',
    companyCreated: 'Fyrirtæki skráð',
    finesStarted: 'hefur hafið dagsektarferli',
    finesStopped: 'hefur stöðvað dagsektarferli',
    apiKeyIssued: 'Aðgangslykill búinn til',
    apiKeyRevoked: 'Aðgangslykill afturkallaður',
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
    tabApiKeys: 'Aðgangslyklar',
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

    apiKeys: {
      heading: 'Aðgangslyklar',
      intro:
        'Aðgangslyklar leyfa hugbúnaði fyrirtækisins að skila skýrslum sjálfvirkt. Fyrirtæki býr yfirleitt til sinn eigin lykil í umsókn á island.is — þessi síða er til vara, til dæmis ef lykill hefur týnst og engin umsókn er opin.',
      issueButton: 'Búa til nýjan lykil',
      empty: 'Engir aðgangslyklar skráðir',
      loadError: 'Villa við að hlaða aðgangslykla',

      // Column headings
      colLabel: 'Heiti',
      colKeyId: 'Lyklanúmer',
      colCreated: 'Búinn til',
      colCreatedBy: 'Búinn til af',
      colLastUsed: 'Síðast notaður',
      colStatus: 'Staða',
      colActions: '',

      statusActive: 'Í gildi',
      statusRevoked: 'Afturkallaður',
      statusExpired: 'Útrunninn',
      neverUsed: 'Aldrei notaður',
      createdViaIslandIs: 'island.is',
      createdViaAdmin: 'Jafnréttisstofa',

      revokeButton: 'Afturkalla',
      revokeConfirmTitle: 'Afturkalla aðgangslykil?',
      revokeConfirmMessage:
        'Lykillinn hættir samstundis að virka og ekki er unnt að taka það til baka. Hugbúnaður sem notar hann getur ekki skilað skýrslum fyrr en nýr lykill hefur verið settur upp.',
      revokeConfirmButton: 'Afturkalla lykil',
      revokedToast: 'Aðgangslykill afturkallaður',
      revokeErrorToast: 'Villa við að afturkalla aðgangslykil',

      modal: {
        title: 'Búa til aðgangslykil',
        labelLabel: 'Heiti (valfrjálst)',
        labelPlaceholder: 'T.d. nafn launakerfisins',
        labelHint:
          'Heitið er eingöngu til að greina lykla að — það hefur engin áhrif á aðgang.',
        expiresLabel: 'Gildistími',
        expiresHint:
          'Lykillinn hættir að virka að gildistíma loknum. Hægt er að afturkalla hann hvenær sem er.',
        expires90Days: '90 dagar',
        expires1Year: '1 ár',
        expires2Years: '2 ár',
        expiresNever: 'Ótímabundinn',
        createButton: 'Búa til lykil',
        cancelButton: 'Hætta við',
        createErrorToast: 'Villa við að búa til aðgangslykil',

        // The one-time reveal
        createdTitle: 'Lykillinn var búinn til',
        createdWarning:
          'Afritaðu lykilinn núna. Hann er ekki geymdur og verður ekki sýndur aftur — ef hann týnist þarf að búa til nýjan.',
        copyButton: 'Afrita',
        copiedToast: 'Lykill afritaður',
        doneButton: 'Loka',
      },
    },

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
  // Shared by every reviewer-assignment control (the report sidebar, the
  // overview's reviewer column), which all go through `useAssignReviewer`.
  reviewerAssign: {
    successToast: 'Úthlutun tókst.',
    errorToast: 'Villa við að úthluta starfsmanni.',
  },
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
