import assert from "assert";
import { Readable, Writable, Transform, Stream } from "readable-stream";
import {
  ComposableDefinition,
  SupportedStream,
} from "@alpaca-travel/import-streams-compose";
import { TransformFunction, TransformFunctionOptions } from "../types";
import processSelector from "../selector";
import { assertValidKeys } from "../assertions";

type SelectorPath = string | Array<string>;

export interface SelectorDefinition {
  path?: SelectorPath;
  transform?: ComposableDefinition;
}

type PathOrSelectorDefinition = Array<string> | string | SelectorDefinition;

export type Selector =
  | PathOrSelectorDefinition
  | Array<PathOrSelectorDefinition>;

export interface SelectorOptions extends TransformFunctionOptions {
  selector: Selector;
}

const isComposableDefinition = (doc: any): doc is ComposableDefinition => {
  if (typeof doc === "undefined") {
    return false;
  }
  return true;
};

const isReadable = (stream: SupportedStream): stream is Readable => {
  if (stream instanceof Readable || stream instanceof Transform) {
    return true;
  }
  return false;
};

const isWritable = (stream: any): stream is Writable => {
  if (stream instanceof Writable) {
    return true;
  }
  if ("writable" in stream && stream instanceof Stream) {
    return false;
  }
  return false;
};

const selector: TransformFunction<Promise<any>, SelectorOptions> = async (
  value: any,
  options: SelectorOptions
): Promise<any> => {
  const { selector: optionsSelector, context } = options;

  // Wrap selectors to be consistent
  const pathOrSelectorDefinitions = (() => {
    if (!Array.isArray(optionsSelector)) {
      return [optionsSelector];
    }
    return optionsSelector;
  })();

  // Map to standard SelectorDefinitions
  const selectorDefinitions: Array<SelectorDefinition> = pathOrSelectorDefinitions.map(
    (input: PathOrSelectorDefinition) => {
      if (typeof input === "string") {
        return {
          path: input,
        };
      }
      if (Array.isArray(input)) {
        assert(
          input.every((i) => typeof i === "string"),
          "All selector paths should be strings"
        );
        return {
          path: input,
        };
      }

      assert(
        typeof input.path === "string" ||
          (Array.isArray(input.path) &&
            input.path.every((i) => typeof i === "string"),
          "Selector not correctly shaped, should be { path: string | [string], transform?: ... }")
      );

      assertValidKeys(
        input,
        ["path", "transform"],
        `Ensure that the selector provided only contains the keys: [path:string|string[], transform:transform|transform[]]. Instead supplied keys: ${Object.keys(
          input
        )}`
      );

      return input;
    }
  );

  // Process each selector
  return selectorDefinitions.reduce(
    async (prior: Promise<any>, selectorDefinition: SelectorDefinition) => {
      const val = await prior;
      if (typeof val !== "undefined") {
        return val;
      }

      // Get a value using the path/or/selector with transform
      return (async () => {
        const selectorsPaths = Array.isArray(selectorDefinition.path)
          ? selectorDefinition.path
          : [selectorDefinition.path];

        // Search for the first selector path that returns a value, eventually returning undefined
        return selectorsPaths.reduce(async (prior, path) => {
          const result = await prior;
          if (typeof result !== "undefined") {
            return result;
          }

          // Process the raw value
          // "." as default path (for all)
          const raw = processSelector(path || ".", value);

          // Process the raw value with a series of transformations if defined
          if (
            !isComposableDefinition(selectorDefinition.transform) ||
            !selectorDefinition.transform ||
            (Array.isArray(selectorDefinition.transform) &&
              !selectorDefinition.transform.length)
          ) {
            return raw;
          }

          // Process the definition
          let streamResult = undefined;
          await new Promise((success, fail) => {
            // Compose a stream based on the selector transforms
            if (isComposableDefinition(selectorDefinition.transform)) {
              // Ensure we have compose
              const { compose } = context;
              assert(
                typeof compose === "function",
                "Should have received the compose function in context"
              );

              // Compose our stream
              const stream = compose({
                stream: [
                  // Make our reader the start of the stream
                  new Readable({
                    objectMode: true, // TODO: Should we optionalise this against selector options?
                    read() {
                      this.push(raw); // <- The value to transform
                      this.push(null);
                    },
                  }),

                  // Include the next transform pipeline
                  selectorDefinition.transform,

                  // Finalise back into our writer
                  new Writable({
                    objectMode: true,
                    write(chunk, _, callback) {
                      streamResult = chunk; // <- The result of the transform
                      callback();
                    },
                  }),
                ],
              });

              stream.on("finish", success).on("error", fail);
            } else {
              // Return the raw result
              streamResult = raw;
              success();
            }
          });

          // Return the result of the stream
          return streamResult;
        }, Promise.resolve(undefined));
      })();
    },
    Promise.resolve(undefined)
  );
};

export default selector;
