import { isUUID } from 'class-validator'
import { Op } from 'sequelize'
import { AdvertTypeQuery } from './dto/advert-type.query'

type AdvertTypeWhereParams = {
  id?: {
    [Op.eq]: string
  }
  title?: {
    [Op.iLike]: string
  }
  slug?: {
    [Op.iLike]: string
  }
}

type AdvertTypeDepartmentParams = {
  id?: {
    [Op.eq]: string
  }
  [Op.or]?: [
    {
      title: {
        [Op.iLike]: string
      }
    },
    {
      slug: {
        [Op.iLike]: string
      }
    },
  ]
}

export const getAdvertTypeWhereParams = (
  query?: AdvertTypeQuery,
): AdvertTypeWhereParams => {
  const whereParams: AdvertTypeWhereParams = {}
  if (query?.id) {
    Object.assign(whereParams, {
      id: {
        [Op.eq]: query.id,
      },
    })
  }

  if (query?.unassigned) {
    Object.assign(whereParams, {
      mainTypeId: {
        [Op.is]: null,
      },
    })
  }

  if (query?.mainType) {
    Object.assign(whereParams, {
      mainTypeId: {
        [Op.eq]: query.mainType,
      },
    })
  }

  if (query?.search) {
    Object.assign(whereParams, {
      title: {
        [Op.iLike]: `%${query.search}%`,
      },
    })
  }

  if (query?.slug) {
    Object.assign(whereParams, {
      slug: {
        [Op.like]: `%${query.slug}%`,
      },
    })
  }

  return whereParams
}

export const getAdvertTypeDepartmentWhereParams = (
  query?: AdvertTypeQuery['department'],
): AdvertTypeDepartmentParams => {
  const whereParams: AdvertTypeDepartmentParams = {}

  if (query) {
    if (isUUID(query)) {
      Object.assign(whereParams, {
        id: {
          [Op.eq]: query,
        },
      })
    } else {
      Object.assign(whereParams, {
        [Op.or]: [
          {
            title: {
              [Op.iLike]: `%${query}%`,
            },
          },
          {
            slug: {
              [Op.iLike]: `%${query}%`,
            },
          },
        ],
      })
    }
  }

  return whereParams
}
