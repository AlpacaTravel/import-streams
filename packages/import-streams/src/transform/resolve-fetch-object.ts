import { TransformFunction, TransformOptions, Callback } from "../types";
import {
  createReadStream as createFetchObjectReadStream,
  FetchObjectOptions,
} from "../read/fetch-object";
import { Writable } from "readable-stream";
import {
  createTransformStream as createMapSelectorTransformStream,
  Mapping,
  MapSelectorOptions,
} from "./map-selector";
import assert from "assert";
import { assertValidTransformOptions } from "../assertions";

export interface ResolveFetchObjectOptions extends TransformOptions {
  iterate?: boolean;
  mapping?: Mapping;
  method?: string;
  url?: string;
  request?: FetchObjectOptions;
  useUndefinedOnError?: boolean;
}

const resolveFetchObject: TransformFunction<
  Promise<any | undefined>,
  ResolveFetchObjectOptions
> = async (
  value: any,
  options: ResolveFetchObjectOptions
): Promise<any | undefined> => {
  assertValidTransformOptions(
    options,
    ["iterate", "mapping", "method", "url", "request"],
    "resolve-fetch-object"
  );
  try {
    const records: any[] = [];

    // Resolve the journey json
    await new Promise((success, fail) => {
      const hasUrl = options && options.url != null;
      const urls = (hasUrl && options.url) || value;

      assert(urls, "Missing a url");

      // Build the subcall
      const httpRequestOptions: FetchObjectOptions = Object.assign(
        {},
        options.request
      );
      if (hasUrl && httpRequestOptions.data == null) {
        httpRequestOptions.data = value;
      }

      const readStream = createFetchObjectReadStream(urls, httpRequestOptions);
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
    if (options && options.useUndefinedOnError) {
      return undefined;
    } else {
      throw e;
    }
  }
};

export default resolveFetchObject;
