import striptags from "striptags";
import { TransformFunction, TransformOptions } from "../types";

export interface HtmlTextOptions extends TransformOptions {}

const htmlText: TransformFunction<Promise<any>, HtmlTextOptions> = async (
  value: any,
  options: HtmlTextOptions
): Promise<string | undefined> => {
  if (typeof value === "string") {
    const newValue = striptags(value).trim();
    if (newValue.length) {
      return newValue;
    }
    return undefined;
  }

  return undefined;
};

export default htmlText;
