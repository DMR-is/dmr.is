import { Op } from 'sequelize';

import { DB_Ministry, DB_Regulation } from '../models';
import { Ministry, MinistrySlug } from '../routes/types';

export async function getAllMinistries(slugs?: Array<MinistrySlug>) {
  const ministries = await DB_Ministry.findAll({
    where: slugs
      ? {
          slug: { [Op.in]: slugs },
        }
      : undefined,
    order: [
      ['`order`', 'ASC'],
      ['name', 'ASC'],
      ['slug', 'DESC'],
    ],
  });

  return ministries.map((m) => m.get());
}

export const getMinistry = (id: DB_Regulation['ministryId']) =>
  id
    ? (DB_Ministry.findOne({ where: { id } }) as Promise<DB_Ministry>).then(
        ({ slug, name }): Ministry => ({ slug, name }),
      )
    : Promise.resolve(undefined);
