/* eslint-disable no-console */
import _formatDate from 'date-fns/format'
import locale from 'date-fns/locale/is'
import { FastifyReply, FastifyRequest } from 'fastify'
import fs from 'fs'
import { parse } from 'path'

import { DB_RegulationChange } from '../models'
import { ISODate } from '../routes/types'

import { HOUR } from '@hugsmidjan/qj/time'

// ---------------------------------------------------------------------------

export const formatDate = (date: ISODate, format = 'd. MMM yyyy'): string =>
  _formatDate(new Date(date), format, { locale })

// ---------------------------------------------------------------------------

/** Generates URL Params type declaration for Fastify's .get() method */
export type Pms<keys extends string> = {
  Params: { [x in keys]: string }
}
/** Generates Querystring type declaration for Fastify's .get() method */
export type QStr<keys extends string = string> = {
  Querystring: { [x in keys]?: string }
}

// ---------------------------------------------------------------------------

const HOURS = 60 * 60
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cacheControl = (res: FastifyReply<any>, ttl_hrs: number): void => {
  res.headers({
    'Cache-Control':
      'public, max-age=' + ttl_hrs * HOURS + (ttl_hrs ? ', immutable' : ''),
  })
}

// ---------------------------------------------------------------------------

export const ensureObject = (cand: unknown): Record<string, unknown> => {
  if (cand && typeof cand === 'object' && !Array.isArray(cand)) {
    return cand as Record<string, unknown>
  }
  return {}
}
export const ensureStringArray = (cand: unknown): Array<string> => {
  if (Array.isArray(cand)) {
    return cand.filter(
      (item): item is string => !!item && typeof item === 'string',
    )
  }
  return []
}

// ---------------------------------------------------------------------------

declare const _FileScopeToken__Brand: unique symbol
/** String that's safe to use as a folder/file name */
export type FileScopeToken = string & { [_FileScopeToken__Brand]: true }

export const ensureFileScopeToken = (
  cand: unknown,
): FileScopeToken | undefined => {
  if (
    typeof cand === 'string' &&
    cand.length > 1 &&
    /^[a-z0-9-](?:\.*[a-z0-9-]+)*$/i.test(cand)
  ) {
    return cand as FileScopeToken
  }
}

// ---------------------------------------------------------------------------

const EMPTY_KEY = '_'
const {
  FILE_UPLOAD_KEY_DRAFT = EMPTY_KEY,
  FILE_UPLOAD_KEY_PUBLISH = EMPTY_KEY,
  FILE_UPLOAD_KEY_PRESIGNED = EMPTY_KEY,
} = process.env

export type UploadType = 'draft' | 'publish' | 'presigned'

const apiKeyUsers: Record<string, UploadType | undefined> = {
  [FILE_UPLOAD_KEY_DRAFT]: 'draft',
  [FILE_UPLOAD_KEY_PUBLISH]: 'publish',
  [FILE_UPLOAD_KEY_PRESIGNED]: 'presigned',
}
delete apiKeyUsers[EMPTY_KEY] // Missing env keys must not open a security hole.

/** Asserts that FastifyRequest.headers contain an allowed X-APIKey header value
 * and returns the relevant UploadType string
 *
 * Throws if valid API key is not provided
 */
export const ensureUploadTypeHeader = (
  req: Pick<FastifyRequest, 'headers'>,
): UploadType | undefined => {
  const apiKeyHeader = req.headers['X-APIKey'] || req.headers['x-apikey']
  // const pres = FILE_UPLOAD_KEY_PRESIGNED;
  const uploadType = apiKeyUsers[String(apiKeyHeader)]
  // console.log({ apiKeyHeader, pres, uploadType });
  return uploadType
}

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------

const JSONFILE_MAXAGE = 6 * HOUR

/* write json data to disk */
export const storeData = (data: unknown, path: string) => {
  console.info('storing data to', path)
  try {
    // Use /tmp for writable storage in containers
    const safePath = `/tmp/${path}`
    console.info('trying to store data to', safePath)
    const dirName = parse(safePath).dir
    if (!fs.existsSync(dirName)) {
      console.info('creating dir', dirName)
      fs.mkdirSync(dirName, { recursive: true })
    }
    console.info('writing file', safePath)
    fs.writeFileSync(safePath, JSON.stringify(data))
    console.info('wrote file', safePath)
  } catch (err) {
    console.info('Failed to store data to', path)
    console.error(err)
  }
}

export const loadData = <T>(path: string): T | false => {
  const safePath = `/tmp/${path}`
  if (!fs.existsSync(safePath)) {
    return false
  }
  try {
    const lastModified = fs.statSync(safePath).mtimeMs

    // return file if it's available and fresh
    if (Date.now() - lastModified <= JSONFILE_MAXAGE) {
      const data = fs.readFileSync(safePath, 'utf8')
      return JSON.parse(data)
    }
  } catch (err) {
    console.error(err)
  }
  return false
}

// ---------------------------------------------------------------------------

export const removeHistoryAfterRegId = (
  changeHistory: Array<DB_RegulationChange>,
  /** id of the currently "active" affecting regulation */
  regId: number,
) => {
  let found = false
  return changeHistory
    .filter(({ changingid }) => {
      const relatedToCurrent = changingid === regId
      if (relatedToCurrent) {
        found = true
      }
      return !found || relatedToCurrent
    })
    .reverse()
}
