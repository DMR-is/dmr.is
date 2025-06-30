import type { NextApiRequest, NextApiResponse } from 'next'

function handler(req: NextApiRequest, res: NextApiResponse) {
  res.redirect(
    `https://${process.env.IDENTITY_SERVER_DOMAIN}/connect/endsession?id_token_hint=${req.query.id_token}&post_logout_redirect_uri=${process.env.IDENTITY_SERVER_LOGOUT_URL}`,
  )
}

export { handler as GET, handler as POST }
