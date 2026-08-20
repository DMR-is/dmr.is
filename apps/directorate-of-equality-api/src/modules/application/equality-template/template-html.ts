/**
 * HTML version of the equality-report template content.
 *
 * Kept in sync by hand with the prose inside `template.docx`. If the docx
 * is updated, update the sections below to match — they are served by the
 * `reports/equality/template` endpoint and read by users in the browser as
 * a starting point before downloading the docx.
 *
 * The docx keeps each section's goals as separate paragraphs inside a single
 * `Markmið` cell; here they get one table row each, since the three remaining
 * columns are filled in per goal.
 */

const TABLE_HEADERS = ['Markmið', 'Aðgerð', 'Ábyrgð', 'Verklok/tímarammi']

interface Passage {
  /** Sub-heading rendered above the passage. */
  heading?: string
  /** Verbatim quote from jafnréttislög nr. 150/2020, rendered as a blockquote. */
  quote?: string
  /** Plain guidance prose. */
  text?: string
}

interface Section {
  title: string
  passages: Passage[]
  goals: string[]
}

const SECTIONS: Section[] = [
  {
    title: 'Almenn ákvæði um launajafnrétti',
    passages: [
      {
        quote:
          'Konum, körlum og fólki með hlutlausa skráningu kyns í þjóðskrá skulu greidd jöfn laun og njóta sömu kjara fyrir sömu eða jafnverðmæt störf. Með jöfnum launum er átt við að laun skulu ákveðin á sama hátt fyrir fólk af ólíkum kynjum. Skulu þau viðmið sem lögð eru til grundvallar launaákvörðun ekki fela í sér kynjamismunun. Starfsfólki skal ávallt heimilt að skýra frá launakjörum sínum ef þau kjósa svo.',
      },
      {
        heading:
          'Skýrslugjöf um kynbundinn launamun (á við um fyrirtæki og stofnanir með fleiri en 50 starfsmenn á ársgrundvelli)',
        quote:
          'Fyrirtæki eða stofnun þar sem 50 eða fleiri starfa að jafnaði á ársgrundvelli skal á þriggja ára fresti skila gögnum til Jafnréttisstofu sem sýna fram á að launakerfi þess tryggi jöfn laun fyrir sömu eða jafnverðmæt störf og að launaákvarðanir séu teknar út frá kynhlutlausum viðmiðum sem fyrirbyggja beina og óbeina mismunun á grundvelli kyns.',
      },
    ],
    goals: [
      'Starfsfólk skal hafa jöfn laun og njóta sömu kjara fyrir sömu eða jafn verðmæt störf.',
      'Skýrslugjöf um kynbundinn launamun sýni að launamunur sé undir útgefnu viðmiði.',
    ],
  },
  {
    title: 'Laus störf, starfsþjálfun, endurmenntun og símenntun',
    passages: [
      {
        quote:
          'Starf sem laust er til umsóknar skal standa opið jafnt konum, körlum og fólki með hlutlausa skráningu kyns í þjóðskrá. Atvinnurekendur skulu gera nauðsynlegar ráðstafanir til að tryggja að konur, karlar og fólk með hlutlausa skráningu kyns í þjóðskrá njóti sömu möguleika til endurmenntunar, símenntunar og starfsþjálfunar og til að sækja námskeið sem haldin eru til að auka hæfni í starfi eða til undirbúnings fyrir önnur störf.',
      },
    ],
    goals: [
      'Laus störf standi opin öllum óháð kyni.',
      'Jafna kynjahlutfallið í starfmannahópnum.',
      'Starfsþjálfun, endurmenntun og símenntun sé aðgengileg öllu starfsfólki, óháð kynjum.',
    ],
  },
  {
    title: 'Samræming fjölskyldu- og atvinnulífs',
    passages: [
      {
        quote:
          'Atvinnurekendur skulu gera nauðsynlegar ráðstafanir til að gera starfsfólki kleift að samræma starfsskyldur sínar og ábyrgð gagnvart fjölskyldu, óháð kyni. Ráðstafanir þær skulu meðal annars miða að því að auka sveigjanleika í skipulagningu á vinnu og vinnutíma þannig að bæði sé tekið tillit til fjölskylduaðstæðna starfsfólks og þarfa atvinnulífs, þar með talið að starfsfólki sé auðveldað að koma aftur til starfa eftir fæðingar- og foreldraorlof eða leyfi úr vinnu vegna brýnna fjölskylduaðstæðna.',
      },
    ],
    goals: [
      'Vera fjölskylduvænn vinnustaður.',
      'Koma á kerfi sveigjanlegs og fyrirsjáanlegs vinnutíma.',
      'Báðir foreldrar nýti sér þann rétt sem þau eiga varðandi foreldra- og fæðingarorlof og leyfi vegna veikindi barna.',
    ],
  },
  {
    title: 'Kynbundið ofbeldi, kynbundin áreitni og kynferðisleg áreitni',
    passages: [
      {
        quote:
          'Atvinnurekendur og yfirmenn stofnana og félagasamtaka skulu gera sérstakar ráðstafanir til að koma í veg fyrir að starfsfólk, nemar og skjólstæðingar verði fyrir kynbundnu ofbeldi, kynbundinni áreitni eða kynferðislegri áreitni á vinnustað, stofnun, í félagsstarfi eða skólum. Ef yfirmaður er kærður vegna ætlaðs kynbundins ofbeldis, ætlaðrar kynbundinnar áreitni eða ætlaðrar kynferðislegrar áreitni verður hann vanhæfur til að taka ákvarðanir í tengslum við starfsskilyrði kæranda á meðan meðferð málsins stendur yfir og skal þá næsti yfirmaður taka slíkar ákvarðanir.',
      },
    ],
    goals: [
      'Kynbundið ofbeldi, kynbundin áreitni og kynferðisleg áreitni sé ekki liðin á vinnustaðnum.',
      'Starfsfólk þekki birtingarmyndir og afleiðingar kynbundins ofbeldis og kynbundinnar og kynferðislegrar áreitni.',
      'Forvarnar- og viðbragðsáætlun sem tekur á kynbundnu ofbeldi, kynbundinni áreitni og kynferðislegri áreitni sé til fyrir vinnustaðinn.',
    ],
  },
  {
    title: 'Eftirfylgni og endurskoðun',
    passages: [
      {
        text:
          'Mikilvægt er að verkefnum jafnréttisáætlunarinnar sé fylgt eftir. Gott er að fara yfir stöðu allra verkefnanna a.m.k. árlega með framkvæmdastjóra, framkvæmdaraðilum og helstu stjórnendum. Einnig er gagnlegt að kynna reglulega fyrir starfsfólki hvað hefur tekist vel og hvað má betur fara. Áætlunin verður þá lifandi plagg sem líklegra er að skili árangri. Jafnréttisáætlun og jafnréttissjónarmið í starfsmannastefnu skal endurskoða á þriggja ára fresti.',
      },
    ],
    goals: [
      'Jafnréttisáætlunin skili tilætluðum árangri.',
      'Jafnréttisáætlunin sé í sífelldri þróun eins og önnur stefnumótun.',
      'Endurskoðun og uppfærsla sé tryggð.',
      'Áætlunin sé kynnt öllu starfsfólki',
    ],
  },
]

