import { FastifyPluginCallback } from 'fastify'

import { ensureRegName } from '@dmr.is/regulations-tools/utils'

import { DRAFTS_FOLDER, FILE_SERVER } from '../constants'
import { uploadFileFromRequest } from '../utils/file-upload'
import { moveUrlsToFileServer } from '../utils/file-upload-urls'
import {
  ensureFileScopeToken,
  ensureObject,
  ensureStringArray,
  ensureUploadTypeHeader,
  QStr,
} from '../utils/misc'
import { createPresigned } from '../utils/upload'

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------

export const fileUploadRoutes: FastifyPluginCallback = (
  fastify,
  opts,
  done,
) => {
  /**
   * Uploads file into S3 bucket.
   *
   * Accepts a `?scope=2021/0123` query parameter (...or `?scope=[draftUUId]`)
   *
   * Requires a valid `X-APIKey: [secretKey]` HTTP header
   *
   * @returns {{ location: string }}
   */

  fastify.post<QStr>(
    '/file-upload',
    {
      ...opts,
      onRequest: (request, reply, done) => {
        try {
          const uploadType = ensureUploadTypeHeader(request)
          if (!uploadType) {
            throw new Error('Authentication needed')
          }
          const scopeParam = request.query.scope
          if (uploadType === 'publish' && !ensureRegName(scopeParam)) {
            throw new Error('Scope must be of type RegName')
          }
          if (uploadType === 'draft' && !ensureFileScopeToken(scopeParam)) {
            throw new Error('Invalid scope token')
          }
          done()
        } catch (error) {
          reply.code(403)
          done(error as Error)
        }
      },
    },
    async (request, reply) => {
      // Returns the key the object was actually written to — for a pasted
      // image that is the transformed `.jpg`, not the `.png` `getKey()` named.
      const uploaded = await uploadFileFromRequest(request)

      if (!uploaded) {
        reply.code(400).send({ error: 'No file was uploaded' })
        return
      }

      // eslint-disable-next-line no-console
      process.env.MEDIA_BUCKET_FOLDER && console.info(uploaded)

      return reply.send({ location: FILE_SERVER + '/' + uploaded.key })
    },
  )

  /**
   * Uploads files from urls into S3 bucket and returns mappings for new urls.
   *
   * Accepts post body of type `{ urls: Array<string>, regName: RegName }`
   *
   * Requires a valid `X-APIKey: [secretKey]` HTTP header
   *
   * @returns {Array<{ oldUrl: string; newUrl: string; }>}}
   */

  fastify.post(
    '/file-upload-urls',
    {
      ...opts,
      onRequest: (request, reply, done) => {
        try {
          if (ensureUploadTypeHeader(request) !== 'publish') {
            throw new Error('Authentication needed')
          }
          done()
        } catch (error) {
          reply.code(403)
          done(error as Error)
        }
      },
    },
    (request, reply) => {
      const _body = ensureObject(request.body)

      const links = ensureStringArray(_body.urls)
      const regName = ensureRegName(_body.regName)
      const uploadType = ensureUploadTypeHeader(request)

      if (!regName) {
        reply.code(400).send({
          error: 'Invalid/missing scope token',
        })
        return
      }
      if (!uploadType) {
        // Should never happen. Should be cought in `onRequest` above
        reply.code(500)
        return
      }

      const urlMap = moveUrlsToFileServer(links, regName)

      reply.send(urlMap)
    },
  )

  //* TO satisfy CORS preflights
  fastify.options(
    '/file-presigned',
    {
      ...opts,
      onRequest: (request, reply, done) => {
        done()
      },
    },

    async (request, reply) => {
      return reply.send()
    },
  )

  /**
   * Creates a PresignedPost object, containing an url and all neccesary headers to
   * post directly to an S3 Bucket
   *
   * Accepts post body of type `{ fileName: string,  hash: string (hash value of the file to be posted) }`
   * Also needs a query string of type ?scope=[draftUUID]
   *
   * Requires a valid `X-APIKey: [secretKey]` HTTP header
   *
   * @returns {S3PresignedPost}
   */

  fastify.post<QStr>(
    '/file-presigned',
    {
      ...opts,
      onRequest: (request, reply, done) => {
        try {
          const uploadType = ensureUploadTypeHeader(request)
          if (!uploadType) {
            throw new Error('Authentication needed')
          }
          const scopeParam = request.query.scope
          if (uploadType === 'draft' && !ensureFileScopeToken(scopeParam)) {
            throw new Error('Invalid scope token')
          }
          done()
        } catch (error) {
          reply.code(403)
          done(error as Error)
        }
      },
    },
    async (request, reply) => {
      const _body = ensureObject(request.body)
      const _uploadType = ensureUploadTypeHeader(request)
      const _folder = ensureFileScopeToken(request.query.scope)
      const rootFolder = _uploadType !== 'publish' ? DRAFTS_FOLDER : ''

      const presigned = await createPresigned(
        _body.fileName as string,
        rootFolder,
        _folder,
        _body.hash as string,
      )

      if (presigned) {
        return reply.send(presigned)
      }

      return reply.status(500).send()
    },
  )

  done()
}
