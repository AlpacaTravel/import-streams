import compose, {
  StreamDefinition,
  ComposableStreamDefinition,
  CombineStreamDefinition,
  SupportedStream,
  StreamFactory,
  StreamFactoryOptions,
  ComposableDefinition,
} from "@alpaca-travel/import-streams-compose";
import assert from "assert";
import { Transform } from "readable-stream";
import parse from "csv-parse";
import stringify from "csv-stringify";
import YAML from "yaml";
import fs from "fs";
import zlib from "zlib";
import crypto from "crypto";
import unzipper from "unzipper";

import { isTransformFunction, isTransformSupportingContext } from "./types";
import transforms from "./transform/index";
import { createReadStream as createJsonApiObjectReadStream } from "./read/json-api-object";
import { createTransformStream as createMapSelectorTransformStream } from "./transform/map-selector";
import { createWriteStream as createAlpacaSyncExternalItemsWriteStream } from "./write/alpaca-sync-external-items";
import { createReadStream as createJourneyReadStream } from "./read/alpaca-journey";
import { createReadStream as createSqliteStatementObjectStream } from "./read/sqlite-statement-object";
import { createWriteStream as createSqliteStatementStream } from "./write/sqlite-statement";
import {
  createReadStream as createFetchObjectStream,
  Headers,
} from "./read/fetch-object";
import { createReadStream as createAwsS3GetObjectStream } from "./read/aws-s3-get-object-stream";
import { createReadStream as createAwsS3GetObject } from "./read/aws-s3-get-object";
import { createReadStream as createAwsS3ListObjectsStream } from "./read/aws-s3-list-objects";
import { createReadStream as createObjectReadStream } from "./read/object";

import createFetchStream from "./read/fetch-stream";

export {
  // Read Streams
  createJsonApiObjectReadStream,
  createFetchObjectStream,
  createFetchStream,
  createAwsS3GetObject,
  createAwsS3GetObjectStream,
  createAwsS3ListObjectsStream,
  createJourneyReadStream,
  createSqliteStatementObjectStream,
  // Transform Streams
  transforms,
  createMapSelectorTransformStream,
  // Write Streams
  createAlpacaSyncExternalItemsWriteStream,
  createSqliteStatementStream,
};

type Callback = (error?: Error) => undefined;

interface StreamDefinitionDocument extends StreamDefinition {
  version: string | number;
}
interface ComposableStreamDefinitionDocument
  extends ComposableStreamDefinition {
  version: string | number;
}

interface CombineStreamDefinitionDocument extends CombineStreamDefinition {
  version: string | number;
}

type Document =
  | StreamDefinitionDocument
  | ComposableStreamDefinitionDocument
  | CombineStreamDefinitionDocument
  | string;
interface Options {
  factory?: StreamFactory;
}

export interface JsonApiDataOptions extends StreamFactoryOptions {
  url: string;
  limit?: number;
  debug?: boolean;
  wait?: number;
  retry?: boolean | number;
}

export interface FetchObjectOptions extends StreamFactoryOptions {
  url: string;
  limit?: number;
  offset?: number;
  retry?: number;
  wait?: number;
  pagesize?: number;
  pagesizeQueryParam?: string;
  pathTotalRecords: string;
  path: string;
  headers?: Headers;
  method?: string;
  debug?: boolean;
}

export interface FetchPaginatedObjectsOptions extends FetchObjectOptions {
  pagesize?: number;
  pagesizeQueryParam?: string;
  pathTotalRecords: string;
}

interface FetchObjectOffsetBaseOptions extends FetchPaginatedObjectsOptions {
  offsetQueryParam: string;
}

interface FetchObjectPageBasedOptions extends FetchPaginatedObjectsOptions {
  pageQueryParam: string;
  usePageStartingAtOne?: boolean;
}

export interface FetchStreamOptions extends StreamFactoryOptions {
  url: string;
  headers?: Headers;
  method?: string;
}

export interface JourneyOptions extends StreamFactoryOptions {
  id: string | string[];
  limit?: number;
}

export interface SqliteStatementOptions extends StreamFactoryOptions {
  database: string;
  sql: string;
  debug?: boolean;
}

export interface CsvStringifyOptions extends StreamFactoryOptions {
  bom?: boolean;
  columns?: string[];
  delimiter?: string;
  header?: boolean;
}

