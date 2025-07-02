import { redirect } from 'next/navigation'

import { PageRoutes } from '../lib/constants'

export default function Frontpage() {
  return redirect(PageRoutes.APPLICATIONS)
}
