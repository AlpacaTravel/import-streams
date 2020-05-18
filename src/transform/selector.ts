import { TransformFunction, TransformFunctionOptions } from "../types";
import assert from "assert";
import processSelector from "../selector";

interface TransformFactory {
  type: string;
  options?: any;
}

type SelectorPath = string | Array<string>;

type Transform = string | TransformFactory | Array<string | TransformFactory>;

export interface SelectorDefinition {
  selector?: SelectorPath;
  transform?: Transform;
}

type PathOrSelectorDefinition = Array<string> | string | SelectorDefinition;

export type Selector =
  | PathOrSelectorDefinition
  | Array<PathOrSelectorDefinition>;

export interface SelectorOptions extends TransformFunctionOptions {
  selector: Selector;
}

`
  title

  - title
  - selector: 
    - title
    - value
    transform: text
`;

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
          selector: input,
        };
      }
      if (Array.isArray(input)) {
        assert(
          input.every((i) => typeof i === "string"),
          "All selector paths should be strings"
        );
        return {
          selector: input,
        };
      }

      assert(
        typeof input.selector === "string" ||
          (Array.isArray(input.selector) &&
            input.selector.every((i) => typeof i === "string"),
          "Selector not correctly shaped, should be { selector: string | [string], transform?: ... }")
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
        const selectorsPaths = Array.isArray(selectorDefinition.selector)
          ? selectorDefinition.selector
          : [selectorDefinition.selector];

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
            !selectorDefinition.transform ||
            (Array.isArray(selectorDefinition.transform) &&
              !selectorDefinition.transform.length)
          ) {
            return raw;
          }

          // Process the streams
          const transformOptions = {
            context,
            transform: selectorDefinition.transform,
          };

          return context.transforms.transform(raw, transformOptions);
        }, Promise.resolve(undefined));
      })();
    },
    Promise.resolve(undefined)
  );
};

export default selector;
