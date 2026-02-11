import type { NextApiRequest, NextApiResponse } from 'next/types'
import { getToken } from 'next-auth/jwt'

import { UserRoleEnum } from '@dmr.is/constants'
import { getLogger } from '@dmr.is/logging'
import { isResponse } from '@dmr.is/utils/client/clientUtils'

import { getDmrClient } from '../../../../lib/api/createClient'

const logger = getLogger('GetCasePdfPreview')

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).end()
  }

  const token = await getToken({ req })

  if (!token?.idToken) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const hasRole =
    token?.role?.title === UserRoleEnum.Admin ||
    token?.role?.title === UserRoleEnum.Editor

  if (!hasRole) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const { id } = req.query as { id?: string }

  if (!id) {
    return res.status(400).end()
  }

  const client = getDmrClient(token.idToken as string)

  try {
    const pdfBlob = await client.getCasePdfPreview({
      id: id,
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="preview-${id}.pdf"`)

    return res.send(Buffer.from(await pdfBlob.arrayBuffer()))
  } catch (e) {
    logger.warn(`Failed to fetch attachment`, {
      error: e,
      caseId: id,
    })

    if (isResponse(e)) {
      const json = await e.json()

      logger.warn(`Failed to fetch attachment`, {
        message: json.message,
      })

      return void res.status(json.statusCode).json({ message: json.message })
    }

    return void res.status(500).end()
  }
}

export default handler