export interface CipherOptions extends StreamFactoryOptions {
  algorithm: string;
  password: string;
}

export interface AwsS3GetObjectStreamOptions extends StreamFactoryOptions {
  bucket: string;
  key: string;
  region?: string;
}

export interface AwsS3GetObjectOptions extends StreamFactoryOptions {
  bucket: string;
  key: string;
  region?: string;
  limit?: number;
  path?: string;
  iterate?: boolean;
  encoding?:
    | "utf-8"
    | "ascii"
    | "utf8"
    | "utf16le"
    | "ucs2"
    | "ucs-2"
    | "base64"
    | "latin1"
    | "binary"
    | "hex";
  parseJson?: boolean;
  debug?: boolean;
}

export interface AwsS3ListObjectsStreamOptions extends StreamFactoryOptions {
  bucket: string;
  prefix?: string;
  region?: string;
  limit?: number;
  debug?: boolean;
}

export interface UnzipOneOptions extends StreamFactoryOptions {
  regex?: string;
  regexFlags?: string;
}

export interface ReadObjectOptions extends StreamFactoryOptions {
  iterate?: boolean;
  value: any;
}

const isReadObjectOptions = (
  options?: StreamFactoryOptions
): options is ReadObjectOptions => {
  if (!options) {
    return false;
  }
  if ("value" in options) {
    return true;
  }
  return false;
};

const isUnzipOneOptions = (
  options?: StreamFactoryOptions
): options is UnzipOneOptions => {
  if (!options) {
    return false;
  }
  if ("regex" in options) {
    return true;
  }
  return false;
};

const isAwsS3ListObjectsStreamOptions = (
  options?: StreamFactoryOptions
): options is AwsS3ListObjectsStreamOptions => {
  if (!options) {
    return false;
  }
  if ("bucket" in options) {
    return true;
  }
  return false;
};

const isAwsS3GetObjectOptions = (
  options?: StreamFactoryOptions
): options is AwsS3GetObjectOptions => {
  if (!options) {
    return false;
  }
  if ("bucket" in options) {
    return true;
  }
  return false;
};

const isAwsS3GetObjectStreamOptions = (
  options?: StreamFactoryOptions
): options is AwsS3GetObjectStreamOptions => {
  if (!options) {
    return false;
  }
  if ("bucket" in options) {
    return true;
  }
  return false;
};

const isCipherOptions = (
  options?: StreamFactoryOptions
): options is CipherOptions => {
  if (!options) {
    return false;
  }
  if ("algorithm" in options) {
    return true;
  }
  return false;
};

const isJsonApiObjectOptions = (
  options?: StreamFactoryOptions
): options is JsonApiDataOptions => {
  if (!options) {
    return false;
  }
  if ("url" in options) {
    return true;
  }
  return false;
};

const isCsvStringifyOptions = (
  options?: StreamFactoryOptions
): options is CsvStringifyOptions => {
  if (!options) {
    return true;
  }
  if ("bom" in options || "columns" in options || "delimiter" in options) {
    return true;
  }
  if (typeof options === "object" && Object.keys(options).length === 0) {
    return true;
  }
  return false;
};

const isFetchObjectOffsetBaseOptions = (
  options?: StreamFactoryOptions
): options is FetchObjectOffsetBaseOptions => {
  if (!options) {
    return false;
  }
  if ("offsetQueryParam" in options) {
    return true;
  }
  return false;
};

const isFetchObjectPageBasedOptions = (
  options?: StreamFactoryOptions
): options is FetchObjectPageBasedOptions => {
  if (!options) {
    return false;
  }
  if ("pageQueryParam" in options) {
    return true;
  }
  return false;
};

const isFetchObjectOptions = (
  options?: StreamFactoryOptions
): options is FetchObjectOptions => {
  if (!options) {
    return false;
  }
  if ("url" in options) {
    return true;
  }
  return false;
};

const isFetchStreamOptions = (
  options?: StreamFactoryOptions
): options is FetchStreamOptions => {
  if (!options) {
    return false;
  }
  if ("url" in options) {
    return true;
  }
  return false;
};
const isJourneyOptions = (
  options?: StreamFactoryOptions
): options is JourneyOptions => {
  if (!options) {
    return false;
  }
  if ("id" in options) {
    return true;
  }
  return false;
};

