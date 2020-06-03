import { TransformFunction, TransformOptions } from "../types";
import { assertValidTransformOptions } from "../assertions";
import URI from "urijs";

export interface UrlOptions extends TransformOptions {
  prefix?: string;
  lowercaseHostname?: boolean;
}

const url: TransformFunction<Promise<any>, UrlOptions> = async (
  value: any,
  options: UrlOptions
): Promise<string | undefined> => {
  assertValidTransformOptions(options, ["prefix", "lowercaseHostname"], "url");
  if (typeof value === "string") {
    let newValue = value;
    if (options && options.prefix) {
      newValue = `${options.prefix}${newValue}`;
    }

    if (!/^https?:\/\//.test(newValue)) {
      newValue = `http://${newValue}`;
    }

    // Support the option to lowercase hostname
    if (options.lowercaseHostname === true) {
      const parsed = new URI(newValue);
      return parsed.hostname(parsed.hostname().toLocaleLowerCase()).toString();
    }

    return newValue;
  }

  return undefined;
};

export default url;
