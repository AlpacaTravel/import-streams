import { TransformFunction, TransformOptions } from "../types";
import { assertValidTransformOptions } from "../assertions";
import URI from "urijs";

export interface ToUrlOptions extends TransformOptions {
  prefix?: string;
  lowercaseHostname?: boolean;
  useUndefinedOnError?: boolean;
}

const toUrl: TransformFunction<Promise<any>, ToUrlOptions> = async (
  value: any,
  options: ToUrlOptions
): Promise<string | undefined> => {
  assertValidTransformOptions(
    options,
    ["prefix", "lowercaseHostname", "useUndefinedOnError"],
    "url"
  );
  try {
    if (typeof value === "string") {
      let newValue = value;
      if (options && options.prefix) {
        newValue = `${options.prefix}${newValue}`;
      }

      if (!/^https?:\/\//.test(newValue)) {
        newValue = `http://${newValue}`;
      }

      // Parse the URI
      const parsed = new URI(newValue);

      // Support the option to lowercase hostname
      if (options.lowercaseHostname === true) {
        return parsed
          .hostname(parsed.hostname().toLocaleLowerCase())
          .toString();
      }

      return parsed.toString();
    }
  } catch (e) {
    if (options.debug === true) {
      console.error(e);
    }
    if (options.useUndefinedOnError === true) {
      return undefined;
    }
    throw e;
  }

  return undefined;
};

export default toUrl;