const isSqliteStatementOptions = (
  options?: StreamFactoryOptions
): options is SqliteStatementOptions => {
  if (!options) {
    return false;
  }
  if ("database" in options) {
    return true;
  }
  return false;
};

interface FsStreamOptions extends StreamFactoryOptions {
  path: string;
  flags?: string;
  encoding?:
    | "utf8"
    | "ascii"
    | "utf-8"
    | "utf16le"
    | "ucs2"
    | "ucs-2"
    | "base64"
    | "latin1"
    | "binary"
    | "hex";
}

const isFsStreamOptions = (
  options?: StreamFactoryOptions
): options is FsStreamOptions => {
  if (!options) {
    return false;
  }
  if ("path" in options) {
    return true;
  }
  return false;
};

interface AlpacaSyncExternalItemsOptions extends StreamFactoryOptions {
  apiKey: string;
  collection: string;
  profile: string;
  force?: boolean;
  debug?: boolean;
  dryRun?: boolean;
  externalSource?: string;
}

const isAlpacaSyncExternalItemsOptions = (
  options?: StreamFactoryOptions
): options is AlpacaSyncExternalItemsOptions => {
  if (!options) {
    return false;
  }
  if ("collection" in options && "apiKey" in options && "profile" in options) {
    return true;
  }
  return false;
};

