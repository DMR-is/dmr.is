/* eslint-disable no-console */
import S3 from 'aws-sdk/clients/s3'
import { exec } from 'child_process'
import fs from 'fs'
import { mkdir, readFile, rm, unlink, writeFile } from 'fs/promises'
import fetch from 'node-fetch'
import os from 'os'
import path from 'path'

import { cleanTitle } from '@dmr.is/regulations-tools/cleanTitle'
import { cleanupAllEditorOutputs } from '@dmr.is/regulations-tools/cleanupEditorOutput'
import {
  ensureISODate,
  ensureRegName,
  isNonNull,
  nameToSlug,
  prettyName,
  slugToName,
  toISODate,
  toISODateTime,
} from '@dmr.is/regulations-tools/utils'

import {
  AWS_BUCKET_NAME,
  AWS_REGION_NAME,
  MEDIA_BUCKET_FOLDER,
  PDF_TEMPLATE_UPDATED,
} from '../constants'
import {
  Appendix,
  HTMLText,
  ISODateTime,
  PlainText,
  RegName,
  RegQueryName,
  Regulation,
  RegulationDiff,
  RegulationMaybeDiff,
  RegulationRedirect,
} from '../routes/types'
import { formatDate as fmt } from '../utils/misc'
import { fetchModifiedDate, getRegulation } from './Regulation'

import arrayToObject from '@hugsmidjan/qj/arrayToObject'
import { SECOND } from '@hugsmidjan/qj/time'

export type InputRegulation = Pick<
  Regulation,
  'title' | 'text' | 'appendixes' | 'comments'
> & {
  name?: Regulation['name']
  showingDiff?: undefined
  lastAmendDate?: undefined
  timelineDate?: undefined
  repealedDate?: undefined
  repealed?: undefined
  ministry?: string
  publishedDate?: Regulation['publishedDate']
  // signatureDate?: Regulation['signatureDate'];
  // effectiveDate?: Regulation['effectiveDate'];
  history?: undefined
  pdfVersion?: undefined
}

// ---------------------------------------------------------------------------

const sanitizeTextContent = (text: PlainText): HTMLText =>
  text.replace(/&/, '&amp;').replace(/</g, '&lt;') as HTMLText

const fylgiskjalClass = (txt: string) => {
  const hasFylgiskjal = /^Fylgiskjal(\s|$)/i.test(txt)
  let fylgiskjalClass = ''

  if (hasFylgiskjal) {
    fylgiskjalClass = ' fylgiskjal__title'
  }
  return fylgiskjalClass
}

// ---------------------------------------------------------------------------

const getStatusText = (regulation: RegulationMaybeDiff): string => {
  const {
    timelineDate,
    lastAmendDate,
    publishedDate,
    history,
    showingDiff,
    repealed,
    repealedDate,
  } = regulation
  const today = toISODate(new Date())
  const printoutDateStr =
    ' <small class="printoutdate">(Dags. skjals ' + fmt(today) + ')</small>'

  if (showingDiff) {
    const { from: dateFrom, to: dateTo } = showingDiff

    const affectingRegulations = Object.values(
      arrayToObject(
        history.filter(
          ({ effect, date }) =>
            effect === 'amend' && dateFrom <= date && date <= dateTo,
        ),
        'name',
      ),
    )
    const affectingNames = affectingRegulations
      .map((affectingReg, i, arr) => {
        const separator = i === 0 ? '' : i < arr.length - 1 ? ', ' : ' og '
        return separator + prettyName(affectingReg.name)
      })
      .join('')

    const isFuture = today < dateTo

    return (
      'Sýnir breytingar ' +
      (isFuture ? 'væntanlegar' : 'gerðar') +
      (affectingRegulations.length === 1
        ? ` þann ${fmt(dateTo)}`
        : ` á tímabilinu ${fmt(dateFrom)} til ${fmt(dateTo)}`) +
      `\n<small class="affecting">af rg.nr. ${affectingNames}</small>` +
      ' ' +
      printoutDateStr +
      (isFuture ? ' ' + printoutDateStr : '')
    )
  }

  if (!timelineDate || timelineDate === (lastAmendDate || publishedDate)) {
    // Nýjasta gildandi útgáfa
    const fmtLastModified = fmt(lastAmendDate || publishedDate)

    if (repealed) {
      return (
        `Útgáfa sem gilti frá ${fmtLastModified} fram að ` +
        (repealedDate ? ` brottfellingu ${fmt(repealedDate)}` : 'ógildingu')
      )
    }
    return `Útgáfa í gildi frá ${fmtLastModified}` + printoutDateStr
  }

  // non-current version
  const nextTimelineDate = (() => {
    const idx = [{ date: publishedDate }]
      .concat(history)
      .findIndex((item) => item.date === timelineDate)
    const nextItem = idx > -1 && history[idx]
    return nextItem ? nextItem.date : undefined
  })()
  const fmtDateFrom = fmt(timelineDate)
  const fmtDateTo = fmt(nextTimelineDate || today)

  // framtíðar útgáfur
  if (today < timelineDate) {
    if (nextTimelineDate) {
      return (
        `Væntanleg útgáfa sem á að gilda frá ${fmtDateFrom} til ${fmtDateTo}` +
        printoutDateStr
      )
    }
    return (
      `Væntanleg útgáfa sem á að taka gildi ${fmtDateFrom}` + printoutDateStr
    )
  }

  // NOTE: við gerum engan sérstakan greinarmun á upprunalegri
  // útgáfu og öðrum eldri útgáfum
  return `Útgáfa sem gilti á tímabilinu ${fmtDateFrom} til ${fmtDateTo}`
}

