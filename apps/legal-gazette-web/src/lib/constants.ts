export const PageRoutes = [
  {
    path: '/',
    pathName: 'Stjórnborð',
    showInNavigation: true,
    children: [
      {
        path: '/ritstjorn',
        pathName: 'Ritstjórn',
        showInNavigation: true,
        children: [
          {
            path: '/ritstjorn/[id]',
            pathName: 'Ritstjórn',
            showInNavigation: false,
          },
        ],
      },
      {
        path: '/utgafa',
        pathName: 'Útgáfa',
        showInNavigation: true,
        children: [],
      },
      {
        path: '/heildaryfirlit',
        pathName: 'Heildaryfirlit',
        showInNavigation: true,
        children: [],
      },
    ],
  },
]