export const createCompose = (options?: Options) => {
  const factory: StreamFactory = (
    stream: StreamDefinition
  ): SupportedStream => {
    // Check if our calling library has the ability to create the stream
    if (options && options.factory) {
      const resultingStream = options.factory(stream);
      if (resultingStream) {
        return resultingStream;
      }
    }

    // Attempt to create the factory ourselves
    switch (stream.type) {
      case "object": {
        if (isReadObjectOptions(stream.options)) {
          return createObjectReadStream({
            iterate: stream.options.iterate,
            value: stream.options.value,
          });
        }
        throw new Error("Missing the value configuration for ogject");
      }

      case "file-read-stream": {
        if (isFsStreamOptions(stream.options)) {
          return fs.createReadStream(stream.options.path, {
            encoding: stream.options.encoding || "utf8",
            flags: stream.options.flags,
          });
        }
        throw new Error(
          "Missing the configuration for file-read-stream options"
        );
      }

      case "file-write-stream": {
        if (isFsStreamOptions(stream.options)) {
          return fs.createWriteStream(stream.options.path, {
            encoding: stream.options.encoding || "utf8",
            flags: stream.options.flags,
          });
        }
        throw new Error(
          "Missing the configuration for file-write-stream options"
        );
      }

      case "json-api-object": {
        if (isJsonApiObjectOptions(stream.options)) {
          assert(
            stream.options.url,
            "Missing the URL for the JsonApiData stream"
          );

          // Create the read stream
          return createJsonApiObjectReadStream(stream.options.url, {
            limit: stream.options.limit,
            debug: stream.options.debug,
            retry: stream.options.retry,
            wait: stream.options.wait,
          });
        }
        throw new Error(
          "Missing the configuration for json-api-data options, should have: url"
        );
      }

      case "sqlite-statement-object": {
        if (isSqliteStatementOptions(stream.options)) {
          assert(
            stream.options.database,
            "Missing the database path for the sqlite-statement-read stream"
          );
          assert(
            stream.options.sql,
            "Missing the database sql for the sqlite-statement-read stream"
          );

          return createSqliteStatementObjectStream({
            database: stream.options.database,
            sql: stream.options.sql,
            debug: stream.options.debug || false,
          });
        }
        throw new Error(
          "Missing the configuration for sqlite-statement-read options"
        );
      }

      case "sqlite-statement": {
        if (isSqliteStatementOptions(stream.options)) {
          assert(
            stream.options.database,
            "Missing the database path for the sqlite-statement-write stream"
          );
          assert(
            stream.options.sql,
            "Missing the database sql for the sqlite-statement-write stream"
          );

          return createSqliteStatementStream({
            database: stream.options.database,
            sql: stream.options.sql,
            debug: stream.options.debug,
          });
        }
        throw new Error(
          "Missing the configuration for sqlite-statement-write options"
        );
      }

      case "fetch-object": {
        if (isFetchObjectOffsetBaseOptions(stream.options)) {
          assert(stream.options.url, "Missing the URL for the stream");

          // Create the read stream
          return createFetchObjectStream(stream.options.url, {
            limit: stream.options.limit,
            method: stream.options.method,
            path: stream.options.path,
            headers: stream.options.headers,
            retry: stream.options.retry,
            wait: stream.options.wait,
            debug: stream.options.debug,
            pathTotalRecords: stream.options.pathTotalRecords,
            offsetQueryParam: stream.options.offsetQueryParam,
            pagesizeQueryParam: stream.options.pagesizeQueryParam,
            pagesize: stream.options.pagesize,
          });
        }
        if (isFetchObjectPageBasedOptions(stream.options)) {
          assert(stream.options.url, "Missing the URL for the stream");

          // Create the read stream
          return createFetchObjectStream(stream.options.url, {
            limit: stream.options.limit,
            method: stream.options.method,
            path: stream.options.path,
            headers: stream.options.headers,
            retry: stream.options.retry,
            wait: stream.options.wait,
            debug: stream.options.debug,
            pathTotalRecords: stream.options.pathTotalRecords,
            pageQueryParam: stream.options.pageQueryParam,
            usePageStartingAtOne: stream.options.usePageStartingAtOne,
            pagesize: stream.options.pagesize,
            pagesizeQueryParam: stream.options.pagesizeQueryParam,
          });
        }
        if (isFetchObjectOptions(stream.options)) {
          assert(stream.options.url, "Missing the URL for the stream");

          // Create the read stream
          return createFetchObjectStream(stream.options.url, {
            limit: stream.options.limit,
            method: stream.options.method,
            path: stream.options.path,
            headers: stream.options.headers,
            retry: stream.options.retry,
            wait: stream.options.wait,
            debug: stream.options.debug,
          });
        }
        throw new Error("Missing the configuration for fetch-object options");
      }

      case "fetch-stream": {
        if (isFetchStreamOptions(stream.options)) {
          assert(stream.options.url, "Missing the URL for the stream");

          return createFetchStream(stream.options.url, {
            method: stream.options.method,
            headers: stream.options.headers,
          });
        }
        throw new Error("Missing the configuration for fetch-stream options");
      }

      case "journey": {
        if (isJourneyOptions(stream.options)) {
          assert(stream.options.id, "Missing the ID for the journey stream");

          // Create the read stream
          return createJourneyReadStream(stream.options.id, {
            limit: stream.options.limit,
          });
        }
        throw new Error("Missing the configuration for journey options");
      }

      case "aws-s3-get-object-stream": {
        if (isAwsS3GetObjectStreamOptions(stream.options)) {
          assert(stream.options.bucket, "Requires the bucket");
          assert(stream.options.key, "Requires the Key");
          return createAwsS3GetObjectStream(
            stream.options.bucket,
            stream.options.key,
            {
              region: stream.options?.region,
            }
          );
        }
        throw new Error(
          "Missing the configuration for aws-s3-get-object-stream options"
        );
      }

      case "aws-s3-get-object": {
        if (isAwsS3GetObjectOptions(stream.options)) {
          assert(stream.options.bucket, "Requires the bucket");
          assert(stream.options.key, "Requires the Key");
          return createAwsS3GetObject(
            stream.options.bucket,
            stream.options.key,
            {
              region: stream.options?.region,
              limit: stream.options?.limit,
              debug: stream.options?.debug,
              path: stream.options?.path,
              encoding: stream.options?.encoding,
              parseJson: stream.options?.parseJson,
              iterate: stream.options?.iterate,
            }
          );
        }
        throw new Error(
          "Missing the configuration for aws-s3-get-object options"
        );
      }

      case "aws-s3-list-objects": {
        if (isAwsS3ListObjectsStreamOptions(stream.options)) {
          assert(stream.options.bucket, "Requires a bucket");

          return createAwsS3ListObjectsStream(stream.options.bucket, {
            prefix: stream.options?.prefix,
            region: stream.options?.region,
            debug: stream.options?.debug,
            limit: stream.options?.limit,
          });
        }
        throw new Error(
          "Missing the configuration for aws-s3-list-objects options"
        );
      }

      case "gzip": {
        return zlib.createGzip();
      }

      case "gunzip": {
        return zlib.createGunzip();
      }

      case "crypto-encrypt": {
        if (isCipherOptions(stream.options)) {
          assert(stream.options.algorithm, "Requires algorithm");
          assert(stream.options.password, "Requires password");
          const password = new Buffer(stream.options.password);
          return crypto.createCipher(stream.options.algorithm, password);
        }
        throw new Error("Missing the configuration for crypto-encrypt options");
      }

      case "crypto-decrypt": {
        if (isCipherOptions(stream.options)) {
          assert(stream.options.algorithm, "Requires algorithm");
          assert(stream.options.password, "Requires password");
          const password = new Buffer(stream.options.password);
          return crypto.createDecipher(stream.options.algorithm, password);
        }
        throw new Error("Missing the configuration for crypto-decrypt options");
      }

      case "alpaca-sync-external-items": {
        if (isAlpacaSyncExternalItemsOptions(stream.options)) {
          assert(
            stream.options.collection,
            "Missing the collection in options"
          );
          assert(stream.options.apiKey, "Missing the apiKey in options");
          assert(stream.options.profile, "Missing the profile in options");

          // Create the collection write stream
          return createAlpacaSyncExternalItemsWriteStream({
            collection: stream.options.collection,
            apiKey: stream.options.apiKey,
            profile: stream.options.profile,
            force: stream.options.force,
            debug: stream.options.debug,
            dryRun: stream.options.dryRun,
            externalSource: stream.options.externalSource,
          });
        }

        throw new Error(
          "Missing the configuration in SyncExternalItems options, should have: apiKey, collection and profile"
        );
      }

      case "csv-parse": {
        return parse(stream.options);
      }

      case "csv-stringify": {
        if (isCsvStringifyOptions(stream.options)) {
          return stringify({
            header: stream.options?.header,
            bom: stream.options?.bom,
            delimiter: stream.options?.delimiter || ",",
            columns: stream.options?.columns,
          });
        }
        throw new Error("Missing the configuration for csv-stringify options");
      }

      case "unzip-one": {
        if (isUnzipOneOptions(stream.options)) {
          if (stream.options?.regex) {
            const reg = new RegExp(
              stream.options.regex,
              stream.options.regexFlags
            );
            return unzipper.ParseOne(reg);
          }
        }
        return unzipper.ParseOne();
      }

      case "process.stdout": {
        return process.stdout;
      }

      default:
        // Check if we have defined the stream type as a transform
        if (stream.type in transforms) {
          const transform = transforms[stream.type];

          // Interleave a context into the object
          const interleavedContext = {
            context: {
              compose: composeWithOptions,
            },
            debug: false,
          };

          // Options
          const transformOptions = Object.assign(
            {},
            interleavedContext,
            stream.options
          );

          if (isTransformSupportingContext(transform)) {
            return new transform(transformOptions);
          } else {
            // A Class that returns a Transform, supporting the options through constructor
            if (isTransformFunction(transform)) {
              // Create a transform wrapper
              return new Transform({
                objectMode: true,

                transform(value: any, _, callback: Callback) {
                  (async () => {
                    try {
                      // Transform the value

                      const transformedValue = await transform(
                        value,
                        transformOptions
                      );
                      this.push(transformedValue);

                      // Return the value
                      callback();
                    } catch (e) {
                      if (transformOptions.debug === true) {
                        console.error(e);
                      }
                      // Capture the error
                      callback(e);
                    }
                  })();
                },
              });
            }
          }
        }

        break;
    }

    // No stream is available matching this type
    throw new Error(
      `Unrecognised stream type: "${stream.type}". Implement this through the { factory } option when calling compose`
    );
  };

  const composeWithOptions = (
    definition: ComposableDefinition
  ): SupportedStream => {
    return compose(definition, { factory });
  };

  return composeWithOptions;
};

const isString = (str: any): str is String => {
  if (typeof str === "string") {
    return true;
  }
  return false;
};

const composition = (doc: Document, options?: Options) => {
  const resolvedDocument = (() => {
    if (isString(doc)) {
      return YAML.parse(doc, { merge: true });
    }

    return doc;
  })();

  // Doc version check
  const { version } = resolvedDocument || {};
  assert(
    version === 1 || version === "1.0" || version === "1.0.0",
    "Invalid source version, must be 1.0"
  );

  // Build and execute the compose
  return createCompose(options)(resolvedDocument);
};

export default composition;
