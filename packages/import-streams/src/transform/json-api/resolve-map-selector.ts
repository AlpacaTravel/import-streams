import assert from "assert";
import { Writable } from "readable-stream";
import { TransformFunction, TransformOptions, Callback } from "../../types";
import {
  createTransformStream as createMapSelectorTransformStream,
  MapSelectorOptions,
  Mapping,
} from "../map-selector";
import { createReadStream } from "../../read/json-api-data";
import { assertValidTransformOptions } from "../../assertions";

interface JsonApiHref {
  href: string;
}

interface JsonApiLinks {
  related: JsonApiHref;
  self: JsonApiHref;
}

interface JsonApiReference {
  data: Array<any>;
  links: JsonApiLinks;
}

export interface ResolveMapSelectorOptions extends TransformOptions {
  iterate?: boolean;
  href?: string;
  limit?: number;
  mapping?: Mapping;
  template?: any;
  attributeLocale?: string;
  retry?: number;
  wait?: number;
}

const resolveMapSelector: TransformFunction<
  Promise<any | undefined>,
  ResolveMapSelectorOptions
> = async (
  value: JsonApiReference | undefined,
  options: ResolveMapSelectorOptions
): Promise<any | undefined> => {
  assertValidTransformOptions(
    options,
    [
      "iterate",
      "href",
      "limit",
      "mapping",
      "template",
      "attributeLocale",
      "retry",
      "wait",
    ],
    "json-api.resolve-map-selector"
  );
  // Identify the resolve end-point
  const href = (() => {
    // Check for the options href
    if (options && typeof options.href === "string") {
      return options.href;
    }

    // Check for the value
    if (typeof value === "string") {
      return value;
    }

    if (value?.links?.related?.href) {
      return value.links.related.href;
    }

    return undefined;
  })();

  if (!href) {
    return undefined;
  }

  try {
    // Read in data from JSON:API
    assert(href && typeof href === "string", "Missing a resolved href");

    const records: Array<any> = [];

    // Read and collate streams
    const readStream = createReadStream(href, {
      limit: options.limit,
      wait: options.wait,
      retry: options.retry,
    });
    const collatorStream = new Writable({
      objectMode: true,
      write: (chunk: any, _, callback: Callback) => {
        records.push(chunk);
        callback();
      },
    });

    // Optionally chain with mapping
    if (typeof options.mapping !== "undefined") {
      await new Promise((success, error) => {
        // Include the map stream
        const mapSelectorOptions: MapSelectorOptions = Object.assign(
          {},
          {
            mapping: options.mapping || {},
            context: options.context,
            debug: options.debug,
            template: options.template,
            attributeLocale: options.attributeLocale,
          }
        );

        // Establish our streams
        const mapStream = createMapSelectorTransformStream(mapSelectorOptions);

        // Stream
        readStream
          .pipe(mapStream)
          .on("error", error)
          .pipe(collatorStream)
          .on("finish", success)
          .on("error", error);
      });
    } else {
      await new Promise((success, error) => {
        readStream
          .pipe(collatorStream)
          .on("finish", success)
          .on("error", error);
      });
    }

    if (options.iterate === false) {
      return records[0];
    }

    return records;
  } catch (e) {
    throw e;
  }
};

export default resolveMapSelector;