console.log('Current working directory:', process.cwd())
// ---------------------------------------------------------------------------
const cssPath = path.join(__dirname, 'RegulationPdf.css')
const CSS = fs.readFileSync(cssPath, 'utf8')

const pdfTmplate = (
  regulation: RegulationMaybeDiff | InputRegulation,
  draft?: boolean,
) => {
  const {
    name,
    text,
    appendixes,
    comments = '',
    publishedDate,
    pdfVersion,
  } = regulation

  const title = regulation.showingDiff
    ? regulation.title
    : sanitizeTextContent(regulation.title)
  const nameStr = name && prettyName(name)

  let statusText: string | undefined

  if (!draft) {
    if (!regulation.history) {
      statusText = publishedDate && `${fmt(publishedDate)}`
    } else {
      statusText = getStatusText(regulation)
    }
  }

  const footerStr = pdfVersion
    ? `<a class="pdfurl" href="${pdfVersion}">${pdfVersion}</a>`
    : ''

  const ministrySignature = `${
    regulation.ministry
      ? `<section class="signature"><p>${regulation.ministry},<pre>                          </pre></p></section>`
      : ''
  }`

  const titleSub = title.replace(/^Reglugerð /, '')

  return `
<html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>${CSS}</style>
  </head>
  <body>
    <div class="regulation__meta">
      ${
        name
          ? `<div class="regulation__name">Nr. <strong>${nameStr}</strong></div>`
          : ''
      }
      ${statusText ? `<div class="regulation__status">${statusText}</div>` : ''}
      ${footerStr ? `<div class="regulation__footer">${footerStr}</div>` : ''}
      </div>
    <div class="regulation__prefix">REGLUGERÐ</div>
    <h1 class="regulation__title">${titleSub}</h1>

    <div class="regulation__text">
      ${text}
      ${draft ? ministrySignature : ''}
    </div>

    ${appendixes.length ? '<div class="appendixes">' : ''}
    ${appendixes
      .map(
        ({ title, text: aptext }) => `
    <section class="appendix">
      <h2 class="appendix__title${fylgiskjalClass(title)}">${
        regulation.showingDiff ? title : sanitizeTextContent(title as PlainText)
      }</h2>
      <div class="appendix__text">
        ${aptext}
      </div>
    </section>
    `,
      )
      .join('')}

    ${appendixes.length ? '</div>' : ''}

    ${
      comments &&
      `
    <section class="comments">
      <h2 class="comments__title">Athugasemdir ritstjóra</h2>
      ${comments}
    </section>
    `
    }

    ${
      draft
        ? ''
        : `<section class="disclaimer">
      <h2 class="disclaimer__title">Fyrirvari</h2>
      <div class="disclaimer__text">
        <p>Reglugerðir eru birtar í B-deild Stjórnartíðinda skv. 3. gr. laga um Stjórnartíðindi og Lögbirtingablað, nr. 15/2005, sbr. reglugerð um útgáfu Stjórnartíðinda nr. 958/2005.</p>
        <p>Sé misræmi milli þess texta sem birtist hér í safninu og þess sem birtur er í útgáfu B-deildar Stjórnartíðinda skal sá síðarnefndi ráða.</p>
      </div>
    </section>`
    }

  </body>
</html>`
}

// ===========================================================================

let guid = 1
const guid_prefix = 'temp_' + Date.now() + '_'

// All transient PDF artifacts (HTML input, PDF output, and the per-render
// Chromium user-data dir) live under a single dedicated directory so they can
// be reliably cleaned up — both per render and via a startup sweep.
const PDF_TMP_DIR = path.join(os.tmpdir(), 'regulations-pdf')

try {
  fs.mkdirSync(PDF_TMP_DIR, { recursive: true })
} catch (err) {
  console.error('Unable to create PDF temp dir', err)
}

