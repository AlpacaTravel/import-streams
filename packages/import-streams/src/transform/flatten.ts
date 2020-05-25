import { TransformFunction, TransformOptions } from "../types";
import { assertValidTransformOptions } from "../assertions";

export interface FlattenOptions extends TransformOptions {
  key?: string;
  each?: boolean;
}

const flatten: TransformFunction<Promise<any>, FlattenOptions> = async (
  value: any,
  options: FlattenOptions
): Promise<any> => {
  assertValidTransformOptions(options, ["key", "each"], "flatten");

  if (Array.isArray(value) && options.each === true) {
    return value.map((v) => {
      const key = (options && options.key) || Object.keys(v)[0];
      if (!key) {
        return undefined;
      }

      return v[key];
    });
  }

  if (typeof value === "object" && value != null) {
    const key = (options && options.key) || Object.keys(value)[0];
    if (!key) {
      return undefined;
    }

    return value[key];
  }

  return undefined;
};

export default flatten;
