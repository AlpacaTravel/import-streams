import prettier, { ParserOptions } from "prettier";
import { TransformFunction, TransformOptions } from "../types";
import { assertValidTransformOptions } from "../assertions";

export interface HtmlPrettierOptions extends TransformOptions {
  configuration?: ParserOptions;
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

  const parserOptions = Object.assign(
    {},
    { parser: "html" },
    options.configuration
  );

  if (typeof value === "string") {
    return prettier.format(value, parserOptions);
  }

  return undefined;
};

export default htmlPrettier;
