import { FastifyPluginCallback } from 'fastify';

import { ensureRegName } from '@island.is/regulations-tools/utils';

import { DRAFTS_FOLDER, FILE_SERVER } from '../constants';
import { fileUploader, MulterS3StorageFile } from '../utils/file-upload';
import { moveUrlsToFileServer } from '../utils/file-upload-urls';
import {
  ensureFileScopeToken,
  ensureObject,
  ensureStringArray,
  ensureUploadTypeHeader,
  QStr,
} from '../utils/misc';
import { createPresigned } from '../utils/upload';

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
          const uploadType = ensureUploadTypeHeader(request);
          if (!uploadType) {
            throw new Error('Authentication needed');
          }
          const scopeParam = request.query.scope;
          if (uploadType === 'publish' && !ensureRegName(scopeParam)) {
            throw new Error('Scope must be of type RegName');
          }
          if (uploadType === 'draft' && !ensureFileScopeToken(scopeParam)) {
            throw new Error('Invalid scope token');
          }
          done();
        } catch (error) {
          reply.code(403);
          done(error as Error);
        }
      },
      preHandler: fileUploader,
    },
    (request, reply) => {
      const fileObj = (
        request as unknown as { file: MulterS3StorageFile | undefined }
      ).file;

      // NOTE: Not sure if this is needed. May be handled inside `fileUploader` – Már @2021-11-03
      if (!fileObj) {
        reply.code(400).send({ error: 'No file was uploaded' });
        return;
      }

      // eslint-disable-next-line no-console
      process.env.MEDIA_BUCKET_FOLDER && console.info(fileObj);

      const uploadInfo =
        // @ts-expect-error  (multer-s3-transform has no .d.ts files)
        (fileObj.transforms as Array<MulterS3StorageFile> | undefined)?.[0] ||
        fileObj;

      reply.send({ location: FILE_SERVER + '/' + uploadInfo.key });
    },
  );

  /**
   * Deletes a file from an S3 bucket
   *
   * Accepts an exact uri!
   *
   * Requires a valid `X-APIKey: [secretKey]` HTTP header
   *
   *  @returns {{ status: Boolean}}
   */

  /*fastify.delete(
    '/file-upload',
    {
      ...opts,
      onRequest: (request, reply, done) => {
        try {
          const uploadType = ensureUploadTypeHeader(request);
          if (uploadType !== 'draft') {
            throw new Error('Authentication needed');
          }
        } catch (error) {
          reply.code(403);
          done(error as Error);
        }
      },
    },
    async (request, reply) => {
      const _body = ensureObject(request.body);
      const _key = 'key' in _body ? _body.key : undefined;

      console.log(_body)
      console

      if (!_key) {
        reply.code(400).send({ error: 'Object not found. Nothing to delete' });
        return;
      }

      const client = new S3Client({ region: AWS_REGION_NAME });
      console.log(_key);
      /*const data = await client.send(
        new DeleteObjectCommand({
          Bucket: AWS_BUCKET_NAME,
          Key: _key as string,
        }),
      );

      //console.log(data.DeleteMarker);

      //reply.send({ status: data.DeleteMarker });
      reply.send({ status: false });
    },
  );*/

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
            throw new Error('Authentication needed');
          }
          done();
        } catch (error) {
          reply.code(403);
          done(error as Error);
        }
      },
    },
    (request, reply) => {
      const _body = ensureObject(request.body);

      const links = ensureStringArray(_body.urls);
      const regName = ensureRegName(_body.regName);
      const uploadType = ensureUploadTypeHeader(request);

      if (!regName) {
        reply.code(400).send({
          error: 'Invalid/missing scope token',
        });
        return;
      }
      if (!uploadType) {
        // Should never happen. Should be cought in `onRequest` above
        reply.code(500);
        return;
      }

      const urlMap = moveUrlsToFileServer(links, regName);

      reply.send(urlMap);
    },
  );

  //* TO satisfy CORS preflights
  fastify.options(
    '/file-presigned',
    {
      ...opts,
      onRequest: (request, reply, done) => {
        done();
      },
    },

    async (request, reply) => {
      return reply.send();
    },
  );

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
          const uploadType = ensureUploadTypeHeader(request);
          if (!uploadType) {
            throw new Error('Authentication needed');
          }
          const scopeParam = request.query.scope;
          if (uploadType === 'draft' && !ensureFileScopeToken(scopeParam)) {
            throw new Error('Invalid scope token');
          }
          done();
        } catch (error) {
          reply.code(403);
          done(error as Error);
        }
      },
    },
    async (request, reply) => {
      const _body = ensureObject(request.body);
      const _uploadType = ensureUploadTypeHeader(request);
      const _folder = ensureFileScopeToken(request.query.scope);
      const rootFolder = _uploadType !== 'publish' ? DRAFTS_FOLDER : '';

      const presigned = await createPresigned(
        _body.fileName as string,
        rootFolder,
        _folder,
        _body.hash as string,
      );

      if (presigned) {
        return reply.send(presigned);
      }

      return reply.status(500).send();
    },
  );

  done();
};
