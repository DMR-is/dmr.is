export const dynamic = 'force-dynamic'

function handler(request: Request) {
  const url = new URL(request.url)
  const idToken = url.searchParams.get('id_token')

  return Response.redirect(
    `https://${process.env.IDENTITY_SERVER_DOMAIN}/connect/endsession?id_token_hint=${idToken}&post_logout_redirect_uri=${process.env.IDENTITY_SERVER_LOGOUT_URL}`,
  )
}

export { handler as GET, handler as POST }
