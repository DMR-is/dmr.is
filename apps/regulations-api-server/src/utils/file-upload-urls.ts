import { RegName, URLString } from '@island.is/regulations-tools/types';
import S3 from 'aws-sdk/clients/s3';
import file_type from 'file-type';
import fetch from 'node-fetch';
import { PassThrough, Readable } from 'stream';

import {
  AWS_BUCKET_NAME,
  AWS_REGION_NAME,
  DRAFTS_FOLDER,
  FILE_SERVER,
  MEDIA_BUCKET_FOLDER,
  OLD_SERVER,
} from '../constants';

const QUERY_REPLACEMENT = '__q__';

// ---------------------------------------------------------------------------

// Stupid cloning for stupid streams
const stupidStreamClone = (stream: Readable) =>
  new Promise<[Readable, Readable]>((resolve, reject) => {
    const b1: Array<Buffer> = [];
    const b2: Array<Buffer> = [];
    stream
      .on('data', (data: Buffer) => {
        b1.push(data);
        b2.push(data);
      })
      .on('end', () => {
        const s1 = Readable.from(b1).pipe(new PassThrough());
        const s2 = Readable.from(b2).pipe(new PassThrough());
        resolve([s1, s2]);
      })
      .on('error', (error) => {
        reject(error);
      });
  });

// ---------------------------------------------------------------------------

const draftsFolderRe = new RegExp('^/' + DRAFTS_FOLDER + '/(?:[^/]+/)?', 'i');

const _makeFileKey = (
  urlStr: string,
  regName: RegName,
  /** Skip logging errors */
  silent?: boolean,
): string | undefined => {
  try {
    const { host, pathname } = new URL(
      // squash queryString into the URL's path
      urlStr.replace(/\?/g, QUERY_REPLACEMENT),
    );
    const isOnFileServer = FILE_SERVER.endsWith('//' + host);
    if (isOnFileServer && !draftsFolderRe.test(pathname)) {
      // file is aleady *published* on the file-server
      return undefined;
    }
    const path = isOnFileServer
      ? pathname.replace(draftsFolderRe, '')
      : host + '/' + pathname;
    const devFolder = MEDIA_BUCKET_FOLDER || '';

    const fileKey = (devFolder + '/files/' + regName + '/' + path)
      // remove double slashes
      .replace(/\/\/+/g, '/')
      // and leading slash
      .replace(/^\//, '');

    return fileKey;
  } catch (error) {
    !silent && console.error({ error });
    return undefined;
  }
};

// ---------------------------------------------------------------------------

type FileUrlMapping = {
  oldUrl: string;
  oldUrlFull: string;
  newUrl: URLString;
  fileKey: string;
};

const dedupeUrls = (urls: Array<FileUrlMapping>) => {
  const newArray: Array<FileUrlMapping> = [];
  const foundArr: Array<string> = [];

  urls.forEach((u) => {
    if (!foundArr.includes(u.oldUrlFull)) {
      foundArr.push(u.oldUrlFull);
      newArray.push(u);
    }
  });
  return newArray;
};

// ---------------------------------------------------------------------------

// FIXME: Add tests!
// Export for testing
export const _fileUrlsMapper = (
  links: ReadonlyArray<string>,
  regName: RegName,
  silent?: boolean,
) => {
  const fileUrls: Array<FileUrlMapping> = [];

  links.forEach((oldUrl) => {
    const oldUrlFull = /^\//.test(oldUrl) ? OLD_SERVER + oldUrl : oldUrl;
    const fileKey = _makeFileKey(oldUrlFull, regName, silent);
    const newUrl = (FILE_SERVER + '/' + fileKey) as URLString;

    if (fileKey && oldUrl !== newUrl) {
      fileUrls.push({
        oldUrl,
        oldUrlFull,
        newUrl,
        fileKey,
      });
    }
  });

  return dedupeUrls(fileUrls);
};

// ---------------------------------------------------------------------------

const uploadFile = async (fileInfo: FileUrlMapping) => {
  const { fileKey, oldUrlFull } = fileInfo;
  const doLog = !!MEDIA_BUCKET_FOLDER || process.env.NODE_ENV !== 'production';

  try {
    const s3 = new S3({ region: AWS_REGION_NAME });
    const res = await fetch(oldUrlFull);
    if (!res.ok) {
      throw new Error(`Error fetching '${oldUrlFull}' (${res.status})`);
    }
    let Body = res.body as Readable;

    let ContentType: string | undefined =
      res.headers.get('content-type') || undefined;

    if (!ContentType) {
      const [fileA, fileB] = await stupidStreamClone(res.body as Readable);
      Body = fileA;
      ContentType = (await file_type.fromStream(fileB))?.mime;
    }

    await s3
      .upload({
        Bucket: AWS_BUCKET_NAME,
        Key: fileKey,
        ACL: 'public-read',
        ContentType,
        Body,
      })
      .promise()
      .then((data) => {
        doLog &&
          console.info('🆗 Uploaded', {
            oldUrl: oldUrlFull,
            key: data.Key,
          });
      });
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    console.error('⚠️ ', message);
  }
};

export const moveUrlsToFileServer = (
  links: ReadonlyArray<string>,
  regName: RegName,
) => {
  const fileInfoList = _fileUrlsMapper(links, regName);

  // fire-and-forget uploading
  fileInfoList.forEach((file) => uploadFile(file));

  return fileInfoList.map(({ oldUrl, newUrl }) => ({
    oldUrl,
    newUrl,
  }));
};
