import { TransformFunction, TransformOptions } from "../types";
import { assertValidTransformOptions } from "../assertions";

export interface UrlOptions extends TransformOptions {
  prefix?: string;
}

const url: TransformFunction<Promise<any>, UrlOptions> = async (
  value: any,
  options: UrlOptions
): Promise<string | undefined> => {
  assertValidTransformOptions(options, ["prefix"], "url");
  if (typeof value === "string") {
    let newValue = value;
    if (options && options.prefix) {
      newValue = `${options.prefix}${newValue}`;
    }

    if (!/^https?:\/\//.test(newValue)) {
      newValue = `http://${newValue}`;
    }

    return newValue;
  }

  return value;
};

export default url;
