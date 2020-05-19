import sanitizeHtml, { IOptions } from "sanitize-html";
import { TransformFunction, TransformOptions } from "../types";

export interface HtmlSanitizeOptions extends TransformOptions {
  configuration?: IOptions;
}

const htmlSanitize: TransformFunction<
  Promise<any>,
  HtmlSanitizeOptions
> = async (
  value: any,
  options: HtmlSanitizeOptions
): Promise<string | undefined> => {
  if (typeof value === "string") {
    return sanitizeHtml(value, options.configuration);
  }

  return undefined;
};

export default htmlSanitize;
