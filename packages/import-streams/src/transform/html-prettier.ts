import prettier, { ParserOptions } from "prettier";
import { TransformFunction, TransformOptions } from "../types";
import { assertValidTransformOptions } from "../assertions";

export interface HtmlPrettierOptions extends TransformOptions {
  configuration?: ParserOptions;
  useUndefinedOnError?: boolean;
}

const htmlPrettier: TransformFunction<
  Promise<any>,
  HtmlPrettierOptions
> = async (
  value: any,
  options: HtmlPrettierOptions
): Promise<string | undefined> => {
  assertValidTransformOptions(
    options,
    ["configuration", "context", "debug"],
    "html-prettier"
  );
  try {
    const parserOptions = Object.assign(
      {},
      { parser: "html" },
      options.configuration
    );

    if (typeof value === "string") {
      return prettier.format(value, parserOptions);
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

export default htmlPrettier;
