import { TransformFunction, TransformOptions } from "../../../types";
import text, { TextOptions } from "../../text";

export interface TextPlainOptions extends TextOptions {}

const textPlain: TransformFunction<
  Promise<string | undefined>,
  TextPlainOptions
> = async (
  value: any,
  options: TextPlainOptions
): Promise<string | undefined> => {
  return text(value, options);
};

export default textPlain;
