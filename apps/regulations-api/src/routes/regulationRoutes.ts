import {
  ensureISODate,
  ensureNameSlug,
  slugToName,
} from '@island.is/regulations-tools/utils';
import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { FastifyRedis } from 'fastify-redis';

import { getRegulation } from '../db/Regulation';
import { makeDraftPdf, makePublishedPdf } from '../db/RegulationPdf';
import { get, set } from '../utils/cache';
import { cacheControl, Pms, QStr } from '../utils/misc';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  ISODate,
  RegQueryName,
  Regulation,
  RegulationDiff,
  RegulationRedirect,
} from './types';

const REGULATION_TTL = 0.1;
const PDF_FILE_TTL = 1;
const REGULATION_REDIS_TTL = REGULATION_TTL * 60 * 60;

// ---------------------------------------------------------------------------

type EarlierDate = ISODate | 'original';

type RegHandlerOpts<N extends string = RegQueryName> = {
  name?: RegQueryName | N;
  date?: ISODate | 'current';
  diff?: boolean;
  earlierDate?: EarlierDate;
  onDate?: boolean;
  current?: true;
};
type RefinedRegHandlerOpts<N extends string = RegQueryName> = {
  name: RegQueryName | N;
  current: boolean;
  date?: Date | 'current';
  onDate?: boolean;
} & (
  | {
      diff: true;
      earlierDate?: Date | 'original';
    }
  | {
      diff?: false;
      earlierDate?: undefined;
    }
);

// ===========================================================================

const ensureEarlierDate = (maybeEDate?: string): EarlierDate | undefined =>
  maybeEDate === 'original' ? 'original' : ensureISODate(maybeEDate);

// ---------------------------------------------------------------------------