const STYLES = `
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #00003c;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }

    h1 {
      font-size: 24px;
    }

    h2 {
      font-size: 18px;
      margin-top: 32px;
    }

    h3 {
      font-size: 15px;
      margin-bottom: 4px;
    }

    blockquote {
      margin: 8px 0 16px 0;
      padding: 8px 16px;
      border-left: 3px solid #0061ff;
      background: #f2f7ff;
    }

    .field {
      margin: 4px 0;
    }

    .field__label {
      font-weight: 600;
    }

    .fill-in {
      color: #8a8aa0;
    }

    .intro-box {
      border: 1px solid #ccdfff;
      border-radius: 4px;
      min-height: 120px;
      padding: 12px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }

    th,
    td {
      border: 1px solid #ccdfff;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: #f2f7ff;
    }

    td:not(:first-child) {
      min-width: 120px;
    }
`

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderPassage(passage: Passage): string {
  const parts: string[] = []

  if (passage.heading) {
    parts.push(`    <h3>${escapeHtml(passage.heading)}</h3>`)
  }

  if (passage.quote) {
    parts.push(`    <blockquote>„${escapeHtml(passage.quote)}“</blockquote>`)
  }

  if (passage.text) {
    parts.push(`    <p>${escapeHtml(passage.text)}</p>`)
  }

  return parts.join('\n')
}

function renderGoalTable(goals: string[]): string {
  const head = TABLE_HEADERS.map((h) => `<th>${escapeHtml(h)}</th>`).join('')
  const rows = goals
    .map(
      (goal) =>
        `        <tr><td>${escapeHtml(
          goal,
        )}</td><td></td><td></td><td></td></tr>`,
    )
    .join('\n')

  return `    <table>
      <thead>
        <tr>${head}</tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>`
}

function renderSection(section: Section): string {
  return [
    `    <h2>${escapeHtml(section.title)}</h2>`,
    ...section.passages.map(renderPassage),
    renderGoalTable(section.goals),
  ].join('\n')
}

export function buildEqualityReportTemplateHtml(): string {
  const sections = SECTIONS.map(renderSection).join('\n\n')

  return `<!DOCTYPE html>
<html lang="is">
  <head>
    <meta charset="utf-8" />
    <title>Jafnréttisáætlun – sniðmát</title>
    <style>${STYLES}    </style>
  </head>
  <body>
    <h1>Jafnréttisáætlun</h1>

    <p class="field">
      <span class="field__label">Heiti fyrirtækis/stofnunar:</span>
      <span class="fill-in">__________</span>
    </p>
    <p class="field">
      <span class="field__label">Gildistími:</span>
      Frá (mán/ár) <span class="fill-in">__________</span>
      til (mán/ár) <span class="fill-in">__________</span>
    </p>

    <h2>Inngangur (markmið og stefna í jafnréttismálum)</h2>
    <div class="intro-box"></div>

${sections}
  </body>
</html>
`
}
