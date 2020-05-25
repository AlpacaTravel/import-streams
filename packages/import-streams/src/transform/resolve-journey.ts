import { TransformFunction, TransformOptions, Callback } from "../types";
import { createReadStream as createJourneysReadStream } from "../read/journey";
import { Writable } from "readable-stream";
import {
  createTransformStream as createMapSelectorTransformStream,
  Mapping,
  MapSelectorOptions,
} from "./map-selector";
import { assertValidTransformOptions } from "../assertions";

export interface ResolveJourneyOptions extends TransformOptions {
  includeRouteGeometry?: boolean;
  iterate: false;
  mapping?: Mapping;
}

const resolveJourneyJson: TransformFunction<
  Promise<any[] | any | undefined>,
  ResolveJourneyOptions
> = async (
  value: any,
  options: ResolveJourneyOptions
): Promise<any[] | any | undefined> => {
  assertValidTransformOptions(
    options,
    ["includeRouteGeometry", "iterate", "mapping"],
    "resolve-journey-json"
  );
  try {
    const records: any[] = [];

    // Resolve the journey json
    await new Promise((success, fail) => {
      const readStream = createJourneysReadStream(value);
      const collatorStream = new Writable({
        objectMode: true,
        write(result: any, _: string, callback: Callback) {
          records.push(result);
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

export default resolveJourneyJson;
