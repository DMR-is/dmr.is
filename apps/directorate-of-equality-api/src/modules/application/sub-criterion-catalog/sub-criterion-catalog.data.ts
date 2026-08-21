/**
 * Jafnréttisstofa's catalog of standard sub-criteria (undirviðmið).
 *
 * GENERATED FILE — do not edit by hand. Regenerate after updating the
 * workbook:
 *
 *   node scripts/refresh-sub-criterion-catalog.js
 *
 * Source: the `Undirviðmiðalisti (Lýsigögn)` sheet of `template.xlsx`, which
 * is what feeds the Undirviðmið sheet's dropdown inside the workbook. The
 * application portal offers the same list, so the catalog is lifted out of
 * the xlsx and shipped as data rather than re-parsed at request time.
 *
 * Entries are reference material, not a closed set: an employer may pick one
 * and overwrite its wording, or register a sub-criterion as free text. The
 * personal entries with `numSteps: null` deliberately ship with step 1 only
 * — the employer authors the remaining steps.
 */

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'

export type SubCriterionCatalogEntry = {
  /** Which top-level criterion this sub-criterion belongs under. */
  criterionType: ReportCriterionTypeEnum
  /** Icelandic Yfirviðmið label as it appears in the workbook. */
  parentTitle: string
  title: string
  description: string
  /** Fjöldi þrepa, or `null` when the employer decides it. */
  numSteps: number | null
  /** Step descriptions, ordered from step 1. */
  steps: string[]
}

/**
 * Generic step wording (`Almennur þrepakvarði`) the workbook suggests for
 * sub-criteria that carry no step descriptions of their own. Indexed from
 * step 1; each entry is a comma-separated list of interchangeable phrasings.
 */
export const SUB_CRITERION_GENERAL_SCALE: readonly string[] = [
  'Aldrei, engin, takmörkuð, mjög lítið, mjög sjaldan, hóflegt, sjaldgæft',
  'Sjaldan, fremur lítið, öðru hverju, stundum, nokkuð',
  'Reglulega, í meðallagi, talsvert',
  'Fremur mikið, nokkuð oft, oft, umtalsvert, mikil',
  'Mjög mikið, mjög oft, viðvarandi',
]

