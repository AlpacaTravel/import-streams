import assert from "assert";
import { TransformFunction, TransformOptions } from "../../types";
import {
  createTransformStream as createMapSelectorTransformStream,
  MapSelectorOptions,
  Mapping,
} from "../map-selector";
import { createReadStream } from "../../read/json-api-data";
import { Writable } from "stream";

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
  mapping?: Mapping;
}

type Callback = (error?: Error, data?: any) => undefined;

const resolveMapSelector: TransformFunction<
  Promise<any | undefined>,
  ResolveMapSelectorOptions
> = async (
  value: JsonApiReference | undefined,
  options: ResolveMapSelectorOptions
): Promise<any | undefined> => {
  // Identify the resolve end-point
  const href = () => {
    // Check for the options href
    if (options && options.href) {
      return options.href;
    }

    // Check for the value
    if (value) {
      if (typeof value === "string") {
        return value;
      }

      if (
        typeof value === "object" &&
        value.links &&
        value.links.related &&
        value.links.related.href &&
        value.links.related.href === "string"
      ) {
        return value.links.related.href;
      }
    }

    return undefined;
  };

  try {
    // Read in data from JSON:API
    assert(href && typeof href === "string", "Missing a resolved href");

    const records: Array<any> = [];

    // Read and collate streams
    const readStream = createReadStream(href);
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
          { mapping: {} },
          options
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
    console.error(e);
  }

  return undefined;
};

export default resolveMapSelector;
