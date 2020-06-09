import { TransformFunction } from "../../../types";
import text, { HtmlTextOptions } from "../../html-text";

export interface TextPlainOptions extends HtmlTextOptions {}

const textPlain: TransformFunction<
  Promise<string | undefined>,
  HtmlTextOptions
> = async (
  value: any,
  options: HtmlTextOptions
): Promise<string | undefined> => {
  return text(value, options);
};

export default textPlain;