// eslint-disable-next-line complexity
const handleRequest = async <N extends string = RegQueryName>(
  req: FastifyRequest,
  res: FastifyReply,
  opts: RegHandlerOpts<N>,
  handler: (
    res: FastifyReply,
    opts: RefinedRegHandlerOpts<N>,
    routePath: string,
  ) => Promise<{ success: boolean; error?: string }>,
) => {
  const { name, date, diff, onDate, earlierDate, current = false } = opts;
  const dateMissing = 'date' in opts && !date;
  const validEarlierDate =
    !date ||
    !diff ||
    !earlierDate ||
    earlierDate === 'original' ||
    earlierDate <= date;

  if (name && !dateMissing && validEarlierDate) {
    const earlierDateDate =
      earlierDate === 'original'
        ? 'original'
        : earlierDate && new Date(earlierDate);

    const handlerOpts: RefinedRegHandlerOpts<N> = {
      name,
      date: date === 'current' ? 'current' : date && new Date(date),
      ...(earlierDateDate
        ? { earlierDate: earlierDateDate, diff: true }
        : { diff }),
      current,
      onDate,
    };

    // NOTE: Is there a better/cleaner/more robust way to
    // provide this info?
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const routePath = req.url
      .replace(/^\/api\/v[0-9]+\/regulation\//, '')
      .split('?')[0]! // remove any potential query strings
      .replace(/\/pdf$/, ''); // and chop off pdf suffixes, if present

    const { success, error } = await handler(res, handlerOpts, routePath);

    if (!success) {
      res
        .code(error ? 500 : 404)
        .send({ error: error || 'Regulation not found!' });
    }
  } else {
    res
      .code(400)
      .send(
        !name
          ? 'Invalid Regulation name'
          : dateMissing
          ? 'Invalid historic date'
          : !validEarlierDate
          ? 'Invalid diffing date'
          : undefined,
      );
  }
};

// ===========================================================================

const handleDataRequest = (
  req: FastifyRequest,
  res: FastifyReply,
  redis: FastifyRedis,
  opts: RegHandlerOpts,
) =>
  handleRequest(req, res, opts, async (res, opts, routePath) => {
    const { name, date, onDate, diff, earlierDate } = opts;

    const cacheKey = routePath;

    let result =
      (await get<
        RegulationRedirect | Regulation | RegulationDiff | string | null
      >(redis, cacheKey)) || undefined;

    if (result == null) {
      const { error, regulation } = await getRegulation(
        slugToName(name),
        {
          date,
          diff,
          earlierDate,
          onDate,
        },
        routePath,
      );

      if (error === 'ARGH') {
        return res.status(500).send();
      }
      result = error || regulation;

      if (!result) {
        // Shorter cache TTL for "NOT_FOUND" results
        set(redis, cacheKey, 'NOT_FOUND', 0.2 * REGULATION_REDIS_TTL);
      } else {
        set(redis, cacheKey, result, REGULATION_REDIS_TTL);
      }
    }

    if (!result || result === 'NOT_FOUND') {
      return { success: false };
    }
    if (typeof result === 'string') {
      return { success: false, error: result };
    }
    cacheControl(res, REGULATION_TTL);
    res.send(result);
    return { success: true };
  });

// ===========================================================================

type PdfResponseType = 'binary' | 'base64';

function parsePdfResponseType(input: unknown): PdfResponseType | undefined {
  if (input === 'binary') {
    return 'binary';
  }
  if (input === 'base64') {
    return 'base64';
  }
  return undefined;
}

const handlePdfRequest = (
  req: FastifyRequest,
  res: FastifyReply,
  opts: RegHandlerOpts<'new'>,
  body?: unknown,
  responseType?: PdfResponseType,
) =>
  handleRequest(req, res, opts, async (res, opts, routePath) => {
    const job =
      opts.name !== 'new'
        ? makePublishedPdf(
            routePath,
            // @ts-expect-error  (TS doesn't realize opts.name can't be 'new' at this point)
            opts,
          )
        : body
        ? makeDraftPdf(body)
        : undefined;

    // TODO: return 304 when possible for conditional (If-Modified-Since:) request.

    const { fileName, pdfContents, error } = (await job) || {};

    if (!fileName || !pdfContents) {
      return { success: false, error };
    }

    cacheControl(res, PDF_FILE_TTL);

    if (!opts.current) {
      res.header('X-Robots-Tag', 'noindex');
    }

    if (responseType === 'base64') {
      res.code(200).send({
        fileName,
        mimeType: 'application/pdf',
        data: pdfContents.toString('base64'),
      });
      return { success: true };
    }

    res
      .code(200)
      // .header('Content-Disposition', `attachment; filename="${fileName}.pdf"`);
      .header(
        'Content-Disposition',
        `inline; filename="${encodeURI(fileName)}.pdf"`,
      )
      .type('application/pdf')
      .send(pdfContents);
    return { success: true };
  });

// ===========================================================================

//

// ===========================================================================

export const regulationRoutes: FastifyPluginCallback = (
  fastify,
  opts,
  done,
) => {
  /**
   * Returns original version of a regulation
   * @param {string} name - Name of the Regulation to fetch (`nnnn-yyyyy`)
   * @returns {Regulation | RegulationRedirect}
   */
  fastify.get<Pms<'name'>>('/regulation/:name/original', opts, (req, res) => {
    handleDataRequest(req, res, fastify.redis, {
      name: ensureNameSlug(req.params.name),
    });
  });
  /**
   * Returns original version of a regulation in PDF format
   * @param {string} name - Name of the Regulation to fetch (`nnnn-yyyyy`)
   * @returns pdf file
   */
  fastify.get<Pms<'name'>>(
    '/regulation/:name/original/pdf',
    opts,
    (req, res) => {
      handlePdfRequest(req, res, {
        name: ensureNameSlug(req.params.name),
      });
    },
  );

  /**
   * Returns current version of a regulation with all changes applied
   * @param {string} name - Name of the Regulation to fetch (`nnnn-yyyyy`)
   * @returns {Regulation | RegulationRedirect}
   */
  fastify.get<Pms<'name'>>('/regulation/:name/current', opts, (req, res) => {
    handleDataRequest(req, res, fastify.redis, {
      name: ensureNameSlug(req.params.name),
      date: 'current',
      current: true,
    });
  });
  /**
   * Returns current version of a regulation with all changes applied in PDF format
   * @param {string} name - Name of the Regulation to fetch (`nnnn-yyyyy`)
   * @returns pdf file
   */
  fastify.get<Pms<'name'>>(
    '/regulation/:name/current/pdf',
    opts,
    (req, res) => {
      handlePdfRequest(req, res, {
        name: ensureNameSlug(req.params.name),
        date: 'current',
        current: true,
      });
    },
  );

  /**
   * Returns current version of a regulation with all changes applied, showing
   * the total changes the "original" verion.
   * @param {string} name - Name of the Regulation to fetch (`nnnn-yyyyy`)
   * @returns {RegulationDiff | RegulationRedirect}
   */
  fastify.get<Pms<'name'>>('/regulation/:name/diff', opts, (req, res) => {
    handleDataRequest(req, res, fastify.redis, {
      name: ensureNameSlug(req.params.name),
      date: 'current',
      diff: true,
      earlierDate: 'original',
    });
  });
  /**
   * Returns current version of a regulation with all changes applied, showing
   * the total changes the "original" verion in PDF format
   * @param {string} name - Name of the Regulation to fetch (`nnnn-yyyyy`)
   * @returns pdf file
   */
  fastify.get<Pms<'name'>>('/regulation/:name/diff/pdf', opts, (req, res) => {
    handlePdfRequest(req, res, {
      name: ensureNameSlug(req.params.name),
      date: 'current',
      diff: true,
      earlierDate: 'original',
    });
  });

  /**
   * Returns a version of a regulation as it was on a specific valid timeline date
   * @param {string} name - Name of the Regulation to fetch (`nnnn-yyyyy`)
   * @param {string} date - ISODate (`YYYY-MM-DD`)
   * @returns {Regulation | RegulationRedirect}
   */
  fastify.get<Pms<'name' | 'date'>>(
    '/regulation/:name/d/:date',
    opts,
    (req, res) => {
      handleDataRequest(req, res, fastify.redis, {
        name: ensureNameSlug(req.params.name),
        date: ensureISODate(req.params.date),
      });
    },
  );

  /**
   * Returns a version of a regulation as it will be on any specific date
   * @param {string} name - Name of the Regulation to fetch (`nnnn-yyyyy`)
   * @param {string} date - ISODate (`YYYY-MM-DD`)
   * @returns {Regulation | RegulationRedirect}
   */
  fastify.get<Pms<'name' | 'date'>>(
    '/regulation/:name/on/:date',
    opts,
    (req, res) => {
      handleDataRequest(req, res, fastify.redis, {
        name: ensureNameSlug(req.params.name),
        date: ensureISODate(req.params.date),
        onDate: true,
      });
    },
  );

  /**
   * Returns a version of a regulation as it was on a specific date in PDF format
   * @param {string} name - Name of the Regulation to fetch (`nnnn-yyyyy`)
   * @param {string} date - ISODate (`YYYY-MM-DD`)
   * @returns pdf file
   */
  fastify.get<Pms<'name' | 'date'>>(
    '/regulation/:name/d/:date/pdf',
    opts,
    (req, res) => {
      handlePdfRequest(req, res, {
        name: ensureNameSlug(req.params.name),
        date: ensureISODate(req.params.date),
      });
    },
  );

  /**
   * Returns a version of a regulation as it was on a specific date, showing the changes
   * that occurred on that date
   * @param {string} name - Name of the Regulation to fetch (`nnnn-yyyyy`)
   * @param {string} date - ISODate (`YYYY-MM-DD`)
   * @returns {RegulationDiff | RegulationRedirect}
   */
  fastify.get<Pms<'name' | 'date'>>(
    '/regulation/:name/d/:date/diff',
    opts,
    (req, res) => {
      handleDataRequest(req, res, fastify.redis, {
        name: ensureNameSlug(req.params.name),
        date: ensureISODate(req.params.date),
        diff: true,
      });
    },
  );
  /**
   * Returns a version of a regulation as it was on a specific date, showing the changes
   * that occurred on that date in PDF format
   * @param {string} name - Name of the Regulation to fetch (`nnnn-yyyyy`)
   * @param {string} date - ISODate (`YYYY-MM-DD`)
   * @returns pdf file
   */
  fastify.get<Pms<'name' | 'date'>>(
    '/regulation/:name/d/:date/diff/pdf',
    opts,
    (req, res) => {
      handlePdfRequest(req, res, {
        name: ensureNameSlug(req.params.name),
        date: ensureISODate(req.params.date),
        diff: true,
      });
    },
  );

  /**
   * Returns a version of a regulation as it was on a specific date, showing the changes
   * that occurred on that date
   * @param {string} name - Name of the Regulation to fetch (`nnnn-yyyyy`)
   * @param {string} date - ISODate (`YYYY-MM-DD`)
   * @param {string} earlierDate - ISODate (`YYYY-MM-DD`) or 'original'
   * @returns {RegulationDiff | RegulationRedirect}
   */
  fastify.get<Pms<'name' | 'date' | 'earlierDate'>>(
    '/regulation/:name/d/:date/diff/:earlierDate',
    opts,
    (req, res) => {
      handleDataRequest(req, res, fastify.redis, {
        name: ensureNameSlug(req.params.name),
        date: ensureISODate(req.params.date),
        diff: true,
        earlierDate: ensureEarlierDate(req.params.earlierDate),
      });
    },
  );
  /**
   * Returns a version of a regulation as it was on a specific date, showing the changes
   * that occurred on that date in PDF format
   * @param {string} name - Name of the Regulation to fetch (`nnnn-yyyyy`)
   * @param {string} date - ISODate (`YYYY-MM-DD`)
   * @param {string} earlierDate - ISODate (`YYYY-MM-DD`) or 'original'
   * @returns pdf file
   */
  fastify.get<Pms<'name' | 'date' | 'earlierDate'>>(
    '/regulation/:name/d/:date/diff/:earlierDate/pdf',
    opts,
    (req, res) => {
      handlePdfRequest(req, res, {
        name: ensureNameSlug(req.params.name),
        date: ensureISODate(req.params.date),
        diff: true,
        earlierDate: ensureEarlierDate(req.params.earlierDate),
      });
    },
  );

  // ---------------------------------------------------------------------------

  /**
   * Accepts regulation data
   * Returns the regulation data as a regulation, in PDF format
   * @body {Regulation} Regulation object with optional name
   * @returns pdf file
   */
  fastify.post<QStr<'responseType'>>(
    '/regulation/generate-pdf',
    opts,
    (req, res) => {
      const responseType =
        parsePdfResponseType(req.query.responseType) ?? 'binary';

      handlePdfRequest(req, res, { name: 'new' }, req.body, responseType);
    },
  );

  done();
};
