import { useMemo } from 'react'

import { sanitizeForDisplay } from '@dmr.is/utils-server/cleanLegacyHtml'

import { classes } from './Editor.css'

type Props = {
  html?: string | null
}

/**
 * Stored HTML shown the way `HTMLEditor` shows it, without loading an editor.
 *
 * An editor reads its input through its own schema, so a read-only editor can
 * render something other than what was stored, and warns that saving would
 * change it on a page where nothing can be saved. This renders the stored HTML
 * itself, sanitised for display: the HTML can come from outside (a company's
 * report), and here it shares the page with the app.
 */
export const HTMLReadOnly = ({ html }: Props) => {
  const sanitized = useMemo(() => sanitizeForDisplay(html ?? ''), [html])

  return (
    <div className={classes.wrapper}>
      <div className={classes.editingpane}>
        <div
          className={classes.editor}
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      </div>
    </div>
  )
}
