import prettier, { ParserOptions } from "prettier";
import { TransformFunction, TransformOptions } from "../types";

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
