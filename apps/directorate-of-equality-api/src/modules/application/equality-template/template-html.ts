/**
 * HTML version of the equality-report template content.
 *
 * Kept in sync by hand with the prose inside `template.docx`. If the docx
 * is updated, update the paragraphs below to match — they are served by the
 * `reports/equality/template` endpoint and read by users in the browser as
 * a starting point before downloading the docx.
 */

const PARAGRAPHS = [
  'Fyrirtækið okkar er 45 manna vinnustaður þar sem við leggjum áherslu á fagmennsku, gagnsæi og sanngjarnt vinnuumhverfi fyrir alla starfsmenn. Í kjölfar yfirferðar á stöðu okkar, innri ferlum og skipulagi höfum við sett fram jafnréttisáætlun sem byggir á raunverulegri greiningu og skýrum markmiðum.',
  'Áætlunin tekur til allra helstu þátta jafnréttislaga nr. 150/2020 og felur í sér markmið og tímasettar aðgerðir sem tryggja launajafnrétti, jafnan aðgang að lausum störfum, starfsþjálfun og símenntun, ásamt því að styðja betur við samræmingu fjölskyldu- og atvinnulífs. Þá felur áætlunin einnig í sér forvarnir og viðbragðsferla gegn kynbundnu ofbeldi, áreitni og mismunun.',
]

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildEqualityReportTemplateHtml(): string {
  const body = PARAGRAPHS.map((p) => `    <p>${escapeHtml(p)}</p>`).join('\n')

  return `<!DOCTYPE html>
<html lang="is">
  <head>
    <meta charset="utf-8" />
    <title>Jafnréttisáætlun – sniðmát</title>
  </head>
  <body>
${body}
  </body>
</html>
`
}
