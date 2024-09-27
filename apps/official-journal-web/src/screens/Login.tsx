import { withMainLayout } from '../layout/Layout'
import { Routes } from '../lib/constants'
import { messages } from '../lib/messages/caseOverview'
import { Screen } from '../lib/types'

const Login: Screen = () => {
  return (
    <div>
      <button>Innskráning</button>
    </div>
  )
}

// Login.getProps = async ({ query }) => {
//   console.log('Login.getProps', query)
// }

export default withMainLayout(Login, {
  bannerProps: {
    showBanner: false,
    showFilters: false,
    imgSrc: '/assets/banner-publish-image.svg',
    title: messages.banner.title,
    description: messages.banner.description,
    variant: 'small',
    contentColumnSpan: ['12/12', '12/12', '5/12'],
    imageColumnSpan: ['12/12', '12/12', '5/12'],
    breadcrumbs: [
      {
        title: messages.breadcrumbs.dashboard,
        href: Routes.Dashboard,
      },
      {
        title: messages.breadcrumbs.casePublishing,
      },
    ],
  },
})
