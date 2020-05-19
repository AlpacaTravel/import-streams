import { TransformFunction, TransformOptions } from "../../../types";
import text from "../../text";

export interface TelephoneOptions extends TransformOptions {}

const telephone: TransformFunction<
  Promise<string | undefined>,
  TelephoneOptions
> = async (
  value: any,
  options: TelephoneOptions
): Promise<string | undefined> => {
  return text(value, options);
};

export default telephone;
