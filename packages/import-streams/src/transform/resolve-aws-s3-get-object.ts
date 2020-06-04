import { TransformFunction, TransformOptions, Callback } from "../types";
import { createReadStream as createAwsS3GetObject } from "../read/aws-s3-get-object";
import { Writable } from "readable-stream";
import {
  createTransformStream as createMapSelectorTransformStream,
  Mapping,
  MapSelectorOptions,
} from "./map-selector";
import assert from "assert";
import { assertValidTransformOptions } from "../assertions";

export interface ResolveAwsS3GetObjectOptions extends TransformOptions {
  iterate?: boolean;
  mapping?: Mapping;
  region?: string;
  path?: string;
  bucket?: string;
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
}

const resolveAwsS3GetObject: TransformFunction<
  Promise<any | undefined>,
  ResolveAwsS3GetObjectOptions
> = async (
  value: any,
  options: ResolveAwsS3GetObjectOptions
): Promise<any | undefined> => {
  assertValidTransformOptions(
    options,
    ["iterate", "mapping", "region", "path", "encoding", "parseJson", "bucket"],
    "resolve-aws-s3-get-object"
  );
  try {
    const records: any[] = [];

    // Resolve the journey json
    await new Promise((success, fail) => {
      const [bucket, key] = (() => {
        if (value && typeof value === "object") {
          const { Bucket, bucket, Key, key } = value;
          return [Bucket || bucket || options.bucket, Key, key];
        }
        return [];
      })();

      assert(bucket, "Requires a bucket");
      assert(key, "Requires a key");

      // Build the options
      const awsS3GetObjectOptions = {
        region: options.region,
        iterate: options.iterate,
        path: options.path,
        encoding: options.encoding,
        parseJson: options.parseJson,
        debug: options.debug,
      };

      const readStream = createAwsS3GetObject(
        bucket,
        key,
        awsS3GetObjectOptions
      );
      const collatorStream = new Writable({
        objectMode: true,
        write(response: any, _: string, callback: Callback) {
          records.push(response);
          callback();
        },
      });
      if (typeof options.mapping !== "undefined") {
        // Include the mapping
        const mapSelectorOptions: MapSelectorOptions = Object.assign(
          {},
          { mapping: {} },
          { mapping: options.mapping, context: options.context }
        );

        // Establish our streams
        const mapStream = createMapSelectorTransformStream(mapSelectorOptions);

        // Stream
        readStream
          .pipe(mapStream)
          .on("error", fail)
          .pipe(collatorStream)
          .on("finish", success)
          .on("error", fail);
      } else {
        readStream.pipe(collatorStream).on("finish", success).on("error", fail);
      }
    });

    if (options.iterate === false) {
      return records[0];
    }

    return records;
  } catch (e) {
    throw e;
  }
};

export default resolveAwsS3GetObject;
