import { TransformFunction, TransformOptions } from "../../../types";
import text from "../../html-text";

export interface EmailOptions extends TransformOptions {}

const boolean: TransformFunction<
  Promise<string | undefined>,
  EmailOptions
> = async (value: any, options: EmailOptions): Promise<string | undefined> => {
  return text(value, options);
};

export default boolean;
