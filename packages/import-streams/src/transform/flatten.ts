import { TransformFunction, TransformOptions } from "../types";

export interface FlattenOptions extends TransformOptions {
  key?: string;
}

const flatten: TransformFunction<Promise<any>, FlattenOptions> = async (
  value: any,
  options: FlattenOptions
): Promise<any> => {
  if (Array.isArray(value)) {
    return value.map((v) => {
      const key = (options && options.key) || Object.keys(v)[0];
      if (!key) {
        return undefined;
      }

      return v[key];
    });
  }

  if (typeof value === "object") {
    const key = (options && options.key) || Object.keys(value)[0];
    if (!key) {
      return undefined;
    }

    return value[key];
  }

  return undefined;
};

export default flatten;
