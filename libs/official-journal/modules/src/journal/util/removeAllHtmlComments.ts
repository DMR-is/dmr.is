export function removeAllHtmlComments(html: string): string {
  // Regular expression to match HTML comments
  const commentRegex = /<!--[\s\S]*?-->/g

  // Replace all HTML comments with an empty string
  return html.replace(commentRegex, '')
}
