import { TransformFunction, TransformOptions, Callback } from "../types";
import {
  createReadStream as createSqliteStatementObjectReadStream,
  SqliteStatementObjectOptions,
} from "../read/sqlite-statement-object";
import { Writable } from "readable-stream";
import {
  createTransformStream as createMapSelectorTransformStream,
  Mapping,
  MapSelectorOptions,
} from "./map-selector";
import assert from "assert";
import { assertValidTransformOptions } from "../assertions";

export interface ResolveSqliteStatementObjectOptions extends TransformOptions {
  mapping?: Mapping;
  database: string;
  sql: string;
  debug?: boolean;
  iterate?: boolean;
  useUndefinedOnError?: boolean;
  passThroughValue?: boolean;
}

const resolveSqliteStatementObject: TransformFunction<
  Promise<any | undefined>,
  ResolveSqliteStatementObjectOptions
> = async (
  value: any,
  options: ResolveSqliteStatementObjectOptions
): Promise<any | undefined> => {
  assertValidTransformOptions(
    options,
    [
      "mapping",
      "database",
      "sql",
      "debug",
      "iterate",
      "useUndefinedOnError",
      "passThroughValue",
    ],
    "resolve-sqlite-statement-object"
  );
  try {
    const records: any[] = [];

    // Resolve the journey json
    await new Promise((success, fail) => {
      const { database, sql, debug = false } = options;

      assert(database, "Missing a database");
      assert(sql, "Missing sql");

      // Build the subcall
      const subcallOptions: SqliteStatementObjectOptions = {
        sql,
        database,
        debug,
        params: value,
      };

      const readStream = createSqliteStatementObjectReadStream(subcallOptions);
      readStream.on("error", fail);
      const collatorStream = new Writable({
        objectMode: true,
        write(chunk: any, _: string, callback: Callback) {
          records.push(chunk);
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

    if (options.passThroughValue === true) {
      return value;
    }

    if (options.iterate === false) {
      return records[0];
    }

    return records;
  } catch (e) {
    console.log(e);
    if (options && options.useUndefinedOnError) {
      return undefined;
    } else {
      throw e;
    }
  }
};

export default resolveSqliteStatementObject;