/**
 * Removes any leftover PDF temp artifacts (e.g. Chromium profile dirs orphaned
 * by timed-out/OOM-killed renders, or temp files from a previous process that
 * crashed). Safe to call on startup; recreates an empty temp dir afterwards.
 */
export const cleanupPdfTempDir = async () => {
  try {
    await rm(PDF_TMP_DIR, { recursive: true, force: true })
    await mkdir(PDF_TMP_DIR, { recursive: true })
  } catch (err) {
    console.error('Unable to clean PDF temp dir', err)
  }
}

const makeRegulationPdf = (
  regulation?:
    | InputRegulation
    | Regulation
    | RegulationDiff
    | RegulationRedirect,
  draft?: boolean,
): Promise<Buffer | false> => {
  if (!regulation || 'redirectUrl' in regulation) {
    return Promise.resolve(false)
  }

  const tmpFileName = guid_prefix + guid++

  const outFile = path.join(PDF_TMP_DIR, tmpFileName)
  const htmlFile = outFile + '.html'
  // Give Chromium a user-data dir we own, so we can delete it ourselves.
  // Puppeteer only auto-cleans a profile dir it created itself, so on a
  // timed-out or OOM-killed render the default dir leaks. Owning it lets us
  // guarantee cleanup below.
  const userDataDir = outFile + '-chrome'

  // Ignore cleanup errors — the file/dir may not have been created.
  const tryUnlink = (file: string) =>
    unlink(file).catch(() => {
      /* best-effort cleanup. */
    })
  const tryRmDir = (dir: string) =>
    rm(dir, { recursive: true, force: true }).catch(() => {
      /* best-effort cleanup. */
    })

  return writeFile(htmlFile, pdfTmplate(regulation, draft))
    .then(
      () =>
        new Promise<Buffer>((resolve, reject) => {
          exec(
            // Increasing context to 5 lines (effectively: words) seems reasonable
            // since each line is so short (contains so little actual context)
            `pagedjs-cli ${htmlFile}` +
              `  --browserArgs --no-sandbox,--font-render-hinting=none,--user-data-dir=${userDataDir}` +
              `  --timeout ${90 * SECOND}` +
              `  --output ${outFile}`,
            (err) => {
              // Always clean up the HTML input and the Chromium profile dir,
              // regardless of success/failure.
              tryUnlink(htmlFile)
              tryRmDir(userDataDir)
              if (err) {
                // pagedjs-cli may have written a partial/complete output file
                // before failing; clean it up so it doesn't leak to disk.
                tryUnlink(outFile)
                reject(err)
              } else {
                resolve(
                  readFile(outFile).then((file) => {
                    tryUnlink(outFile)
                    return file
                  }),
                )
              }
            },
          )
        }),
    )
    .catch((err: unknown) => {
      console.error('Unable to create PDF', err)
      return false
    })
}

// ---------------------------------------------------------------------------

const cleanUpRegulationBodyInput = (
  reqBody: unknown,
): InputRegulation | undefined => {
  if (typeof reqBody !== 'object' || reqBody == null) {
    return
  }
  const body = reqBody as Record<string, unknown>

  const name = ensureRegName(String(body.name))
  const publishedDate = ensureISODate(String(body.publishedDate))
  // const signatureDate = ensureISODate(String(body.signatureDate));
  // const effectiveDate = ensureISODate(String(body.effectiveDate));

  const dirtyTitle = String(body.title)
  const ministry = String(body.ministry ?? '')
  const dirtyText = String(body.text) as HTMLText
  const dirtyCommments = String(body.comments || '') as HTMLText
  const dirtyAppendixes = (
    Array.isArray(body.appendixes) ? body.appendixes : []
  )
    .map((wat: unknown): Appendix | undefined => {
      if (typeof wat !== 'object' || wat == null) {
        return
      }
      const appendix = wat as Record<string, unknown>
      return {
        title: cleanTitle(String(appendix.title)),
        text: String(appendix.text) as HTMLText,
      }
    })
    .filter(isNonNull)

  const title = cleanTitle(dirtyTitle)
  const { text, appendixes, comments } = cleanupAllEditorOutputs({
    text: dirtyText,
    appendixes: dirtyAppendixes,
    comments: dirtyCommments,
  }) as Pick<Regulation, 'text' | 'appendixes' | 'comments'>

  if (title && text) {
    return {
      title,
      text,
      appendixes,
      comments,
      name,
      publishedDate,
      ministry,
      // signatureDate,
      // effectiveDate,
    }
  }
}

// ---------------------------------------------------------------------------

