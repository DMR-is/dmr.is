export function removeSubjectFromHtml(html: string, subject: string): string {
  // Remove the subject from the html
  //what if all spaces are newlines?

  let newHtml = html.replace(subject, '')

  //check if subject has newlines and replace
  //replace newline
  newHtml = newHtml.replace(new RegExp(subject.replace(/ /g, '\n'), 'g'), ' ')
  return newHtml
}