export const SUB_CRITERION_CATALOG: readonly SubCriterionCatalogEntry[] = [
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Þekking og reynsla',
    description:
      'Metnar eru þær kröfur sem starf gerir til starfsmanns um sérstaka þekkingu sem öðlast má með menntun eða reynslu.',
    numSteps: 8,
    steps: [
      'Starf krefst ekki sérstakrar þekkingar umfram starfsþjálfun á vinnustað.',
      'Starf krefst einhverrar þekkingar umfram starfsþjálfun á vinnustað. Styttri námskeið og/eða nokkur starfsreynsla nægir til \nað öðlast þá þekkingu sem krafist er.',
      'Starf krefst þekkingar sem öðlast má með formlegum prófum af styttri námsbrautum - s.s. félagsliðanáms, leikskólaliða eða sambærilegs -  lengri námskeiða, eða nokkurrar starfs - og/eða stjórnunarreynslu á starfssviðinu.',
      'Starfið krefst þekkingar sem öðlast má með formlegu framhaldsnámi eftir grunnskólanám, s.s. stúdentsprófi, sveinsprófi eða sambærilegu, eða með talsverðri stjórnunarreynslu á starfssviðinu (a.m.k. 3 ár).',
      'Starfið krefst sérhæfðrar þekkingar til viðbótar við framhaldsnám eftir grunnskóla sem öðlast má annað hvort með formlegu námi eða talsverðri starfs- og stjórnunarreynslu á viðkomandi starfssviði.',
      'Starfið krefst fræðilegrar þekkingar sem byggir á kenningalegum grunni auk hagnýtrar þekkingar á sérfræðisviðinu.  \nGerð er krafa um háskólapróf á fyrsta stigi (BA/BS) eða að starfsmaður hafi lokið a.m.k. 60 einingum af mjög sérhæfðu námi á háskólastigi ásamt því að búa yfir mikilli starfs- og stjórnunarreynslu á viðkomandi starfssviði.',
      'Starfið krefst mikillar fræðilegrar þekkingar sem  byggir á kenningalegum grunni auk hagnýtrar þekkingar á sérfræðisviði sem aðeins er hægt að fá með mikilli starfs - og stjórnunarreynslu.\nGerð er krafa um háskólapróf á framhaldsstigi (MA/MS) eða háskólapróf á fyrsta stigi (BA/BS) auk mikillar starfs- og stjórnunarreynslu á viðkomandi starfssviði.',
      'Starfið krefst nákvæmrar fræðilegrar þekkingar auk mikillar hagnýtrar þekkingar sem aðeins fæst með víðtækri  starfs- og stjórnunarreynslu. \nGerð er krafa um háskólapróf á framhaldsstigi (MA/MS) eða sambærilegs auk víðtækrar \nstarfs - og stjórnunarreynslu, eða doktorspróf.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Hugræn færni',
    description:
      'Metið er hvaða kröfur starfið gerir um hugræna færni, s.s. til að þróa, greina og leysa vandamál og leggja mat á viðfangsefni hverju sinni.',
    numSteps: 5,
    steps: [
      'Starf felur í sér úrlausnir daglegra (endurtekinna) verkefna. Almenn grunnþekking sem nýtist í starfi.',
      'Starf krefst færni í að afla, túlka og meta upplýsingar til að leysa vandamál. Þekking á staðreyndum, reglum, verkferlum og almennum hugtökum.',
      'Starf krefst færni í að afla, greina, skapa eða þróa lausnir og túlka sérfræðilegar upplýsingar, ásamt færni í að móta áætlanir í afmörkuðum verkefnum. Sérhæfð og hagnýt þekking.',
      'Starf krefst færni í að greina, skapa eða þróa lausnir og túlka flóknar, sérfræðilegar upplýsingar, ásamt færni í að móta og vinna áætlanir allt að ári fram í tímann. Sérhæfð og fagleg þekking.',
      'Starf krefst færni í að greina, skapa eða þróa lausnir og túlka sérlega flóknar sérfræðilegar upplýsingar, ásamt færni í að móta áætlanir til lengri tíma. Þátttaka í mótun þekkingarsviðs og skilningur á samspili þekkingar, starfs og ytra umhverfis.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Félagsleg færni',
    description:
      'Metið er hvaða kröfur starfið gerir um færni og getu til að vinna með öðrum á árangursríkan hátt og setja sig í spor annarra.',
    numSteps: 5,
    steps: [
      'Starf krefst almennrar færni til að vinna með öðrum og vinna eftir samskiptareglum vinnustaðar.',
      'Starf krefst stundum samskipta við vinnufélaga eða viðskiptavini og getu til að vinna sem hluti af heild.',
      'Starf krefst mikillar lipurðar í samskiptum og getu til að hlusta og  vinna í hópi sem skilar niðurstöðu. Getur aðstoðað aðra og tekið ábyrgð innan hóps.',
      'Starf krefst mjög mikillar lipurðar í samskiptum og mjög náins samstarfs við aðra. Starfsmaður sýnir sjálfstæði, sveigjanleika og getur aðlagað tjáskipti að ólíkum hópum. Getur stutt og hvatt aðra og eflt liðsheild.',
      'Starf krefst viðvarandi samstarfs og samskipti við ólíka og marga aðila, í innra og ytra umhverfi.  Færni til að vinna með öðrum, að lausn mála, leysa ágreining, þjálfa og þróa hópavinnuaðferðir.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Líkamleg færni (eða lipurð og handlagni)',
    description:
      'Metið er hvaða kröfur starf gerir um líkamlega færni. Átt er við t.d. Líkamlegan styrk, handlagni, fingrafimi, lipurð, samhæfingu augna og handa og samhæfingu skynfæra.',
    numSteps: 5,
    steps: [
      'Starf krefst ekki líkamlegrar færni umfram það sem eðlilegt getur talist.',
      'Starf krefst nokkurrar líkamlegrar færni.',
      'Starf krefst talsverðrar líkamlegrar færni.',
      'Starf krefst umtalsverðrar líkamlegrar færni.',
      'Starfið krefst mjög mikillar og viðvarandi líkamlegrar færni.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Upplýsingatækni',
    description:
      'Metið er hvaða kröfur starf gerir um færni til að nota viðeigandi tölvutækni, tæki og forrit við öflun upplýsinga og þekkingar, upplýsinga- og gagnavinnslu og í samskiptum.',
    numSteps: 5,
    steps: [
      'Starf krefst ekki færni umfram almenna þekkingu til að nota tölvubúnað.',
      'Starf krefst þess að starfsmaður noti upplýsingatækni á hagnýtan og viðeigandi hátt. Gerð er krafa um að starfsmaður geti t.d. beitt einföldum aðgerðum í þeim forritum sem tengjast starfinu og notað ritvinnslu, Netið, innra net, sniðmát og tölvupóst í starfi sínu.',
      'Starf krefst þess að starfsmaður noti upplýsingatækni til að vinna úr upplýsingum og noti þær við nýjar aðstæður. Gerð er krafa um að starfsmaður geti t.d. unnið í algengum forritum, sérhæfðum gagnagrunnum, kerfum og forritum sem nauðsynleg eru til að sinna starfinu.',
      'Starf krefst þess að starfsmaður skilji og noti fjölþætta upplýsingatækni til að draga eigin ályktanir og leysa fjölbreytt verkefni. Gerð er krafa um að starfsmaður geti t.d. unnið í öllum helstu forritum, sérhæfðum gagnagrunnum, kerfum og forritum til að finna lausnir og bæta árangur.',
      'Starf krefst þess að starfsmaður hafi yfirgripsmikla þekkingu á upplýsingatækni og geti notað hana í nýjum og flóknum aðstæðum. Starfsmaður þarf einnig að geta leiðbeint öðrum sérfræðingum og tileinkað sér nýjustu viðeigandi upplýsingatækni.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Upplýsingalæsi',
    description:
      'Metið er hvaða kröfur starf gerir um færni til að vinna með fjölbreyttar upplýsingar og setja skilmerkilega fram s.s. með því að finna efni, greina, meta, vista, miðla og nýta.',
    numSteps: 5,
    steps: [
      'Starf krefst ekki færni umfram almennt upplýsingalæsi.',
      'Starf krefst þess að starfsmaður noti viðeigandi tegundir heimilda, fyrirmæla eða verkferla (munnlegar, bækur, skjöl, net, tímarit) til að afla upplýsinga og vinna úr þeim.',
      'Starf krefst þess að starfsmaður afli fjölbreyttra upplýsinga með viðeigandi heimildum og á sjálfstæðan hátt og vinni úr þeim í samræmi við fyrirmæli og faglegan grunn.',
      'Starf krefst þess að starfsmaður afli upplýsinga með viðeigandi heimildum og vinni úr þeim á gagnlegan, gagnrýnin og skapandi hátt og geti miðlað upplýsingum áfram.',
      'Leggur gagnrýnið mat á upplýsingar og heimildir þeirra. Geta til að sinna nýsköpun, þróa umbætur og kynna niðurstöður. Nýtir þekkingu og reynslu við skipulagningu og framkvæmd verkefna og getur sett fram flókin álitamál og greint ólík sjónarmið.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Íslenska',
    description:
      'Metið er hvaða kröfur starf gerir um þekkingu, skilning og notkun á íslensku.',
    numSteps: 5,
    steps: [
      'Starf krefst ekki þekkingar, skilnings eða notkunar á íslensku máli.',
      'Starf krefst nokkurrar þekkingar, skilnings og notkunar á íslensku máli.',
      'Starf krefst góðrar þekkingar, skilnings og notkunar á íslensku máli.',
      'Starf krefst mjög góðrar þekkingar, skilnings og notkunar á íslensku máli.',
      'Starf krefst afburða þekkingar, skilnings og notkunar á íslensku máli.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Erlend tungumál',
    description:
      'Metið er hvaða kröfur starf gerir um þekkingu, skilning og notkun á erlendum tungumálum.',
    numSteps: 5,
    steps: [
      'Starf krefst ekki sérstakrar þekkingar, skilnings eða notkunar á erlendu tungumáli.',
      'Starf krefst nokkurrar þekkingar, skilnings og notkunar á erlendu tungumáli/tungumálum.',
      'Starf krefst góðrar þekkingar, skilnings og notkunar á erlendu tungumáli/tungumálum.',
      'Starf krefst mjög góðrar þekkingar, skilnings og notkunar á erlendu tungumáli/tungumálum.',
      'Starf krefst afburða þekkingar, skilnings og notkunar á erlendu tungumáli/tungumálum.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Talnalæsi',
    description:
      'Metið er hvaða kröfur starf gerir um færni til að vinna með tölur og beita viðeigandi reikniaðgerðum.',
    numSteps: 5,
    steps: [
      'Starf krefst ekki færni til að vinna með tölur umfram það sem eðlilegt getur talist.',
      'Starf krefst skilnings á einföldum tölulegum upplýsingum og færni til að reikna einföld dæmi.',
      'Starf krefst færni til að gera útreikninga, setja tölulegar upplýsingar fram á réttan hátt og nota töluleg gögn til að rökstyðja og miðla upplýsingum.',
      'Starf krefst mikillar færni til að nota töluleg gögn í fjölbreyttum verkefnum. Meðhöndlun tölulegra upplýsinga er mikilvægur partur af starfinu.',
      'Starf krefst mjög mikillar færni og getu til að nota töluleg gögn í mjög fjölbreyttum verkefnum. Meðhöndlun mjög flókinna tölulegra upplýsinga er mjög viðamikill þáttur í starfinu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Sjálfstæði',
    description:
      'Metið er hvaða kröfur starf gerir um sjálfstæði og getu til að taka ákvarðanir, skipuleggja verkefni og fylgja þeim eftir.',
    numSteps: 5,
    steps: [
      'Starf krefst takmarkaðs sjálfstæðis. Starfið er unnið undir daglegri verkstjórn eða fyrirmælum og starfsmaður hefur ekkert eða lítið svigrúm til að breyta vinnuskipulagi.',
      'Starf krefst þess að unnið sé sjálfstætt eftir skipulagi og tímaplani vinnustaðar. Leysa þarf dagleg verkefni og forgangsraða eftir þörfum. Öðrum vandamálum er vísað til yfirmanns.',
      'Starf gerir töluverðar kröfur um að unnið sé sjálfstætt og verkefnum forgangsraðað innan fyrirfram ákveðins ramma. Stærri mál eru leyst í samráði við yfirmann.',
      'Starf gerir miklar kröfur um sjálfstæði og í því felst umboð og vald til ákvarðanatöku á breiðum grunni. Starf lýtur takmarkaðri stjórn hærra settra yfirmanna.',
      'Starf gerir mjög miklar og stöðugar kröfur um mikið sjálfstæði. Starfið lýtur lágmarksstjórnun og því fylgir skilgreint vald til ákvarðanatöku á víðtæku sviði.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Frumkvæði',
    description:
      'Metið er hvaða kröfur starf gerir um frumkvæð og getu til að taka af skarið, koma auga á tækifæri og sjá fyrir og bregðast við áskorunum.',
    numSteps: 5,
    steps: [
      'Starf gerir ekki sérstakar kröfur um frumkvæði.',
      'Starf gerir einhverjar kröfur um frumkvæði innan afmarkaðra verkferla.',
      'Starf gerir kröfur um töluvert frumkvæði og í því felst svigrúm til sjálfstæðra vinnubragða, túlkunar og forgangsröðunar.',
      'Starf gerir kröfur um mikið frumkvæði og getu til að vinna og þróa nýjar hugmyndir og verklag.',
      'Starf gerir mjög miklar kröfur um frumkvæði og getu til að leiðbeina, þróa umbótavinnu, leiða uppsetningu verkefna og taka þátt í nýsköpun og þróun starfsvettvangs.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Samskiptafærni',
    description:
      'Metið er hvaða kröfur starf gerir um færni í munnlegum og/eða skriflegum samskiptum. Taka þarf tillit til eðli samskiptanna.',
    numSteps: 5,
    steps: [
      'Starf gerir ekki kröfur um sérstaka samskiptafærni umfram almenna færni til að skiptast á almennum upplýsingum  við starfsfélaga og viðskiptavini.',
      'Starf krefst færni til að skiptast reglulega á almennum upplýsingum við starfsfélaga og einstaka sinnum við almenning/viðskiptavini. Starf krefst getu til að sýna nærgætni þegar það á við.',
      'Starf gerir talsverðar kröfur um samskiptafærni þar sem samskipti eru mikilvægur þáttur í starfinu. Gerð er krafa um einhverskonar þjálfun eða reynslu af sambærilegum samskiptum.',
      'Starf gerir miklar kröfur um samskiptafærni. Flókin eða erfið samskipti vega þungt í daglegu starfi.',
      'Starf gerir mjög miklar kröfur um samskiptafærni. Meginþáttur starfsins er að takast á við viðvarandi flókin eða erfið samskipti. Starf gæti krafist náms og/eða reynslu á sviði samskipta.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Öryggisvitund',
    description:
      'Metið er hvaða kröfur starf gerir um öryggisvitund. Hér er átt við kröfur um færni til að framfylgja öruggum starfsháttum, koma auga á aðstæður sem geta skapað hættu á vinnustað og grípa til viðeigandi ráðstafana til að halda vinnuumhverfinu öruggu.',
    numSteps: 5,
    steps: [
      'Starf gerir ekki kröfur um öryggisvitund umfram það að fara eftir almennum leiðbeiningum og reglum um öryggi og hollustu og vita hvert eigi að leita aðstoðar ef þörf er á.',
      'Starf gerir kröfur um að farið sé eftir leiðbeiningum og reglum um öryggi og hollustu og brugðist sé við aðstæðum sem augljóslega skapa hættu á vinnustað.',
      'Starf gerir kröfur um að farið sé eftir leiðbeiningum og reglum um öryggi og hollustu og stuðlað sé að því að auka öryggi og tryggja öruggari og betri vinnuaðstæður.',
      'Starf gerir miklar kröfur um að ávallt sé framfylgt kröfum um örugga starfshætti, farið sé eftir öllum reglum um öryggi og hollustu og unnið sé markvisst að aukinni öryggisvitund og öruggari og betri vinnuaðstæðum.',
      'Starf gerir mjög miklar kröfur um að ávalllt sé framfylgt öllum kröfum um örugga starfshætti, upplýsingum um öruggt verklag sé miðlað reglulega, verklagsreglur um öryggi og hollustuhætti séu innleiddar, eftirlit sé haft með öryggi á vinnustað og gerðar séu viðeigandi ráðstafanir til að tryggja öryggi.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Mannaforráð',
    description:
      'Metið er hvaða kröfur starf gerir um ábyrgð á störfum annarra, þ.e. hvort því fylgir formleg ábyrgð og umsjón með starfsfólki, s.s. við ráðningar, hvatningar og mótun starfsmannastefnu.',
    numSteps: 5,
    steps: [
      'Starf felur í sér takmarkaða eða enga beina ábyrgð á verkstjórn, leiðsögn eða samræmingu á vinnu annarra.',
      'Starf felur í sér einhverja beina ábyrgð á verkstjórn, samræmingu á vinnu annarra eða þjálfun annarra starfsmanna.',
      'Starf felur í sér talsverða beina ábyrgð á stjórnun, leiðsögn, samræmingu eða þjálfun og þróun annarra starfsmanna.',
      'Starf felur í sér mikla beina ábyrgð á stjórnun, leiðsögn, samræmingu og þróun töluverðs fjölda annarra starfsmanna.',
      'Starf felur í sér mjög mikla beina ábyrgð á stjórnun, leiðsögn, samræmingu og þróun mikils fjölda annarra starfsmanna.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Verkefnastjórnun',
    description:
      'Metið er hvaða kröfur starf gerir um stýringu og skipulag á notkun aðfanga í því skyni að verkefni, atburður eða ferli færist nær verkáfanga eða verklokum.',
    numSteps: 5,
    steps: [
      'Starf felur í sér takmarkaða eða enga verkefnastjórnun. Auðlindir/aðföng (resources)eru notaðar í samræmi við starfsreglur.',
      'Starf gerir kröfur um að gerðar séu tímaáætlanir og þeim fylgt eftir. Auðlindir, tæki og tól notuð á hagkvæman hátt.',
      'Starf gerir kröfur um skipulag og stjórnun verkefnateyma og umsjón með hagkvæmri nýtingu auðlinda.',
      'Starf gerir kröfur um stýringu og mat á stjórnun auðlinda og að árangursmælikvarðar séu skilgreindir og nýttir með þarfir verkefnis og viðskiptavina í huga.',
      'Starf gerir kröfur um þekkingu og færni til að nota aðferðafræði verkefnastjórnunar. Starf gerir kröfur um yfirsýn yfir verkþætti, áætlanir, samstarfsaðila og tök á fjölbreyttum vinnu- og matsaðferðum.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á fjármálum',
    description:
      'Metið er hvaða kröfur starf gerir um ábyrgð á fjármunum, s.s. reiðufé, beiðnum, ávísunum, reikningsfærslum, rafrænum bankafærslum, reikningum, fjárhagsáætlunum, tekjum og gjöldum.',
    numSteps: 5,
    steps: [
      'Starf felur í sér takmarkaða eða enga beina ábyrgð á fjármunum.',
      'Starf felur í sér nokkra beina ábyrgð á fjármunum.',
      'Starf felur í sér mikla beina ábyrgð á fjármunum og eftirlit með kostnaði s.s. gjöldum og tekjum í afmörkuðum verkefnum.',
      'Starf felur í sér mjög mikla beina ábyrgð á fjármunum og aðkomu að ákvörðunum um útgjöld og hagkvæmni.',
      'Starf felur í sér mjög yfirgripsmikla beina ábyrgð á fjármunum, s.s. ábyrgð á reikningum og reikningsskilum og umsjón með framkvæmd, þróun og endurskoðun fjármála.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á þjónustu',
    description: 'Metið er hvaða kröfur starf gerir um ábyrgð á þjónustu.',
    numSteps: 5,
    steps: [
      'Starf felur í sér takmarkaða eða enga beina ábyrgð á þjónustu.',
      'Starf felur í sér nokkra beina ábyrgð á framkvæmd þjónustu.',
      'Starf felur í sér mikla beina ábyrgð á þjónustu, s.s. skipulagi og mati á einstaka þjónustuþáttum.',
      'Starf felur í sér mjög mikla beina ábyrgð á þjónustu s.s. skipulagi, þróun og mati á þjónustuliðum',
      'Starf felur í sér mjög yfirgripsmikla beina ábyrgð á þjónustu s.s. skipulagi, þróun, mati og umbótum á þjónustu ásamt innleiðingum á breytingum.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á upplýsingagjöf',
    description:
      'Metið er hvaða kröfur starf gerir um ábyrgð á upplýsingagjöf.',
    numSteps: 5,
    steps: [
      'Starf felur í sér takmarkaða eða enga beina ábyrgð á upplýsingagjöf.',
      'Starf felur í sér nokkra beina ábyrgð á upplýsingagjöf.',
      'Starf felur í sér mikla beina ábyrgð á upplýsingagjöf.',
      'Starf felur í sér mjög mikla beina ábyrgð á upplýsingagjöf.',
      'Starf felur í sér mjög yfirgripsmikla beina ábyrgð á upplýsingagjöf.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á velferð fólks',
    description:
      'Metið er hvaða kröfur starf gerir um ábyrgð á velferð einstaklinga eða hópa, t.d. almennings, þjónustuþega og/eða viðskiptavina.',
    numSteps: 5,
    steps: [
      'Starf felur í sér takmörkaða eða enga ábyrgð á velferð einstaklinga eða hópa.',
      'Starf felur í sér einhverja ábyrgð á velferð einstaklinga eða hópa vegna verkefna eða skyldna sem snúa beint að hag þeirra.',
      'Starf felur í sér talsverða ábyrgð á velferð fólks, t.d. þar sem greina þarf þarfir einstaklinga eða hópa eða framfylgja/innleiða lög og reglur sem hafa áhrif á velferð þeirra.',
      'Starf felur í sér mikla ábyrgð á velferð fólks, t.d. Þar sem greina þarf eða meta þörf fyrir þjónustu einstaklinga eða hópa eða framfylgja/innleiða lög og reglur sem hafa áhrif á velferð þeirra.',
      'Starf felur í sér mjög mikla ábyrgð á velferð einstaklinga eða hópa þar sem fram fer mat á þörfum fólks, úrvinnsla mats og skipulag umönnunar, þjónustu eða stuðnings.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á öryggi, hreinlæti og umhverfi.',
    description:
      'Metið er hvaða kröfur starf gerir um ábyrgð á öryggi, hreinlæti og umhverfi, t.d. á slysavörnum, upplýsingaöryggi, netöryggi, mengunarvörnum og svo frv.',
    numSteps: 5,
    steps: [
      'Starf felur í sér takmarkaða eða enga beina ábyrgð á öryggi og/eða hreinlæti.',
      'Starf felur í sér nokkra beina ábyrgð á öryggi og/eða hreinlæti. Getur falið í sér að halda utan um algeng, einföld verkefni öryggismála.',
      'Starf felur í sér mikla beina ábyrgð á öryggi og/eða hreinlæti. Gerðar eru kröfur um yfirsýn yfir öryggismál á ákveðnu sviði.',
      'Starf felur í sér mjög mikla beina ábyrgð á öryggi og/eða hreinlæti. Starfi fylgir krafa um yfirsýn og ábyrgð á réttri framkvæmd öryggismála á sínu sviði.',
      'Starfið felur í sér mjög yfirgripsmikla beina ábyrgð á öryggi og/eða hreinlæti. Gerð er krafa um sérþekkingu á öryggismálum og getu til að framkvæma faglegt mat og þróa nýja verkferla eða innleiða umbætur út frá mati.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á gæðum',
    description:
      'Metið er hvaða kröfur starf gerir um ábyrgð á því hvernig efnisleg og huglæg gæði eru nýtt, hvernig þeirra er aflað og þeim skipt.',
    numSteps: 5,
    steps: [
      'Starf felur í sér takmarkaða eða enga ábyrgð á gæðum.',
      'Starf felur í sér ábyrgð á öflun verkefna og/eða úrlausn verkefna og/eða öflun tekna til sérverkefna.',
      'Starf felur í sér ábyrgð á framkvæmd tillagna/ákvarðana og eftirlit og eftirfylgni með hagkvæmri notkun verðmæta.',
      'Starf felur í sér ábyrgð á tillögum og ákvörðunum auk stýringar og mati á notkun verðmæta.',
      'Starf felur í sér ábyrgð á ákvörðunum sem ætlað er að hafa miklar breytingar í för með sér, t.a.m. ábyrgð á skilgreiningum og forgangsröðun verkefna og mat á skilvirkni í notkun gæða.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á búnaði (eða auðlindum)',
    description:
      'Metið er hvaða kröfur starf gerir um ábyrgð á búnaði, s.s. hugbúnaði, upplýsingakerfum, gögnum eða skjölum, verkfærum, tækjum og vélum, vörubirgðum, byggingum, landareignum og öðrum svæðum.',
    numSteps: 5,
    steps: [
      'Starf felur í sér takmarkaða eða enga beina ábyrgð á búnaði, tækjum og/eða mannvirkjum.',
      'Starf felur í sér nokkra beina ábyrgð á búnaði, tækjum og/eða mannvirkjum.',
      'Starf felur í sér talsverða beina ábyrgð á búnaði, tækjum og/eða mannvirkjum.',
      'Starf felur í sér mikla beina ábyrgð á búnaði, tækjum og/eða mannvirkjum.',
      'Starf felur í sér mjög mikla beina ábyrgð á búnaði, tækjum og/eða mannvirkjum.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á trúnaðarupplýsingum',
    description:
      'Metið er hvaða kröfur starf gerir um ábyrgð á trúnaðarupplýsingum.',
    numSteps: 5,
    steps: [
      'Starf felur í sér takmarkaða eða enga beina ábyrgð á trúnaðarupplýsingum.',
      'Starf felur í sér nokkra beina ábyrgð á trúnaðarupplýsingum.',
      'Starf felur í sér mikla beina ábyrgð á trúnaðarupplýsingum.',
      'Starf felur í sér mjög mikla beina ábyrgð á trúnaðarupplýsingum.',
      'Starf felur í sér mjög yfirgripsmikla beina ábyrgð á trúnaðarupplýsingum.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.STRAIN,
    parentTitle: 'Álag',
    title: 'Tilfinningalegt álag',
    description:
      'Metið erhversu mikið tilfinningalegt álag starfi fylgir, t.d. vegna erfiðra samskipta, viðvarandi álags vegna tímapressu eða mikillar ófyrirséðrar viðveru.',
    numSteps: 5,
    steps: [
      'Starf felur í sér ekkert eða mjög takmarkað tilfinningalegt álag umfram það sem eðlilegt getur talist.',
      'Starf getur stundum falið í sér tilfinningalegt álag vegna tilfallandi samskipta við krefjandi aðila.',
      'Starf felur almennt í sér nokkuð tilfinningalegt álag eða öðru hverju umtalsvert tilfinningalegt álag.\nGert er ráð fyrir að tilfinningalegt álag sé fyrirsjáanlegur hluti starfs vegna samskipta eða náinnar vinnu með krefjandi hópum eða einstaklingum.',
      'Starf felur almennt í sér umtalsvert tilfinningalegt álag eða öðru hverju mjög mikið tilfinningalegt álag. Gert er ráð fyrir að tilfinningalegt álag sé reglulegur og fyrirsjáanlegur hluti starfs vegna krefjandi samskipta og ákvarðana um úrræði fyrir krefjandi hópa eða einstaklinga og umsjón með málum þeirra. Starfi fylgir umtalsverð tilfinningaleg áreynsla.',
      'Starf felur í sér mjög mikið viðvarandi tilfinningalegt álag og gert er ráð fyrir að það sé óhjákvæmilegur hluti þess. Starfi fylgja samskipti við aðila eða hópa sem geta vegna aðstæðna sinna valdið mjög miklu viðvarandi tilfinningalegu álagi. Starfi fylgja ákvarðanir um úrræði og ábyrgð á ákvarðanatöku í málum einstaklinga og hópa sem hafa veruleg áhrif á aðstæður og velferð þeirra.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.STRAIN,
    parentTitle: 'Álag',
    title: 'Líkamlegt álag',
    description:
      'Metið er hversu mikið líkamlegt álag starfi fylgir, t.d. vegna krafna um úthald, styrk, áreynslu, líkamsbeitingu, hreyfingu, samhæfingu og viðbragðsflýti og hversu mikið reynir á slíkt.',
    numSteps: 5,
    steps: [
      'Starf felur í sér lítið eða takmarkað líkamlegt álag.',
      'Starf felur í sér eitthvert viðvarandi líkamlegt álag eða takmarkað líkamlegt álag að jafnaði.',
      'Starf felur í sér reglulegt líkamlegt álag eða öðru hverju umtalsvert líkamlegt álag.',
      'Starf felur í sér viðvarandi mikið líkamlegt álag sem er óhjákvæmilegur hluti starfsins eða öðru hverju mjög mikið líkamlegt álag.',
      'Starf felur í sér mjög mikið viðvarandi líkamlegt álag sem er óhjákvæmilegur og fyrirsjáanlegur hluti starfsins.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.STRAIN,
    parentTitle: 'Álag',
    title: 'Áreiti og andlegt álag',
    description:
      'Metið er hversu mikið andlegt álag starfi fylgir, m.a. með tillitit til athygli, árverkni og einbeitingar og þess áreitis sem búast má við vegna samskipta við annað fólk. Tekið skal tillit til mismunandi tegunda andlegrar áreynslu, til dæmis þess að hugsa, horfa og hlusta.',
    numSteps: 5,
    steps: [
      'Starf felur í sér lítið eða takmarkað andlegt álag.',
      'Starf felur öðru hverju í sér eitthvert andlegt álag. Gerðar eru einhverjar kröfur um andlega áreynslu, athygli, árverkni, einbeitingu og viðveru umfram lágmarks vinnuskyldu.',
      'Starf felur í sér nokkuð andlegt álag. Gert er ráð fyrir að andleg áreynsla sé fyrirsjáanlegur hluti starfsins og gerðar eru þó nokkrar kröfur um athygli, árverkni, einbeitingu  og viðveru umfram lágmarks vinnuskyldu.',
      'Starf felur í sér umtalsvert andlegt álag eða öðru hverju mjög mikið andlegt álag. Gert er ráð fyrir að andleg áreynsla sé reglulegur og fyrirsjáanlegur hluti starfsins og gerðar eru umtalsverðar kröfur um athygli, árverkni, einbeitingu og viðveru umfram lágmarks vinnuskyldu.',
      'Starf felur í sér mjög mikið viðvarandi andlegt álag. Gert er ráð fyrir að mjög mikil andleg áreynsla sé óhjákvæmilegur og fyrirsjáanlegur hluti starfsins og gerðar eru mjög miklar kröfur um athygli, árverkni, einbeitingu og viðveru umfram lágmarks vinnuskyldu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.CONDITION,
    parentTitle: 'Vinnuaðstæður',
    title: 'Vinnuumhverfi',
    description:
      'Metið er hvort starfi fylgi vinnuaðstæður sem talist geti óæskilegar, óþægilegar eða hættulegar sökum umhverfisþátta eða vinnu með fólki. Þeir þættir sem taka þarf tillit til eru m.a. hitastig, hitabreytingar. óhreinindi, ryk, loftræsting, raki, titringur, líkamsvessar, úrgangur, óþefur, reykur, fita, olía, skörp áhöld og verkfæri, veður, ónæði, umgangur og einangrun. Einnig er metið hvort hætta sé á einhverskonar ofbeldi eða ágengni. Tekið skal tillit til þess hversu oft og hversu lengi þarf að vinna við óæskilegar, óþægilegar eða hættulegar aðstæður.',
    numSteps: 5,
    steps: [
      'Starfi fylgja sjaldan eða aldrei aðstæður sem talist geta óæskilegar, óþægilegar eða hættulegar. Hætta á ofbeldi, ágengni, meiðslum, sjúkdómum eða öðrum heilsufarsvandamálum er hverfandi lítil eða engin.',
      'Starfi fylgja stundum aðstæður sem talist geta óæskilegar, óþægilegar eða hættulegar. Ekki er þörf á öryggisbúnaði eða sérstökum varúðarráðstöfunum. Upp geta komið að stæður þar sem hætta er á ofbeldi, ágengni eða óviðeigandi hegðun annars fólks.',
      'Starfi fylgja reglulega aðstæður sem talist geta óæskilegar, óþægilegar eða hættulegar. Þörf á öryggisbúnaði og sérstökum varúðarráðstöfunum getur verið til staðar, eða hætta á ofbeldi, ágengni eða óviðeigandi hegðun annars fólks er töluverð.',
      'Starfi fylgja að jafnaði aðstæður sem geta talist óæskilegar, óþægilegar eða hættulegar. Þörf er jafnan á sérstökum öryggisbúnaði og fylgja þarf nákvæmlega sérstökum varrúðarráðstöfunum, eða hætta á ofbeldi, ágengni eða óviðeigandi hegðun annars fólks er mikil.',
      'Starfi fylgja almennt mjög óæskilegar, óþægilegar eða hættulegar aðstæður. Ávallt er þörf á sérstökum öryggisbúnaði og fylgja þarf nákvæmlega sérstökum varrúðarráðstöfunum, eða hætta á ofbeldi, ágengni eða óviðeigandi hegðun annars fólks er mjög mikil.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.CONDITION,
    parentTitle: 'Vinnuaðstæður',
    title: 'Hávaði',
    description:
      'Metið er hvort starfi fylgi hávaði sem getur m.a. orsakast af margskonar vélarhljóðum, vinnuvélum, tækjum og fólki. Taka skal tillit til hversu mikill hávaðinn er, mælt í desíbilum (dB) og hversu viðvarandi hávaðinn er.',
    numSteps: 5,
    steps: [
      'Starfi fylgir sjaldan eða aldrei hávaði sem talist getur valda óþægindum.',
      'Starfi fylgir öðru hverju tímabundinn hávaði frá vélum, tækjum, búnaði og/eða fólki.',
      'Starf fylgir að tímabundinn hávaði frá vélum, tækjum og búnaði og/eða fólki sé fyrirsjáanlega nokkur hluti þess.',
      'Starfi fylgir að umtalsverður hávaði frá vélum, tækjum og búnaði og /eða fólki er reglulegur og fyrirsjáanlegur hluti þess.',
      'Starfi fylgir að mjög mikill hávaði frá vélum, tækjum, búnaði og/eða fólki sé óhjákvæmilegur og fyrirsjáanlegur hluti þess.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.CONDITION,
    parentTitle: 'Vinnuaðstæður',
    title: 'Lýsing',
    description:
      'Metið er hvort starfi fylgi slæm lýsing. Taka þarf tillit til mismunandi ljósgjafa (dagsbirta, innilýsing), og eiginleika lýsingar og umhverfis s.s. með tilliti til endurskins og ofbirtu.',
    numSteps: 5,
    steps: [
      'Starf er sjaldan eða aldrei unnið við slæma lýsingu.',
      'Starf getur öðru hverju þurft að vinna við óæskilega lýsingu.',
      'Starfi fylgir að óæskileg lýsing sé fyrirsjáanlega nokkur hluti þess.',
      'Starfi fylgir að regluleg óæskileg lýsing sé umtalsverður og fyrirsjáanlegur hluti þess.',
      'Starfi fylgir að óæskileg lýsing sé óhjákæmilegur og fyrirsjáanlegur hluti þess.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.CONDITION,
    parentTitle: 'Vinnuaðstæður',
    title: 'Gufur og eiturefni',
    description:
      'Metið er hvort starfi fylgi áhætta vegna efnanotkunar, s.s. vegna gass, gufa og leysiefna.',
    numSteps: 5,
    steps: [
      'Starfi fylgir sjaldan eða aldrei áhætta vegna efnanotkunar.',
      'Starfi fylgir öðru hverju takmörkuð áhætta vegna efnanotkunar.',
      'Starfi fylgir að vinna í eða með efni sem geta valdið óþægindum eða skaða sé fyrirsjánlega nokkur hluti þess.',
      'Starfi fylgir að umtalsverð snerting við óæskileg eða hættuleg efni sé reglulegur og fyrirsjáanlegur hluti þess.',
      'Starfi fylgir að mjög mikil snerting við óæskileg eða hættuleg efni sé óhjákvæmilegur og fyrirsjáanlegur hluti þess.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.CONDITION,
    parentTitle: 'Vinnuaðstæður',
    title: 'Vinnuhraði',
    description:
      'Metið er hvort starfi fylgi miklar kröfur um vinnuhraða. Tekið skal tillit til afkasta og tímapressu.',
    numSteps: 5,
    steps: [
      'Starfi fylgja litlar kröfur um vinnuhraða og tímapressa er sjaldgæf.',
      'Starfi fylgja takmarkaðar kröfur um vinnuhraða en einhver tímapressa kann að vera til staðar.',
      'Starfi fylgja nokkrar kröfur um vinnuhraða og tímapressa getur verið töluverð.',
      'Starfi fylgja miklar kröfur um vinnuhraða og tímapressa er mikil.',
      'Starfi fylgja mjög miklar kröfur um vinnuhraða og tímpressa er mjög mikil.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.CONDITION,
    parentTitle: 'Vinnuaðstæður',
    title: 'Hætta á slysum og sjúkdómum',
    description:
      'Metið er hvort starfi fylgi hætta á slysum og sjúkdómum. Tekið er tillit til allra vinnuaðstæðna sem valdið geta skaða.\nDæmi um hættur og afleiðingar þeirra: skurðir, bruni, fall, eitrun, sprengingar, raflost, líkamleg meiðsl, heyrnarskemmdir, húðsjúkdómar, smitsjúkdómar, ofnæmi, streita, stoðkerfisvandamál og öndunarfærasjúkdómar.',
    numSteps: 5,
    steps: [
      'Starfi fylgir lítil eða takmörkuð hætta á slysum og/eða sjúkdómum.',
      'Starfi fylgir einhver hætta á slysum og sjúkdómum, en alvarlegir sjúkdómar og/eða slys heyra til undantekninga.',
      'Starfi fylgir að nokkur hætta á slysum og sjúkdómum sé fyrirsjánlegur hluti þess.',
      'Starfi fylgir að umtalsverð og viðvarandi hætta á slysum og sjúkdómum sé reglulegur og fyrirjáanlegur hluti þess.',
      'Starfi fylgir að mjög mikil og viðvaranadi hætta á slysum og sjúkdómum sé óhjákvæmilegur og fyrirsjáanlegur hluti þess.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Aukaábyrgð',
    title: 'Þjálfun annars starfsfólks/handleiðsla',
    description:
      'Þátttaka/ábyrgð starfsmanns á þjálfun starfsfólks sem metin er til launa.',
    numSteps: 5,
    steps: [
      'Starfsmaður tekur lítinn eða engan þátt í þjálfun starfsfólks',
      'Starfsmaður tekur einhvern þátt í þjálfun starfsfólks',
      'Starfsmaður tekur nokkurn þátt í þjálfun nýs/annars starfsfólks',
      'Starfsmaður skipuleggur og tekur mikinn þátt í þjálfun starfsfólks og ber einhverja ábyrgð á henni.',
      'Starfsmaður ber mikla ábyrgð á skipulagi og þjálfun starfsfólks',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Þekking og reynsla',
    title: 'Starfsreynsla',
    description:
      'Starfsreynsla á vinnustað eða í sambærilegu starfi sem metin er starfsmanni til launa (fram þarf að koma hversu mikla starfsreynslu þarf til að laun hækki).',
    numSteps: 5,
    steps: [
      'Starfsmaður hefur ekki starfsreynslu sem metin er til launa.',
      'Starfsmaður hefur nokkra starfsreynslu (X ár).',
      'Starfsmaður hefur nokkuð mikla starfsreynslu (X ár).',
      'Starfsmaður hefur mikla starfsreynslu (X ár).',
      'Starfsmaður hefur mjög mikla starfsreynslu (meira en X ár) og getu til að leiðbeina.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Þekking og reynsla',
    title: 'Starfsaldur',
    description:
      'Starfsaldur á vinnustað sem metin er starfsmanni til launa. (Fram þarf að koma hversu langan starfsaldur þarf til að laun hækki).',
    numSteps: 5,
    steps: [
      'Starfsmaður hefur ekki náð starfsaldri sem metinn er til launa.',
      'Starfsmaður hefur náð fyrsta starfsaldursþrepi (X ár).',
      'Starfsmaður hefur náð öðru starfsaldursþrepi (X ár).',
      'Starfsmaður hefur náð þriðja starfsaldursþrepi (X ár).',
      'Starfsmaður hefur náð fjórða starfsaldursþrepi (X ár).',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Þekking og reynsla',
    title: 'Menntun',
    description:
      'Menntun starfsmanns umfram kröfur til starfs, sem nýtist í starfi og metin er til launa.',
    numSteps: 5,
    steps: [
      'Starfsmaður hefur ekki umframmenntun sem metin er til launa.',
      'Starfsmaður hefur einhverja umframmenntun sem metin er til launa',
      'Starfsmaður hefur nokkra umframmenntun sem metin er til launa',
      'Starfsmaður hefur mikla umframmenntun sem metin er til launa',
      'Starfsmaður hefur mjög mikla umframmenntun sem metin er til launa',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Færni',
    title: 'Hugræn færni',
    description:
      'Færni starfsmanns, umfram það sem starfið krefst, til að þróa, greina og leysa vandamál og leggja mat á viðfangsefni hverju sinni, sem nýtist í starfi og er metin er starfsmanni til launa.',
    numSteps: 5,
    steps: [
      'Starfsmaður sýnir ekki hugræna færni, umfram það sem starfið krefst.',
      'Starfsmaður beitir stundum hugræni færni í starfi/störfum sínum, umfram það sem krafist er.',
      'Starfsmaður beitir reglulega hugrænni færni í starfi/störfum sínum, umfram það sem krafist er.',
      'Starfsmaður beitir oft hugrænni færni í starfi/störfum sínum, umfram það sem krafist er.',
      'Starfsmaður beitir mjög oft hugrænni færni í starfi/störfum sínum, umfram það sem krafist er.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Færni',
    title: 'Félagsleg færni',
    description:
      'Færni og geta starfsmanns, umfram það sem starfið krefst, til að vinna með öðrum á árangursríkan hátt og setja sig í spor annarra, og metin er starfsmanni til launa.',
    numSteps: 5,
    steps: [
      'Starfsmaður beitir ekki félagslegri færni, umfram það sem starfið krefst.',
      'Starfsmaður beitir stundum félagslegri færni í starfi/störfum sínum, umfram það sem krafist er.',
      'Starfsmaður beitir reglulega félagslegri færni í starfi/störfum sínum, umfram það sem krafist er.',
      'Starfsmaður beitir oft félagslegri færni í starfi/störfum sínum, umfram það sem krafist er.',
      'Starfsmaður beitir mjög oft félagslegri færni í starfi/störfum sínum, umfram það sem krafist er.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Færni',
    title: 'Líkamleg færni (eða lipurð og handlagni)',
    description:
      'Sérstök líkamleg færni starfsmanns, umfram það sem krafist er, og metin er til launa. Átt er við t.d. líkamlegan styrk, handlagni, fingrafimi, lipurð, samhæfingu augna og handa og samhæfingu skynfæra.',
    numSteps: 5,
    steps: [
      'Starfsmaður beitir ekki líkamlegri færni, umfram það sem starfið krefst.',
      'Starfsmaður beitir stundum líkamlegri færni í starfi/störfum sínum, umfram það sem krafist er.',
      'Starfsmaður beitir reglulega líkamlegri færni í starfi/störfum sínum, umfram það sem krafist er.',
      'Starfsmaður beitir oft líkamlegri færni í starfi/störfum sínum, umfram það sem krafist er.',
      'Starfsmaður beitir mjög oft líkamlegri færni í starfi/störfum sínum, umfram það sem krafist er.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Færni',
    title: 'Upplýsingatækni',
    description:
      'Færni starfsmanns, umfram það sem starfið krefst, til að nota upplýsingatækni, s.s. tölvutækni, tæki og forrit við öflun upplýsinga og þekkingar, upplýsinga- og gagnavinnslu og í samskiptum, og metin er til launa.',
    numSteps: 5,
    steps: [
      'Færni starfsmanns til að vinna með upplýsingatækni umfram það sem starfið krefst er ekki til staðar eða nýtist ekki í starfi.',
      'Starfsmaður notar stundum upplýsingatækni umfram það sem starfið krefst.',
      'Starfsmaður notar reglulega upplýsingatækni umfram það sem starfið krefst.',
      'Starfsmaður notar oft upplýsingatækni umfram það sem starfið krefst.',
      'Starfsmaður notar mjög oft upplýsingatækni umfram það sem starfið krefst.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Færni',
    title: 'Upplýsingalæsi',
    description:
      'Færni starfsmanns, umfram það sem starfið krefst, til að vinna með fjölbreyttar upplýsingar og setja skilmerkilega fram (s.s. með því að finna efni, greina, meta, vista, miðla og nýta), og metin er til launa.',
    numSteps: 5,
    steps: [
      'Upplýsingalæsi starfsmanns umfram það sem starfið krefst er ekki til staðar eða nýtist ekki í starfi.',
      'Upplýsingalæsi starfsmanns umfram það sem starfið krefst nýtist stundum í starfi.',
      'Upplýsingalæsi starfsmanns umfram það sem starfið krefst nýtist reglulega í starfi.',
      'Upplýsingalæsi starfsmanns umfram það sem starfið krefst nýtist oft í starfi.',
      'Upplýsingalæsi starfsmanns umfram það sem starfið krefst nýtist mjög oft í starfi.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Þekking og reynsla',
    title: 'Íslenska',
    description:
      'Þekking, skilningur og notkun á íslensku máli umfram það sem starfið krefst og metin er til launa. (T.d. prófarkalestur sem ekki er hluti af starfslýsingu starfsmanns).',
    numSteps: 5,
    steps: [
      'Íslenskukunnátta starfsmanns umfram það sem starfið krefst er ekki til staðar eða nýtist ekki í starfi.',
      'Íslenskukunnátta starfsmanns umfram það sem starfið krefst nýtist stundum í starfi.',
      'Íslenskukunnátta starfsmanns umfram það sem starfið krefst nýtist reglulega í starfi.',
      'Íslenskukunnátta starfsmanns umfram það sem starfið krefst nýtist oft í starfi.',
      'Íslenskukunnátta starfsmanns umfram það sem starfið krefst nýtist mjög oft í starfi.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Þekking og reynsla',
    title: 'Erlend tungumál',
    description:
      'Vald starfsmanns á erlendu tungumáli sem nýtist fyrirtæki/stofnun og metin er til launa. (T.d. skrif, þýðingar, túlkun og verkefni sem ekki eru hluti af starfslýsingu starfsmanns og annars væri útvistað).',
    numSteps: 5,
    steps: [
      'Vald starfsmanns á erlendu tungumáli umfram það sem starfið krefst er ekki til staðar eða nýtist ekki í starfi.',
      'Vald starfsmanns á erlendu tungumáli umfram það sem starfið krefst nýtist stundum í starfi.',
      'Vald starfsmanns á erlendu tungumáli umfram það sem starfið krefst nýtist reglulega í starfi.',
      'Vald starfsmanns á erlendu tungumáli umfram það sem starfið krefst nýtist oft í starfi.',
      'Vald starfsmanns á erlendu tungumáli umfram það sem starfið krefst nýtist mjög oft í starfi.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Frammistaða',
    title: 'Sjálfstæði',
    description:
      'Færni og vilji starfsmanns til að grípa til sjálfstæðra aðgerða, og skipuleggja og ljúka verkefnum, umfram það sem starfið krefst, sem metin er til launa.',
    numSteps: 5,
    steps: [
      'Starfsmaður sýnir ekki sjálfstæði umfram það sem starfið krefst.',
      'Starfsmaður sýnir eitthvert sjálfstæði umfram það sem starfið krefst.',
      'Starfsmaður sýnir nokkuð sjálfstæði umfram það sem starfið krefst.',
      'Starfsmaður sýnir mikið sjálfstæði umfram það sem starfið krefst.',
      'Starfsmaður sýnir mjög mikið sjálfstæði umfram það sem starfið krefst.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Frammistaða',
    title: 'Frumkvæði',
    description:
      'Frumkvæði og vilji starfsmanns, umfram það sem starfið krefst, sem metin eru til launa. (T.d. við að koma í veg fyrir og leysa vandamál, bæta verkferla, nýta tækifæri til hagræðingar og skilvirkni, og bera kennsl á tækifæri fyrir vinnustaðinn).',
    numSteps: 5,
    steps: [
      'Starfsmaður sýnir ekki frumkvæði umfram það sem starfið krefst.',
      'Starfsmaður sýnir eitthvert frumkvæði umfram það sem starfið krefst.',
      'Starfsmaður sýnir nokkuð frumkvæði umfram það sem starfið krefst.',
      'Starfsmaður sýnir mikið frumkvæði umfram það sem starfið krefst.',
      'Starfsmaður sýnir mjög mikið frumkvæði umfram það sem starfið krefst.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Frammistaða',
    title: 'Samskiptafærni',
    description:
      'Þekking og færni starfsmanns í munnlegum og/eða skriflegum samskiptum sem ekki er hluti af starfslýsingu og nýtist fyrirtæki/stofnun, og metin er til launa.',
    numSteps: 5,
    steps: [
      'Samskiptafærni starfsmanns, umfram það sem starfið krefst, er ekki til staðar eða nýtist ekki í starfi.',
      'Samskiptafærni starfsmanns umfram það sem starfið krefst nýtist stundum í starfi.',
      'Samskiptafærni starfsmanns umfram það sem starfið krefst nýtist reglulega í starfi.',
      'Samskiptafærni starfsmanns umfram það sem starfið krefst nýtist oft í starfi.',
      'Samskiptafærni starfsmanns umfram það sem starfið krefst nýtist mjög oft í starfi.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Aukaábyrgð',
    title: 'Ábyrgð á XXXXX',
    description:
      'Ábyrgð sem starfsmanni er falin umfram starfslýsingu og metin er honum til launa. Getur t.d. verið ábyrgð á auðlindum, verðmætum, upplýsingagjöf, samskiptum, skipulagi, hreinlæti, öryggi, frágangi, undibúningi eða hverju sem er öðru. Aðlagið skilgreiningu að eigin þörfum og því í hverju ábyrgð felst.',
    numSteps: 5,
    steps: [
      'Starfsmaður ber ekki ábyrgð á xxxx umfram það sem starfið krefst.',
      'Starfsmaður ber einhverja ábyrgð á xxxx umfram það sem starfið krefst.',
      'Starfsmaður ber nokkra ábyrgð á xxxx umfram það sem starfið krefst.',
      'Starfsmaður ber mikla ábyrgð á xxxx umfram það sem starfið krefst.',
      'Starfsmaður ber mjög mikla ábyrgð á xxxx umfram það sem starfið krefst.',
    ],
  },
]
