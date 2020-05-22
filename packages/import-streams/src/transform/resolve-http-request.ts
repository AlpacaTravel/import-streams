import { TransformFunction, TransformOptions, Callback } from "../types";
import {
  createReadStream as createHttpRequestsReadStream,
  HttpRequestOptions,
} from "../read/http-request";
import { Writable } from "readable-stream";
import {
  createTransformStream as createMapSelectorTransformStream,
  Mapping,
  MapSelectorOptions,
} from "./map-selector";
import assert from "assert";

export interface ResolveHttpRequest extends TransformOptions {
  includeRouteGeometry?: boolean;
  iterate?: boolean;
  mapping?: Mapping;
  method?: string;
  url?: string;
  request?: HttpRequestOptions;
}

const resolveHttpRequest: TransformFunction<
  Promise<any | undefined>,
  ResolveHttpRequest
> = async (
  value: any,
  options: ResolveHttpRequest
): Promise<any | undefined> => {
  try {
    const records: any[] = [];

    // Resolve the journey json
    await new Promise((success, fail) => {
      const hasUrl = options && options.url != null;
      const urls = (hasUrl && options.url) || value;

      assert(urls, "Missing a url");

      // Build the subcall
      const httpRequestOptions: HttpRequestOptions = Object.assign(
        {},
        options.request
      );
      if (hasUrl && httpRequestOptions.data == null) {
        httpRequestOptions.data = value;
      }

      const readStream = createHttpRequestsReadStream(urls, httpRequestOptions);
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

export default resolveHttpRequest;