const fetchPdf = (fileKey: string) =>
  fetch(
    `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION_NAME}.amazonaws.com/${fileKey}`,
  )
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Error fetching '${res.url}' (${res.status})`)
      }
      return res.buffer().then((contents) => ({
        contents: contents,
        modifiedDate:
          toISODateTime(res.headers.get('Last-Modified')) || ('' as const),
      }))
    })
    .catch(() => ({ contents: false, modifiedDate: '' }) as const)

const s3 = new S3({ region: AWS_REGION_NAME })
const doLog = !!MEDIA_BUCKET_FOLDER

const uploadPdf = (fileKey: string, pdfContents: Buffer) =>
  s3
    .upload({
      Bucket: AWS_BUCKET_NAME,
      Key: fileKey,
      ContentType: 'application/pdf',
      Body: pdfContents,
    })
    .promise()
    .then((data) => {
      doLog && console.info('🆗 Uploaded', data.Key)
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : error
      console.info('⚠️ ', message)
    })

type RegOpts = {
  name: RegQueryName
  date?: Date | 'current'
  diff?: boolean
  earlierDate?: Date | 'original'
}

const getPrettyPdfFilename = (
  opts: RegOpts,
  name: RegName,
  lastModified: ISODateTime,
) => {
  const { date, diff, earlierDate } = opts

  const nameTxt = nameToSlug(name)
  const dateTxt = toISODate(date ? date : lastModified)
  const diffTxt = diff ? ' breytingar' : ''
  const earlierDateTxt = !earlierDate
    ? ''
    : earlierDate === 'original'
      ? ' frá upphafi'
      : ` síðan ${toISODate(earlierDate)}`

  return `Reglugerð ${nameTxt} (${dateTxt + diffTxt + earlierDateTxt})`
}

const _keyPrefix = MEDIA_BUCKET_FOLDER ? MEDIA_BUCKET_FOLDER + '/' : ''

const getPdfFileKey = (routePath: string) =>
  `${_keyPrefix}pdf/${routePath.replace(/\//g, '--')}.pdf`

function getDraftPdfFilename(draftRegulation: InputRegulation): string {
  const parts = [
    'Reglugerð í vinnslu ',
    toISODate(new Date()),
    draftRegulation.name ? ` - ${draftRegulation.name}` : null,
    '.pdf',
  ].filter((n?: string | null): n is string => Boolean(n))

  return parts.join('')
}

// ===========================================================================

type PDFGenResults = {
  fileName?: string
  pdfContents?: Buffer | false
  error?: string
}

export const makeDraftPdf = async (body: unknown): Promise<PDFGenResults> => {
  const unpublishedReg = cleanUpRegulationBodyInput(body)
  if (unpublishedReg) {
    const fileName = getDraftPdfFilename(unpublishedReg)
    const pdfContents = await makeRegulationPdf(unpublishedReg, true)
    return { fileName, pdfContents }
  }
  return {}
}

// ===========================================================================

const _makePublishedPdf = async (
  routePath: string,
  opts: RegOpts,
): Promise<PDFGenResults> => {
  const { date, name, diff, earlierDate } = opts

  const regName = slugToName(name)
  const fileKey = getPdfFileKey(routePath)

  try {
    const [pdf, regModified] = await Promise.all([
      fetchPdf(fileKey),
      fetchModifiedDate(regName, date),
    ])

    const regulationExists = !!regModified

    if (regulationExists) {
      let pdfContents = pdf.contents

      // NOTE: regModified is really an ISODate with a faux timestamp appended,
      // because regulations/regulationchanges don't have a modified timestamp.
      // This may cause some weird behavior sometimes.

      const doGeneratePdf =
        !pdfContents ||
        pdf.modifiedDate < regModified ||
        pdf.modifiedDate < PDF_TEMPLATE_UPDATED

      if (doGeneratePdf) {
        const { regulation, error } = await getRegulation(
          regName,
          { date, diff, earlierDate },
          routePath,
        )

        if (error != null) {
          return { error }
        }

        pdfContents = await makeRegulationPdf(regulation)
        pdfContents && uploadPdf(fileKey, pdfContents)
      }
      const fileName = getPrettyPdfFilename(opts, regName, regModified)
      return { fileName, pdfContents }
    }
  } catch (error) {
    console.info(error)
  }

  return {}
}

// ---------------------------------------------------------------------------

const pdfJobs: Record<
  string,
  ReturnType<typeof _makePublishedPdf> | undefined
> = {}

export const makePublishedPdf = (routePath: string, opts: RegOpts) => {
  let job = pdfJobs[routePath]

  if (!job) {
    job = _makePublishedPdf(routePath, opts)
    pdfJobs[routePath] = job
    job.then(() => {
      delete pdfJobs[routePath]
    })
  }
  return job
}
