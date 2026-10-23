// The title is plain text, typed into a textarea on the case side, so it can
// carry line breaks, non-breaking spaces (\s covers them) and characters that
// mean something in HTML.
const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Puts the advert's title at the top of its body, so the differ compares it
// as one more block. In amendment regulations the title is where adverts
// differ most ("fjórðu breytingu á reglugerð nr. ..."), while the body is
// near-identical boilerplate. Goes on after normalizeForDiff: the title is
// not legacy markup, and an empty one must stay as a block for the two sides
// to pair up.
export const withTitle = (title: string, html: string): string => {
  const text = title.replace(/\s+/g, ' ').trim()
  return `<h2 class="compare-title">${escapeHtml(text)}</h2>${html}`
}
