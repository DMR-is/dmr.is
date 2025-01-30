import { Op, QueryTypes } from 'sequelize';

import { DB_LawChapter } from '../models';
import { LawChapter, LawChapterSlug, LawChapterTree } from '../routes/types';
import { db } from '../utils/sequelize';

export async function getLawChapterTree(): Promise<LawChapterTree> {
  const chapters = await DB_LawChapter.findAll({ order: [['slug', 'ASC']] });

  const parents: {
    [key: string]: LawChapter & {
      subChapters: Array<LawChapter>;
    };
  } = {};

  chapters.forEach((chapter) => {
    const { parentId, title, slug } = chapter;
    const parentChapter = parentId && parents[parentId];
    if (parentChapter) {
      parentChapter.subChapters.push({
        name: title,
        slug,
      });
    } else {
      parents[chapter.id] = {
        name: title,
        slug,
        subChapters: [],
      };
    }
  });

  return Object.values(parents);
}

export async function getLawChapterList(
  slugs?: Array<LawChapterSlug>,
): Promise<Array<LawChapter>> {
  const rawLawChapters = await DB_LawChapter.findAll({
    where: slugs
      ? {
          slug: { [Op.in]: slugs },
        }
      : undefined,
    order: [['slug', 'ASC']],
  });

  let lastParent = '';
  return rawLawChapters.map(({ title, slug, parentId }): LawChapter => {
    if (!parentId) {
      lastParent = title;
    }

    return {
      name: !parentId ? title : lastParent + ' - ' + title,
      slug,
    };
  });
}

export async function getRegulationLawChapters(
  regulationId: number,
): Promise<Array<LawChapter>> {
  const rawLawChapters = await db.query<
    Pick<DB_LawChapter, 'title' | 'slug'> & {
      parentTitle: DB_LawChapter['title'];
    }
  >(
    `
        SELECT l.title, l.slug, pl.title AS parentTitle FROM LawChapter AS l
        RIGHT JOIN Regulation_LawChapter AS rl ON l.id = rl.chapterId
        LEFT JOIN LawChapter AS pl ON l.parentId = pl.id
        WHERE rl.regulationId = :regulationId
        ORDER BY l.slug, l.id
      `,
    {
      replacements: { regulationId },
      type: QueryTypes.SELECT,
    },
  );

  return rawLawChapters.map(
    ({ title, slug, parentTitle }): LawChapter => ({
      name: parentTitle ? parentTitle + ' — ' + title : title,
      slug,
    }),
  );
}
